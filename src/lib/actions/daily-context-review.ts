'use server'

import { createClient } from '@/lib/supabase/server'
import { getReviewDate } from '@/lib/utils/review-date'

// Get daily context data for the context snapshot screen
// Aggregates data from multiple sources for today
export async function getDailyContextData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Get user's review cutoff hour setting
  const { data: settings } = await supabase
    .from('user_settings')
    .select('daily_review_cutoff_hour')
    .eq('user_id', user.id)
    .single()
  
  const cutoffHour = settings?.daily_review_cutoff_hour ?? 9

  // Get review date based on user's cutoff hour
  const todayStr = getReviewDate(cutoffHour)

  // Fetch all data sources in parallel for today
  const [workouts, studySessions, screenTime] = await Promise.all([
    supabase
      .from('workouts')
      .select('id, date, ended_at')
      .eq('user_id', user.id)
      .eq('date', todayStr),
    supabase
      .from('study_sessions')
      .select('date, duration_minutes')
      .eq('user_id', user.id)
      .eq('date', todayStr),
    supabase
      .from('screen_time')
      .select('date, distracted_minutes')
      .eq('user_id', user.id)
      .eq('date', todayStr),
  ])

  // Calculate totals
  const totalStudyMinutes = studySessions.data?.reduce((sum, session) => sum + (session.duration_minutes || 0), 0) ?? 0
  const completedWorkouts = workouts.data?.filter(w => w.ended_at !== null).length ?? 0
  const totalWorkouts = workouts.data?.length ?? 0
  const totalDistractedMinutes = screenTime.data?.reduce((sum, st) => sum + (st.distracted_minutes || 0), 0) ?? 0

  return {
    date: todayStr,
    studyHours: Math.round(totalStudyMinutes / 60),
    studyMinutes: totalStudyMinutes,
    workoutsCompleted: completedWorkouts,
    workoutsTotal: totalWorkouts,
    screenTimeHours: Math.round(totalDistractedMinutes / 60),
    screenTimeMinutes: totalDistractedMinutes,
  }
}

// Submit daily context review data
export async function submitDailyContextReview(
  date: string,
  executionScore: number,
  unfocusedFactors: string[],
  lessonLearned: string | null,
  highlights: string | null,
  screenTimeMinutes: number = 0,
  executionScoreSuggested?: number,
  executionScoreLocked: boolean = false,
  rolledOverTaskIds: string[] = []
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  // Upsert daily context review (insert or update if exists)
  const { error } = await supabase
    .from('daily_context_reviews')
    .upsert({
      user_id: user.id,
      date: date,
      execution_score: executionScore,
      unfocused_factors: unfocusedFactors,
      lesson_learned: lessonLearned,
      highlights: highlights,
      tomorrow_goals: [], // Deprecated - keeping empty for backward compatibility
      screen_time_minutes: screenTimeMinutes,
      execution_score_suggested: executionScoreSuggested,
      execution_score_locked: executionScoreLocked,
      rolled_over_task_ids: rolledOverTaskIds,
      incomplete_tasks_processed: true,
    }, {
      onConflict: 'user_id,date'
    })

  if (error) {
    console.error('Supabase insert error:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    })
    throw error
  }

  // Sync screentime data to screen_time table
  if (screenTimeMinutes > 0) {
    const { error: screenTimeError } = await supabase
      .from('screen_time')
      .upsert({
        user_id: user.id,
        date: date,
        total_minutes: screenTimeMinutes,
        mobile_minutes: 0,
        desktop_minutes: 0,
        source: 'daily_review',
      }, {
        onConflict: 'user_id,date'
      })

    if (screenTimeError) {
      console.error('Error syncing screentime:', screenTimeError)
      // Don't throw - screentime sync failure shouldn't fail the whole review
    }
  }

  return { success: true }
}

// Get existing daily context review for the current review period
export async function getExistingDailyContextReview() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Get user's review cutoff hour setting
  const { data: settings } = await supabase
    .from('user_settings')
    .select('daily_review_cutoff_hour')
    .eq('user_id', user.id)
    .single()
  
  const cutoffHour = settings?.daily_review_cutoff_hour ?? 9

  // Get review date based on user's cutoff hour
  const reviewDateStr = getReviewDate(cutoffHour)

  const { data } = await supabase
    .from('daily_context_reviews')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', reviewDateStr)
    .single()

  return data
}

