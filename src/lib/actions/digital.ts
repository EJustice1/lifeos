'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getTodayScreenTime() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const today = new Date().toISOString().split('T')[0]

  const { data } = await supabase
    .from('screen_time')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', today)
    .single()

  return data
}

export async function logScreenTime(
  productiveMinutes: number,
  distractedMinutes: number,
  mobileMinutes = 0,
  desktopMinutes = 0
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('screen_time')
    .upsert({
      user_id: user.id,
      date: today,
      productive_minutes: productiveMinutes,
      distracted_minutes: distractedMinutes,
      mobile_minutes: mobileMinutes,
      desktop_minutes: desktopMinutes,
      source: 'manual',
    })
    .select()
    .single()

  if (error) throw error
  revalidatePath('/d/digital')
  return data
}

export async function logAppUsage(
  appName: string,
  category: 'productive' | 'neutral' | 'distracted',
  minutes: number
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('app_usage')
    .insert({
      user_id: user.id,
      date: today,
      app_name: appName,
      category,
      minutes,
    })
    .select()
    .single()

  if (error) throw error
  revalidatePath('/d/digital')
  return data
}

export async function getWeeklyScreenTime() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  const { data } = await supabase
    .from('screen_time')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', weekAgo.toISOString().split('T')[0])
    .order('date')

  return data ?? []
}

export async function getDigitalStats(days = 7) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data: screenData } = await supabase
    .from('screen_time')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', startDate.toISOString().split('T')[0])

  if (!screenData || screenData.length === 0) return null

  const totalProductive = screenData.reduce((sum, d) => sum + d.productive_minutes, 0)
  const totalDistracted = screenData.reduce((sum, d) => sum + d.distracted_minutes, 0)
  const totalMobile = screenData.reduce((sum, d) => sum + d.mobile_minutes, 0)
  const totalDesktop = screenData.reduce((sum, d) => sum + d.desktop_minutes, 0)
  const total = totalProductive + totalDistracted

  return {
    totalMinutes: total,
    productiveMinutes: totalProductive,
    distractedMinutes: totalDistracted,
    productivityRate: total > 0 ? Math.round((totalProductive / total) * 100) : 0,
    mobileMinutes: totalMobile,
    desktopMinutes: totalDesktop,
    avgDailyTotal: Math.round(total / screenData.length),
    daysTracked: screenData.length,
  }
}

export async function getTopApps(days = 7, limit = 10) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data } = await supabase
    .from('app_usage')
    .select('app_name, category, minutes')
    .eq('user_id', user.id)
    .gte('date', startDate.toISOString().split('T')[0])

  if (!data) return []

  // Aggregate by app
  const byApp = data.reduce((acc, usage) => {
    if (!acc[usage.app_name]) {
      acc[usage.app_name] = { minutes: 0, category: usage.category }
    }
    acc[usage.app_name].minutes += usage.minutes
    return acc
  }, {} as Record<string, { minutes: number; category: string }>)

  return Object.entries(byApp)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, limit)
}
