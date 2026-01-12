'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { calculateNextOccurrence } from '@/lib/utils/finance'

export async function getAccounts() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('name')

  return data ?? []
}

export async function createAccount(
  name: string,
  type: 'cash' | 'checking' | 'savings' | 'investment' | 'crypto' | 'other',
  balance = 0
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('accounts')
    .insert({
      user_id: user.id,
      name,
      type,
      balance,
    })
    .select()
    .single()

  if (error) throw error
  revalidatePath('/d/finance')
  return data
}

export async function logTransaction(
  date: string,
  type: 'income' | 'expense' | 'transfer',
  amount: number,
  category: string,
  description?: string,
  accountId?: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('transactions')
    .insert({
      user_id: user.id,
      date,
      type,
      amount,
      category,
      description,
      account_id: accountId,
    })
    .select()
    .single()

  if (error) throw error
  revalidatePath('/m/finance')
  revalidatePath('/d/finance')
  return data
}

export async function getRecentTransactions(limit = 20) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('transactions')
    .select(`
      *,
      account:accounts(name)
    `)
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(limit)

  return data ?? []
}

export async function getMonthlyStats(year: number, month: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = new Date(year, month, 0).toISOString().split('T')[0]

  const { data: transactions } = await supabase
    .from('transactions')
    .select('type, amount, category')
    .eq('user_id', user.id)
    .gte('date', startDate)
    .lte('date', endDate)

  if (!transactions) return null

  const income = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const expenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const byCategory = transactions.reduce((acc, t) => {
    if (!acc[t.category]) acc[t.category] = 0
    acc[t.category] += t.amount
    return acc
  }, {} as Record<string, number>)

  return {
    income,
    expenses,
    savings: income - expenses,
    savingsRate: income > 0 ? Math.round(((income - expenses) / income) * 100) : 0,
    byCategory,
  }
}

export async function getNetWorth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: accounts } = await supabase
    .from('accounts')
    .select('type, balance')
    .eq('user_id', user.id)
    .eq('is_active', true)

  if (!accounts) return null

  const cash = accounts
    .filter(a => ['cash', 'checking', 'savings'].includes(a.type))
    .reduce((sum, a) => sum + a.balance, 0)

  const investments = accounts
    .filter(a => ['investment', 'crypto'].includes(a.type))
    .reduce((sum, a) => sum + a.balance, 0)

  // Get stock holdings value
  const { data: stocks } = await supabase
    .from('stock_holdings')
    .select('shares, current_price')
    .eq('user_id', user.id)
    .eq('is_active', true)

  const stockValue = stocks?.reduce((sum, stock) => {
    return sum + (stock.shares * (stock.current_price ?? 0))
  }, 0) ?? 0

  return {
    total: cash + investments + stockValue,
    cash,
    investments: investments + stockValue,
    stockValue,
  }
}

export async function getNetWorthHistory(months = 12) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - months)

  const { data } = await supabase
    .from('net_worth_snapshots')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', startDate.toISOString().split('T')[0])
    .order('date')

  return data ?? []
}

export async function saveNetWorthSnapshot() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const netWorth = await getNetWorth()
  if (!netWorth) throw new Error('Could not calculate net worth')

  const today = new Date().toISOString().split('T')[0]

  const { error } = await supabase
    .from('net_worth_snapshots')
    .upsert({
      user_id: user.id,
      date: today,
      total_assets: netWorth.total,
      total_cash: netWorth.cash,
      total_investments: netWorth.investments,
    })

  if (error) throw error
  revalidatePath('/d/finance')
}

// Recurring Transaction Functions
export async function getRecurringTransactions() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('recurring_transactions')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('next_occurrence')

  return data ?? []
}

export async function createRecurringTransaction(
  name: string,
  type: 'income' | 'expense',
  amount: number,
  category: string,
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly',
  startDate: string,
  endDate?: string,
  accountId?: string,
  description?: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Calculate next occurrence based on frequency
  const nextOccurrence = calculateNextOccurrence(startDate, frequency)

  const { data, error } = await supabase
    .from('recurring_transactions')
    .insert({
      user_id: user.id,
      name,
      type,
      amount,
      category,
      description,
      account_id: accountId,
      start_date: startDate,
      end_date: endDate,
      frequency,
      is_active: true,
      next_occurrence: nextOccurrence,
    })
    .select()
    .single()

  if (error) throw error
  revalidatePath('/m/finance')
  revalidatePath('/d/finance')
  return data
}