// Get daily context review stats for analytics
export async function getDailyContextReviewStats(days = 30) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('daily_context_reviews')
    .select('date, execution_score')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(days)

  return data || []
}

// Get daily context data for a specific date (doesn't use cutoff hour logic)
export async function getDailyContextDataForDate(date: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Fetch all data sources in parallel for the specified date
  const [workouts, studySessions, screenTime] = await Promise.all([
    supabase
      .from('workouts')
      .select('id, date, ended_at')
      .eq('user_id', user.id)
      .eq('date', date),
    supabase
      .from('study_sessions')
      .select('date, duration_minutes')
      .eq('user_id', user.id)
      .eq('date', date),
    supabase
      .from('screen_time')
      .select('date, distracted_minutes')
      .eq('user_id', user.id)
      .eq('date', date),
  ])

  // Calculate totals
  const totalStudyMinutes = studySessions.data?.reduce((sum, session) => sum + (session.duration_minutes || 0), 0) ?? 0
  const completedWorkouts = workouts.data?.filter(w => w.ended_at !== null).length ?? 0
  const totalWorkouts = workouts.data?.length ?? 0
  const totalDistractedMinutes = screenTime.data?.reduce((sum, st) => sum + (st.distracted_minutes || 0), 0) ?? 0

  return {
    date,
    studyHours: Math.round(totalStudyMinutes / 60),
    studyMinutes: totalStudyMinutes,
    workoutsCompleted: completedWorkouts,
    workoutsTotal: totalWorkouts,
    screenTimeHours: Math.round(totalDistractedMinutes / 60),
    screenTimeMinutes: totalDistractedMinutes,
  }
}

// Get existing daily context review for a specific date
export async function getExistingDailyContextReviewForDate(date: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('daily_context_reviews')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', date)
    .single()

  return data
}

