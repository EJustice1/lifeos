'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getBuckets(includeArchived = false) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  let query = supabase
    .from('buckets')
    .select('*')
    .eq('user_id', user.id)
    .order('name')

  if (!includeArchived) {
    query = query.eq('is_archived', false)
  }

  const { data } = await query
  return data ?? []
}

export async function createBucket(
  name: string,
  type: 'class' | 'lab' | 'project' | 'work' | 'other',
  color = '#3b82f6'
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('buckets')
    .insert({
      user_id: user.id,
      name,
      type,
      color,
    })
    .select()
    .single()

  if (error) throw error
  revalidatePath('/m/study')
  revalidatePath('/d/career')
  return data
}

export async function archiveBucket(bucketId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('buckets')
    .update({ is_archived: true })
    .eq('id', bucketId)

  if (error) throw error
  revalidatePath('/d/career')
}

export async function startStudySession(bucketId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const now = new Date()
  const { data, error } = await supabase
    .from('study_sessions')
    .insert({
      user_id: user.id,
      bucket_id: bucketId,
      date: now.toISOString().split('T')[0],
      started_at: now.toISOString(),
    })
    .select()
    .single()

  if (error) throw error
  revalidatePath('/m/study')
  return data
}

export async function deleteStudySession(sessionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('study_sessions')
    .delete()
    .eq('id', sessionId)
    .eq('user_id', user.id)

  // Ignore "not found" errors - session might have already been deleted or never created
  if (error && error.code !== 'PGRST116') throw error
  revalidatePath('/m/study')
}

export async function endStudySession(sessionId: string, notes?: string, endedAt?: string) {
  const supabase = await createClient()

  // Get the session to calculate duration
  const { data: session } = await supabase
    .from('study_sessions')
    .select('started_at')
    .eq('id', sessionId)
    .single()

  if (!session) throw new Error('Session not found')

  // Use provided endedAt timestamp or current time
  const endTime = endedAt ? new Date(endedAt) : new Date()
  const started = new Date(session.started_at)
  const durationMinutes = Math.round((endTime.getTime() - started.getTime()) / 60000)

  // Client-side handles sessions < 1 minute, so this should always have duration >= 1

  const { error } = await supabase
    .from('study_sessions')
    .update({
      ended_at: endTime.toISOString(),
      duration_minutes: durationMinutes,
      notes,
    })
    .eq('id', sessionId)

  if (error) throw error
  revalidatePath('/m/study')
  revalidatePath('/d/career')
}

export async function logCompletedSession(
  bucketId: string,
  durationMinutes: number,
  notes?: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Don't save if no time was logged (this is for manual entry, so keep validation)
  if (!durationMinutes || durationMinutes <= 0) {
    throw new Error('Cannot log session with no time')
  }

  const now = new Date()
  const started = new Date(now.getTime() - durationMinutes * 60000)

  const { data, error } = await supabase
    .from('study_sessions')
    .insert({
      user_id: user.id,
      bucket_id: bucketId,
      date: now.toISOString().split('T')[0],
      started_at: started.toISOString(),
      ended_at: now.toISOString(),
      duration_minutes: durationMinutes,
      notes,
    })
    .select()
    .single()

  if (error) throw error
  revalidatePath('/m/study')
  revalidatePath('/d/career')
  return data
}

export async function getTodaySessions() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const today = new Date().toISOString().split('T')[0]

  const { data } = await supabase
    .from('study_sessions')
    .select(`
      *,
      bucket:buckets(name, color)
    `)
    .eq('user_id', user.id)
    .eq('date', today)
    .order('started_at', { ascending: false })

  return data ?? []
}

export async function getWeeklyStats() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const today = new Date()
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

  const { data: sessions } = await supabase
    .from('study_sessions')
    .select(`
      duration_minutes,
      bucket:buckets(name, color)
    `)
    .eq('user_id', user.id)
    .gte('date', weekAgo.toISOString().split('T')[0])

  if (!sessions) return null

  const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0)

  const byBucket = sessions.reduce((acc, s) => {
    // Supabase returns joined relations - handle both object and array types
    const bucket = s.bucket as { name?: string; color?: string } | { name?: string; color?: string }[] | null
    const bucketData = Array.isArray(bucket) ? bucket[0] : bucket
    const name = bucketData?.name ?? 'Unknown'
    if (!acc[name]) acc[name] = { minutes: 0, color: bucketData?.color ?? '#3b82f6' }
    acc[name].minutes += s.duration_minutes || 0
    return acc
  }, {} as Record<string, { minutes: number; color: string }>)

  return {
    totalMinutes,
    totalHours: Math.round(totalMinutes / 60 * 10) / 10,
    dailyAverage: Math.round(totalMinutes / 7),
    byBucket,
  }
}

export async function getStudyHeatmap(weeks = 13) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - weeks * 7)

  const { data } = await supabase
    .from('study_sessions')
    .select('date, duration_minutes')
    .eq('user_id', user.id)
    .gte('date', startDate.toISOString().split('T')[0])

  if (!data) return []

  // Aggregate by date
  const byDate = data.reduce((acc, s) => {
    if (!acc[s.date]) acc[s.date] = 0
    acc[s.date] += s.duration_minutes || 0
    return acc
  }, {} as Record<string, number>)

  return Object.entries(byDate).map(([date, minutes]) => ({
    date,
    minutes,
    level: minutes === 0 ? 0 : minutes < 30 ? 1 : minutes < 60 ? 2 : minutes < 120 ? 3 : 4,
  }))
}
