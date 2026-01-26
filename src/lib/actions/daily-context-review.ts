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