// Get statistics for daily review summary (averages, trends, heatmap data)
export async function getDailyReviewStatistics(days = 30) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Calculate the start date
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  const startDateStr = startDate.toISOString().split('T')[0]

  // Fetch reviews, workouts, study sessions, and screentime in parallel
  const [reviews, workouts, studySessions, screenTime] = await Promise.all([
    supabase
      .from('daily_context_reviews')
      .select('date, execution_score, screen_time_minutes')
      .eq('user_id', user.id)
      .gte('date', startDateStr)
      .order('date', { ascending: true }),
    supabase
      .from('workouts')
      .select('date, ended_at')
      .eq('user_id', user.id)
      .gte('date', startDateStr),
    supabase
      .from('study_sessions')
      .select('date, duration_minutes')
      .eq('user_id', user.id)
      .gte('date', startDateStr),
    supabase
      .from('screen_time')
      .select('date, distracted_minutes')
      .eq('user_id', user.id)
      .gte('date', startDateStr),
  ])

  if (!reviews.data || reviews.data.length === 0) {
    return {
      avgExecutionScore: 0,
      avgStudyMinutes: 0,
      avgWorkouts: 0,
      avgScreenTimeMinutes: 0,
      dailyScores: [],
      reviewCount: 0,
    }
  }

  // Calculate execution score average
  const totalExecutionScore = reviews.data.reduce((sum, r) => sum + r.execution_score, 0)
  const avgExecutionScore = Math.round(totalExecutionScore / reviews.data.length)

  // Group workouts by date and count completed ones
  const workoutsByDate = new Map<string, number>()
  workouts.data?.forEach(w => {
    if (w.ended_at) {
      const count = workoutsByDate.get(w.date) || 0
      workoutsByDate.set(w.date, count + 1)
    }
  })
  const totalWorkouts = Array.from(workoutsByDate.values()).reduce((sum, count) => sum + count, 0)
  const avgWorkouts = workoutsByDate.size > 0 ? totalWorkouts / workoutsByDate.size : 0

  // Group study sessions by date and sum duration
  const studyByDate = new Map<string, number>()
  studySessions.data?.forEach(s => {
    const total = studyByDate.get(s.date) || 0
    studyByDate.set(s.date, total + s.duration_minutes)
  })
  const totalStudyMinutes = Array.from(studyByDate.values()).reduce((sum, mins) => sum + mins, 0)
  const avgStudyMinutes = studyByDate.size > 0 ? Math.round(totalStudyMinutes / studyByDate.size) : 0

  // Group screentime by date
  const screenByDate = new Map<string, number>()
  screenTime.data?.forEach(st => {
    const total = screenByDate.get(st.date) || 0
    screenByDate.set(st.date, total + st.distracted_minutes)
  })
  const totalScreenMinutes = Array.from(screenByDate.values()).reduce((sum, mins) => sum + mins, 0)
  const avgScreenTimeMinutes = screenByDate.size > 0 ? Math.round(totalScreenMinutes / screenByDate.size) : 0

  // Prepare heatmap data (all reviews with scores)
  const dailyScores = reviews.data.map(r => ({
    date: r.date,
    execution_score: r.execution_score,
  }))

  return {
    avgExecutionScore,
    avgStudyMinutes,
    avgWorkouts: Math.round(avgWorkouts * 10) / 10, // Round to 1 decimal
    avgScreenTimeMinutes,
    dailyScores,
    reviewCount: reviews.data.length,
  }
}

// Get trend data for sparklines (last 7 days of activity)
export async function getMetricTrendData(days = 7) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Calculate date range
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  const startDateStr = startDate.toISOString().split('T')[0]

  // Fetch last N days of data
  const [workouts, studySessions, screenTime] = await Promise.all([
    supabase
      .from('workouts')
      .select('date, ended_at')
      .eq('user_id', user.id)
      .gte('date', startDateStr)
      .order('date', { ascending: true }),
    supabase
      .from('study_sessions')
      .select('date, duration_minutes')
      .eq('user_id', user.id)
      .gte('date', startDateStr)
      .order('date', { ascending: true }),
    supabase
      .from('screen_time')
      .select('date, distracted_minutes')
      .eq('user_id', user.id)
      .gte('date', startDateStr)
      .order('date', { ascending: true }),
  ])

  // Group by date
  const dateMap = new Map<string, { study: number; workouts: number; screentime: number }>()

  // Initialize all dates in range
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    const dateStr = date.toISOString().split('T')[0]
    dateMap.set(dateStr, { study: 0, workouts: 0, screentime: 0 })
  }

  // Aggregate study sessions
  studySessions.data?.forEach(s => {
    const entry = dateMap.get(s.date)
    if (entry) {
      entry.study += s.duration_minutes
    }
  })

  // Count completed workouts
  workouts.data?.forEach(w => {
    if (w.ended_at) {
      const entry = dateMap.get(w.date)
      if (entry) {
        entry.workouts += 1
      }
    }
  })

  // Aggregate screentime
  screenTime.data?.forEach(st => {
    const entry = dateMap.get(st.date)
    if (entry) {
      entry.screentime += st.distracted_minutes
    }
  })

  // Convert to arrays for sparklines
  const dates = Array.from(dateMap.keys()).sort()
  const studyData = dates.map(date => dateMap.get(date)!.study)
  const workoutData = dates.map(date => dateMap.get(date)!.workouts)
  const screentimeData = dates.map(date => dateMap.get(date)!.screentime)

  return {
    dates,
    studyData,
    workoutData,
    screentimeData,
  }
}