'use server'

import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

interface LegacyBucket {
  id: string
  user_id: string
  name: string
  color: string
  is_archived: boolean
  created_at: string
  updated_at: string
}

interface LegacyReview {
  date: string
  tomorrow_goals: string[] | null
}

export async function migrateBucketsToProjects(userId: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseAdmin() as any
  
  const { data: buckets, error: bucketErr } = await supabase
    .from('buckets')
    .select('*')
    .eq('user_id', userId)
  
  if (bucketErr) throw bucketErr
  if (!buckets || buckets.length === 0) throw new Error('No buckets found')

  const projectsToInsert = (buckets as LegacyBucket[]).map((b) => ({
    id: b.id,
    user_id: b.user_id,
    life_goal_id: null,
    title: b.name,
    description: '',
    color: b.color,
    status: 'active' as const,
    target_date: null,
    created_at: b.created_at,
    updated_at: b.updated_at,
    archived: b.is_archived
  }))

  const { error: insertErr } = await supabase.from('projects').insert(projectsToInsert)
  if (insertErr) throw insertErr
}

export async function migrateGoalsToTasks(userId: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseAdmin() as any
  
  const { data: reviews, error: reviewErr } = await supabase
    .from('daily_context_reviews')
    .select('date, tomorrow_goals')
    .eq('user_id', userId)
  
  if (reviewErr) throw reviewErr
  if (!reviews || reviews.length === 0) throw new Error('No reviews found')

  const tasksToInsert = (reviews as LegacyReview[]).flatMap((review: LegacyReview) =>
    (review.tomorrow_goals || []).map((goal: string) => ({
      id: crypto.randomUUID(),
      user_id: userId,
      project_id: null,
      bucket_id: null,
      title: goal,
      description: '',
      status: 'inbox' as const,
      scheduled_date: review.date,
      scheduled_time: null,
      duration_minutes: null,
      priority: null,
      tags: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))
  )

  const { error: insertErr } = await supabase.from('tasks').insert(tasksToInsert)
  if (insertErr) throw insertErr
}

export async function runFullMigration(userId: string) {
  await migrateBucketsToProjects(userId)
  await migrateGoalsToTasks(userId)
}
