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

