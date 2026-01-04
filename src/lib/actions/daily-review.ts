'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getTodayReview() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const today = new Date().toISOString().split('T')[0]

  const { data } = await supabase
    .from('daily_reviews')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', today)
    .single()

  return data
}

export async function submitDailyReview(
  mood: number,
  energy: number,
  perceivedSuccess: number,
  wins?: string,
  improvements?: string,
  tags: string[] = []
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('daily_reviews')
    .upsert({
      user_id: user.id,
      date: today,
      mood,
      energy,
      perceived_success: perceivedSuccess,
      wins,
      improvements,
      tags,
    })
    .select()
    .single()

  if (error) throw error
  revalidatePath('/m/daily-review')
  revalidatePath('/d/dashboard')
  return data
}

export async function getRecentReviews(limit = 7) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('daily_reviews')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(limit)

  return data ?? []
}

export async function getReviewStats(days = 30) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data: reviews } = await supabase
    .from('daily_reviews')
    .select('mood, energy, perceived_success, tags')
    .eq('user_id', user.id)
    .gte('date', startDate.toISOString().split('T')[0])

  if (!reviews || reviews.length === 0) return null

  const avgMood = reviews.reduce((sum, r) => sum + r.mood, 0) / reviews.length
  const avgEnergy = reviews.reduce((sum, r) => sum + r.energy, 0) / reviews.length
  const avgSuccess = reviews.reduce((sum, r) => sum + r.perceived_success, 0) / reviews.length

  // Tag frequency
  const tagCounts = reviews.reduce((acc, r) => {
    (r.tags || []).forEach((tag: string) => {
      acc[tag] = (acc[tag] || 0) + 1
    })
    return acc
  }, {} as Record<string, number>)

  return {
    totalReviews: reviews.length,
    avgMood: Math.round(avgMood * 10) / 10,
    avgEnergy: Math.round(avgEnergy * 10) / 10,
    avgSuccess: Math.round(avgSuccess * 10) / 10,
    topTags: Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag, count]) => ({ tag, count })),
  }
}

export async function getCorrelations() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Get last 30 days of data from multiple tables
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const startDate = thirtyDaysAgo.toISOString().split('T')[0]

  const [reviews, workouts, sessions, screenTime] = await Promise.all([
    supabase
      .from('daily_reviews')
      .select('date, mood, energy, perceived_success')
      .eq('user_id', user.id)
      .gte('date', startDate),
    supabase
      .from('workouts')
      .select('date')
      .eq('user_id', user.id)
      .gte('date', startDate),
    supabase
      .from('study_sessions')
      .select('date, duration_minutes')
      .eq('user_id', user.id)
      .gte('date', startDate),
    supabase
      .from('screen_time')
      .select('date, productive_minutes, distracted_minutes')
      .eq('user_id', user.id)
      .gte('date', startDate),
  ])

  // Build daily aggregates
  const dailyData: Record<string, {
    mood?: number
    energy?: number
    success?: number
    workedOut: boolean
    studyMinutes: number
    productiveMinutes: number
    distractedMinutes: number
  }> = {}

  reviews.data?.forEach(r => {
    if (!dailyData[r.date]) dailyData[r.date] = { workedOut: false, studyMinutes: 0, productiveMinutes: 0, distractedMinutes: 0 }
    dailyData[r.date].mood = r.mood
    dailyData[r.date].energy = r.energy
    dailyData[r.date].success = r.perceived_success
  })

  workouts.data?.forEach(w => {
    if (!dailyData[w.date]) dailyData[w.date] = { workedOut: false, studyMinutes: 0, productiveMinutes: 0, distractedMinutes: 0 }
    dailyData[w.date].workedOut = true
  })

  sessions.data?.forEach(s => {
    if (!dailyData[s.date]) dailyData[s.date] = { workedOut: false, studyMinutes: 0, productiveMinutes: 0, distractedMinutes: 0 }
    dailyData[s.date].studyMinutes += s.duration_minutes || 0
  })

  screenTime.data?.forEach(st => {
    if (!dailyData[st.date]) dailyData[st.date] = { workedOut: false, studyMinutes: 0, productiveMinutes: 0, distractedMinutes: 0 }
    dailyData[st.date].productiveMinutes = st.productive_minutes
    dailyData[st.date].distractedMinutes = st.distracted_minutes
  })

  // Calculate correlations (simplified - would use proper stats in production)
  const daysWithData = Object.values(dailyData).filter(d => d.mood !== undefined)

  if (daysWithData.length < 7) return null

  const gymDaysMood = daysWithData.filter(d => d.workedOut).map(d => d.mood!)
  const restDaysMood = daysWithData.filter(d => !d.workedOut).map(d => d.mood!)

  const avgGymMood = gymDaysMood.length > 0
    ? gymDaysMood.reduce((a, b) => a + b, 0) / gymDaysMood.length
    : 0
  const avgRestMood = restDaysMood.length > 0
    ? restDaysMood.reduce((a, b) => a + b, 0) / restDaysMood.length
    : 0

  return {
    gymDaysMoodDiff: Math.round((avgGymMood - avgRestMood) * 10) / 10,
    daysAnalyzed: daysWithData.length,
  }
}
