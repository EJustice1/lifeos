'use server'

import { createClient } from '@/lib/supabase/server'

export interface UserSettings {
  id: string
  user_id: string
  daily_study_target_minutes: number
  daily_workout_target: number
  daily_review_cutoff_hour: number
  created_at: string
  updated_at: string
}

/**
 * Get user settings with defaults if not found
 */
export async function getUserSettings(): Promise<UserSettings | null> {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('Error getting user:', userError)
      return null
    }

    // Try to get existing settings
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) {
      console.error('Error fetching user settings:', error)
      return null
    }

    // If no settings exist, create default settings
    if (!data) {
      const { data: newSettings, error: insertError } = await supabase
        .from('user_settings')
        .insert([
          {
            user_id: user.id,
            daily_study_target_minutes: 120,
            daily_workout_target: 1,
            daily_review_cutoff_hour: 9,
          },
        ])
        .select()
        .single()

      if (insertError) {
        console.error('Error creating default settings:', insertError)
        return null
      }

      return newSettings
    }

    return data
  } catch (error) {
    console.error('Unexpected error in getUserSettings:', error)
    return null
  }
}

/**
 * Get just the review cutoff hour setting
 */
export async function getReviewCutoffHour(): Promise<number> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return 9 // Default if not authenticated
    
    const { data } = await supabase
      .from('user_settings')
      .select('daily_review_cutoff_hour')
      .eq('user_id', user.id)
      .single()
    
    return data?.daily_review_cutoff_hour ?? 9
  } catch (error) {
    console.error('Error fetching review cutoff hour:', error)
    return 9 // Default on error
  }
}

/**
 * Update user settings
 */
export async function updateUserSettings(
  studyTargetMinutes: number,
  workoutTarget: number,
  reviewCutoffHour: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Validate inputs
    if (studyTargetMinutes < 0 || studyTargetMinutes > 1440) {
      return {
        success: false,
        error: 'Study target must be between 0 and 1440 minutes',
      }
    }

    if (workoutTarget < 0 || workoutTarget > 10) {
      return {
        success: false,
        error: 'Workout target must be between 0 and 10',
      }
    }

    if (reviewCutoffHour < 0 || reviewCutoffHour > 23) {
      return {
        success: false,
        error: 'Review cutoff hour must be between 0 and 23',
      }
    }

    // Try to update existing settings
    const { error: updateError } = await supabase
      .from('user_settings')
      .update({
        daily_study_target_minutes: studyTargetMinutes,
        daily_workout_target: workoutTarget,
        daily_review_cutoff_hour: reviewCutoffHour,
      })
      .eq('user_id', user.id)

    if (updateError) {
      // If update fails (no existing row), insert new settings
      const { error: insertError } = await supabase
        .from('user_settings')
        .insert([
          {
            user_id: user.id,
            daily_study_target_minutes: studyTargetMinutes,
            daily_workout_target: workoutTarget,
            daily_review_cutoff_hour: reviewCutoffHour,
          },
        ])

      if (insertError) {
        console.error('Error inserting settings:', insertError)
        return { success: false, error: 'Failed to save settings' }
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected error in updateUserSettings:', error)
    return { success: false, error: 'Unexpected error occurred' }
  }
}
