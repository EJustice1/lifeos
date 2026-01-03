'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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

  return {
    total: cash + investments,
    cash,
    investments,
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
