'use server'

import { createClient } from '@/lib/supabase/server'
import { getReviewDate } from '@/lib/utils/review-date'

export async function debugReviewDate() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { error: 'Not authenticated' }
  
  // Get user settings
  const { data: settings } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .single()
  
  const now = new Date()
  const cutoffHour = settings?.daily_review_cutoff_hour ?? 9
  const reviewDate = getReviewDate(cutoffHour)
  const calendarDate = now.toISOString().split('T')[0]
  
  // Check for existing reviews
  const { data: reviewForReviewDate } = await supabase
    .from('daily_context_reviews')
    .select('date, created_at')
    .eq('user_id', user.id)
    .eq('date', reviewDate)
    .single()
  
  const { data: reviewForCalendarDate } = await supabase
    .from('daily_context_reviews')
    .select('date, created_at')
    .eq('user_id', user.id)
    .eq('date', calendarDate)
    .single()
  
  return {
    currentTime: now.toISOString(),
    currentHour: now.getHours(),
    currentMinute: now.getMinutes(),
    cutoffHour,
    calendarDate,
    reviewDate,
    settingsRow: settings,
    reviewExistsForReviewDate: !!reviewForReviewDate,
    reviewExistsForCalendarDate: !!reviewForCalendarDate,
    reviewDateData: reviewForReviewDate,
    calendarDateData: reviewForCalendarDate,
  }
}
