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

  // CRITICAL: End any existing active sessions before starting a new one
  // This ensures only ONE active session exists at a time
  const { data: existingSessions } = await supabase
    .from('study_sessions')
    .select('id, started_at')
    .eq('user_id', user.id)
    .is('ended_at', null)

  if (existingSessions && existingSessions.length > 0) {
    const now = new Date()
    // End all active sessions
    for (const session of existingSessions) {
      const started = new Date(session.started_at)
      const durationMinutes = Math.round((now.getTime() - started.getTime()) / 60000)
      
      await supabase
        .from('study_sessions')
        .update({
          ended_at: now.toISOString(),
          duration_minutes: durationMinutes,
        })
        .eq('id', session.id)
        .eq('user_id', user.id)
    }
  }

  // Now create the new session
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

// Get active study session (where ended_at is null)
// Returns the most recent active session
export async function getActiveStudySession() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('study_sessions')
    .select(`
      *,
      bucket:buckets(id, name, color, type)
    `)
    .eq('user_id', user.id)
    .is('ended_at', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle() // Use maybeSingle to handle 0 or 1 results gracefully

  return data
}

/**
 * Force end all active study sessions for the current user
 * This is a cleanup function to handle orphaned sessions
 */
export async function endAllActiveStudySessions() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: activeSessions } = await supabase
    .from('study_sessions')
    .select('id, started_at')
    .eq('user_id', user.id)
    .is('ended_at', null)

  if (!activeSessions || activeSessions.length === 0) {
    return { count: 0 }
  }

  const now = new Date()
  let endedCount = 0

  for (const session of activeSessions) {
    const started = new Date(session.started_at)
    const durationMinutes = Math.round((now.getTime() - started.getTime()) / 60000)
    
    const { error } = await supabase
      .from('study_sessions')
      .update({
        ended_at: now.toISOString(),
        duration_minutes: durationMinutes,
      })
      .eq('id', session.id)
      .eq('user_id', user.id)

    if (!error) {
      endedCount++
    }
  }

  revalidatePath('/m/study')
  revalidatePath('/m/daily-context-review')
  
  return { count: endedCount }
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
  revalidatePath('/m/daily-context-review')
}

export async function endStudySession(sessionId: string, notes?: string, endedAt?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Get the session to calculate duration - ensure it belongs to this user
  const { data: session } = await supabase
    .from('study_sessions')
    .select('started_at, ended_at')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (!session) throw new Error('Session not found')

  // If already ended, this is a no-op (prevents double-ending)
  if (session.ended_at) {
    console.warn(`Session ${sessionId} is already ended`)
    return
  }

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
    .eq('user_id', user.id)

  if (error) throw error
  revalidatePath('/m/study')
  revalidatePath('/d/career')
}

/**
 * Log a completed study session with flexible timestamp options
 * 
 * @param bucketId - The study bucket/subject ID
 * @param durationMinutes - Duration in minutes
 * @param notes - Optional notes about the session
 * @param options - Timestamp options:
 *   - startedAt: Specify exact start time (ISO string)
 *   - useMidnightStart: Start at midnight of today (useful for daily review)
 *   - Default: Works backwards from current time (most accurate for immediate logging)
 * 
 * @example
 * // Daily review (starts at midnight): 2 hours shows as 12:00 AM - 2:00 AM
 * logCompletedSession(bucketId, 120, undefined, { useMidnightStart: true })
 * 
 * // Immediate logging (works backwards): 2 hours at 5 PM shows as 3:00 PM - 5:00 PM
 * logCompletedSession(bucketId, 120)
 * 
 * // Custom time (specific start): 2 hours from 2 PM shows as 2:00 PM - 4:00 PM
 * logCompletedSession(bucketId, 120, undefined, { startedAt: '2024-01-15T14:00:00Z' })
 */
export async function logCompletedSession(
  bucketId: string,
  durationMinutes: number,
  notes?: string,
  options?: {
    startedAt?: string // Optional: specify exact start time
    useMidnightStart?: boolean // If true, start at midnight of current day
  }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Don't save if no time was logged (this is for manual entry, so keep validation)
  if (!durationMinutes || durationMinutes <= 0) {
    throw new Error('Cannot log session with no time')
  }

  const now = new Date()
  let started: Date
  let ended: Date

  if (options?.startedAt) {
    // Use provided start time
    started = new Date(options.startedAt)
    ended = new Date(started.getTime() + durationMinutes * 60000)
  } else if (options?.useMidnightStart) {
    // Start at midnight of today
    started = new Date(now)
    started.setHours(0, 0, 0, 0)
    ended = new Date(started.getTime() + durationMinutes * 60000)
  } else {
    // Default: work backwards from current time
    ended = now
    started = new Date(now.getTime() - durationMinutes * 60000)
  }

  const { data, error } = await supabase
    .from('study_sessions')
    .insert({
      user_id: user.id,
      bucket_id: bucketId,
      date: now.toISOString().split('T')[0],
      started_at: started.toISOString(),
      ended_at: ended.toISOString(),
      duration_minutes: durationMinutes,
      notes,
    })
    .select()
    .single()

  if (error) throw error
  revalidatePath('/m/study')
  revalidatePath('/m/daily-context-review')
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
      bucket:buckets(id, name, color)
    `)
    .eq('user_id', user.id)
    .eq('date', today)
    .not('ended_at', 'is', null)
    .order('started_at', { ascending: false })

  return data ?? []
}

export async function updateStudySession(
  sessionId: string,
  durationMinutes: number,
  notes?: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  if (durationMinutes <= 0) {
    throw new Error('Duration must be greater than 0')
  }

  // Get the session to recalculate timestamps
  const { data: session } = await supabase
    .from('study_sessions')
    .select('started_at, ended_at')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (!session) throw new Error('Session not found')

  // Keep start time fixed, recalculate end time based on new duration
  let updateData: any = {
    duration_minutes: durationMinutes,
  }

  if (session.started_at) {
    const started = new Date(session.started_at)
    const newEnded = new Date(started.getTime() + durationMinutes * 60000)
    updateData.ended_at = newEnded.toISOString()
  }

  if (notes !== undefined) {
    updateData.notes = notes
  }

  const { error } = await supabase
    .from('study_sessions')
    .update(updateData)
    .eq('id', sessionId)
    .eq('user_id', user.id)

  if (error) throw error
  revalidatePath('/m/study')
  revalidatePath('/m/daily-context-review')
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