export async function updateRecurringTransaction(
  id: string,
  updates: {
    name?: string
    amount?: number
    category?: string
    frequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly'
    startDate?: string
    endDate?: string
    isActive?: boolean
    description?: string
  }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('recurring_transactions')
    .update({
      name: updates.name,
      amount: updates.amount,
      category: updates.category,
      frequency: updates.frequency,
      start_date: updates.startDate,
      end_date: updates.endDate,
      is_active: updates.isActive,
      description: updates.description,
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) throw error
  revalidatePath('/m/finance')
  revalidatePath('/d/finance')
  return data
}

// Stock Holding Functions
export async function getStockHoldings() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('stock_holdings')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('symbol')

  return data ?? []
}

export async function addStockHolding(
  symbol: string,
  companyName: string,
  shares: number,
  averagePrice: number,
  accountId?: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('stock_holdings')
    .insert({
      user_id: user.id,
      symbol,
      company_name: companyName,
      shares,
      average_price: averagePrice,
      account_id: accountId,
      is_active: true,
    })
    .select()
    .single()

  if (error) throw error
  revalidatePath('/m/finance')
  revalidatePath('/d/finance')
  return data
}

export async function updateStockHolding(
  id: string,
  updates: {
    shares?: number
    currentPrice?: number
    accountId?: string
    isActive?: boolean
  }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('stock_holdings')
    .update({
      shares: updates.shares,
      current_price: updates.currentPrice,
      account_id: updates.accountId,
      is_active: updates.isActive,
      last_updated: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) throw error
  revalidatePath('/m/finance')
  revalidatePath('/d/finance')
  return data
}

// Account Balance Update Function
export async function updateAccountBalance(
  accountId: string,
  amount: number
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Validate amount
  if (isNaN(amount) || !isFinite(amount)) {
    throw new Error('Invalid amount value')
  }

  if (amount === 0) {
    return { id: accountId, balance: 0 } // No change needed
  }

  const { data, error } = await supabase
    .from('accounts')
    .update({ balance: supabase.rpc('increment_balance', { account_id: accountId, amount: amount }) })
    .eq('id', accountId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) throw error
  revalidatePath('/m/finance')
  revalidatePath('/d/finance')
  return data
}

// Cash Adjustment Functions
export async function logCashAdjustment(
  date: string,
  amount: number,
  reason: string,
  accountId?: string,
  notes?: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('cash_adjustments')
    .insert({
      user_id: user.id,
      date,
      amount,
      reason,
      account_id: accountId,
      notes,
    })
    .select()
    .single()

  if (error) throw error
  revalidatePath('/m/finance')
  revalidatePath('/d/finance')
  return data
}

// Enhanced Recurring Transaction Functions
export async function createEnhancedRecurringTransaction(
  name: string,
  transactionType: 'cash' | 'stock',
  cashType: 'deposit' | 'withdrawal' | null,
  stockType: 'buy' | 'sell' | null,
  amount: number,
  symbol: string | null,
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly',
  startDate: string,
  endDate?: string,
  accountId?: string,
  description?: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Calculate next occurrence based on frequency
  const nextOccurrence = calculateNextOccurrence(startDate, frequency)

  const { data, error } = await supabase
    .from('enhanced_recurring_transactions')
    .insert({
      user_id: user.id,
      name,
      transaction_type: transactionType,
      cash_type: cashType,
      stock_type: stockType,
      amount,
      symbol,
      frequency,
      start_date: startDate,
      end_date: endDate,
      account_id: accountId,
      description,
      is_active: true,
      next_occurrence: nextOccurrence,
    })
    .select()
    .single()

  if (error) throw error
  revalidatePath('/m/finance')
  revalidatePath('/d/finance')
  return data
}

// Asset Breakdown Data
export interface AssetBreakdownData {
  cash: number;
  stocks: number;
  cashByAccount: Record<string, number>;
  stocksBySymbol: Record<string, number>;
}

export async function getAssetBreakdownData(): Promise<AssetBreakdownData> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Get cash accounts
  const { data: cashAccounts } = await supabase
    .from('accounts')
    .select('id, name, balance')
    .eq('user_id', user.id)
    .in('type', ['cash', 'checking', 'savings'])
    .eq('is_active', true)

  // Get investment accounts and stock holdings
  const { data: investmentAccounts } = await supabase
    .from('accounts')
    .select('id, name, balance')
    .eq('user_id', user.id)
    .in('type', ['investment', 'crypto'])
    .eq('is_active', true)

  const { data: stockHoldings } = await supabase
    .from('stock_holdings')
    .select('symbol, shares, current_price')
    .eq('user_id', user.id)
    .eq('is_active', true)

  // Calculate breakdown
  const cashByAccount: Record<string, number> = {}
  let totalCash = 0

  cashAccounts?.forEach(account => {
    cashByAccount[account.name] = account.balance
    totalCash += account.balance
  })

  const stocksBySymbol: Record<string, number> = {}
  let totalStocks = 0

  investmentAccounts?.forEach(account => {
    if (account.balance > 0) {
      stocksBySymbol[`${account.name} (account)`] = account.balance
      totalStocks += account.balance
    }
  })

  stockHoldings?.forEach(holding => {
    const value = holding.shares * (holding.current_price ?? 0)
    if (value > 0) {
      stocksBySymbol[holding.symbol] = value
      totalStocks += value
    }
  })

  return {
    cash: totalCash,
    stocks: totalStocks,
    cashByAccount,
    stocksBySymbol
  }
}

