'use server'

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

export interface FeedbackPayload {
  session_type: 'study' | 'gym'
  data: {
    effort_rating?: number
    focus_rating?: number
    failure_tags?: string[]
    notes?: string
  }
}

export async function createFeedback({ session_type, data }: FeedbackPayload) {
  const supabase = await createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('User not authenticated')
  }

  const { error } = await supabase
    .from('task_completion_feedback')
    .insert({
      user_id: user.id,
      session_type,
      ...data
    })

  if (error) throw error
}
