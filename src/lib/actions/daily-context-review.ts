'use server'

import { createClient } from '@/lib/supabase/server'

// Get daily context data for the context snapshot screen
// Aggregates data from multiple sources for today
export async function getDailyContextData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Get today's date
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

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
// Note: tomorrow_goals parameter removed - use Tasks system instead
export async function submitDailyContextReview(
  date: string,
  executionScore: number,
  focusQuality: number,
  physicalVitality: number,
  unfocusedFactors: string[],
  lessonLearned: string | null,
  highlights: string | null,
  productiveScreenMinutes: number = 0,
  distractedScreenMinutes: number = 0,
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
      focus_quality: focusQuality,
      physical_vitality: physicalVitality,
      unfocused_factors: unfocusedFactors,
      lesson_learned: lessonLearned,
      highlights: highlights,
      tomorrow_goals: [], // Deprecated - keeping empty for backward compatibility
      productive_screen_minutes: productiveScreenMinutes,
      distracted_screen_minutes: distractedScreenMinutes,
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

  // Sync screentime data to screen_time table (bidirectional sync)
  if (productiveScreenMinutes > 0 || distractedScreenMinutes > 0) {
    const { error: screenTimeError } = await supabase
      .from('screen_time')
      .upsert({
        user_id: user.id,
        date: date,
        productive_minutes: productiveScreenMinutes,
        distracted_minutes: distractedScreenMinutes,
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

// Get existing daily context review for today
export async function getExistingDailyContextReview() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Get today's date
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  const { data } = await supabase
    .from('daily_context_reviews')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', todayStr)
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
    .select('date, execution_score, focus_quality, physical_vitality')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(days)

  return data || []
}