// Asset Composition History
export interface AssetCompositionData {
  date: string;
  cash: number;
  stocks: number;
}

export async function getAssetCompositionHistory(months = 12): Promise<AssetCompositionData[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - months)

  const { data: snapshots } = await supabase
    .from('net_worth_snapshots')
    .select('date, total_cash, total_investments')
    .eq('user_id', user.id)
    .gte('date', startDate.toISOString().split('T')[0])
    .order('date')
    .limit(months + 1)

  if (!snapshots || snapshots.length === 0) return []

  return snapshots.map(snapshot => ({
    date: snapshot.date,
    cash: snapshot.total_cash || 0,
    stocks: snapshot.total_investments || 0,
  }))
}

// Unified Transaction Processing
export async function processUnifiedTransaction(
  transactionType: 'cash' | 'stock',
  cashType: 'deposit' | 'withdrawal' | null,
  stockType: 'buy' | 'sell' | null,
  amount: number,
  symbol: string | null,
  price: number | null,
  shares: number | null,
  accountId: string | null,
  date: string,
  isRecurring: boolean,
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly' | null,
  startDate: string | null,
  endDate: string | null,
  description: string | null
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Validate amount
  if (amount <= 0) {
    throw new Error('Amount must be positive')
  }

  // Validate date format
  try {
    new Date(date)
  } catch (e) {
    throw new Error('Invalid date format')
  }

  if (transactionType === 'cash') {
    if (!cashType || !accountId) {
      throw new Error('Cash transaction requires type and account')
    }

    // Process cash transaction
    const transactionData = {
      user_id: user.id,
      date,
      type: cashType === 'deposit' ? 'income' : 'expense',
      amount,
      category: cashType === 'deposit' ? 'Deposit' : 'Withdrawal',
      description: description || `${cashType.charAt(0).toUpperCase() + cashType.slice(1)}: $${amount}`,
      account_id: accountId,
    }

    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert(transactionData)
      .select()
      .single()

    if (transactionError) throw transactionError

    // Update account balance
    const accountUpdate = cashType === 'deposit' ? amount : -amount
    const { error: accountError } = await supabase
      .from('accounts')
      .update({ balance: supabase.rpc('increment_balance', { account_id: accountId, amount: accountUpdate }) })
      .eq('id', accountId)

    if (accountError) throw accountError

    // Handle recurring transaction if needed
    if (isRecurring && frequency && startDate) {
      await createEnhancedRecurringTransaction(
        `${cashType} - $${amount}`,
        'cash',
        cashType,
        null,
        amount,
        null,
        frequency,
        startDate,
        endDate || undefined,
        accountId,
        description || undefined
      )
    }

    revalidatePath('/m/finance')
    revalidatePath('/d/finance')
    return { success: true, transaction }

  } else if (transactionType === 'stock') {
    if (!stockType || !symbol || !price || !shares || !accountId) {
      throw new Error('Stock transaction requires all fields')
    }

    // Validate stock parameters
    if (price <= 0) {
      throw new Error('Stock price must be positive')
    }

    if (shares <= 0) {
      throw new Error('Number of shares must be positive')
    }

    if (!symbol || symbol.trim().length === 0) {
      throw new Error('Stock symbol is required')
    }

    // Process stock transaction
    const totalValue = price * shares

    if (isNaN(totalValue) || !isFinite(totalValue)) {
      throw new Error('Invalid total value calculation')
    }

    if (stockType === 'buy') {
      // Create or update stock holding
      const { data: existingHolding } = await supabase
        .from('stock_holdings')
        .select('*')
        .eq('user_id', user.id)
        .eq('symbol', symbol)
        .eq('account_id', accountId)
        .single()

      if (existingHolding) {
        // Update existing holding
        const newShares = existingHolding.shares + shares
        const newAveragePrice = ((existingHolding.average_price * existingHolding.shares) + (price * shares)) / newShares

        const { error: holdingError } = await supabase
          .from('stock_holdings')
          .update({
            shares: newShares,
            average_price: newAveragePrice,
            current_price: price,
            last_updated: new Date().toISOString()
          })
          .eq('id', existingHolding.id)

        if (holdingError) throw holdingError
      } else {
        // Create new holding
        const { error: holdingError } = await supabase
          .from('stock_holdings')
          .insert({
            user_id: user.id,
            symbol,
            company_name: symbol, // Will be updated via API
            shares,
            average_price: price,
            current_price: price,
            account_id: accountId,
            is_active: true
          })

        if (holdingError) throw holdingError
      }

      // Log the cash withdrawal for the purchase
      try {
        await logCashAdjustment(
          date,
          -totalValue,
          'Stock Purchase',
          accountId,
          `Purchase of ${shares} shares of ${symbol} at $${price}`
        )
      } catch (cashAdjustmentError) {
        console.error('Failed to log cash adjustment for stock purchase:', cashAdjustmentError)
        throw new Error('Failed to complete stock purchase: could not update cash balance')
      }

    } else if (stockType === 'sell') {
      // Find existing holding
      const { data: existingHolding } = await supabase
        .from('stock_holdings')
        .select('*')
        .eq('user_id', user.id)
        .eq('symbol', symbol)
        .eq('account_id', accountId)
        .single()

      if (!existingHolding) {
        throw new Error('No holding found for this stock')
      }

      if (existingHolding.shares < shares) {
        throw new Error('Not enough shares to sell')
      }

      const newShares = existingHolding.shares - shares

      if (newShares === 0) {
        // Sell all shares - mark as inactive
        const { error: holdingError } = await supabase
          .from('stock_holdings')
          .update({
            is_active: false,
            sold_date: date,
            sold_price: price
          })
          .eq('id', existingHolding.id)

        if (holdingError) throw holdingError
      } else {
        // Update holding with remaining shares
        const { error: holdingError } = await supabase
          .from('stock_holdings')
          .update({
            shares: newShares,
            current_price: price,
            last_updated: new Date().toISOString()
          })
          .eq('id', existingHolding.id)

        if (holdingError) throw holdingError
      }

      // Log the cash deposit from the sale
      try {
        await logCashAdjustment(
          date,
          totalValue,
          'Stock Sale',
          accountId,
          `Sale of ${shares} shares of ${symbol} at $${price}`
        )
      } catch (cashAdjustmentError) {
        console.error('Failed to log cash adjustment for stock sale:', cashAdjustmentError)
        throw new Error('Failed to complete stock sale: could not update cash balance')
      }
    }

    // Handle recurring transaction if needed
    if (isRecurring && frequency && startDate) {
      await createEnhancedRecurringTransaction(
        `${stockType} ${symbol} - ${shares} shares`,
        'stock',
        null,
        stockType,
        totalValue,
        symbol,
        frequency,
        startDate,
        endDate || undefined,
        accountId,
        description || undefined
      )
    }

    revalidatePath('/m/finance')
    revalidatePath('/d/finance')
    return { success: true, message: 'Stock transaction processed successfully' }
  }

  throw new Error('Invalid transaction type')
}

