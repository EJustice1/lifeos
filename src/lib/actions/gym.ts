'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getExercises() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('exercises')
    .select('*')
    .eq('user_id', user.id)
    .order('name')

  return data ?? []
}

export async function getLastWorkoutForExercise(exerciseId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('workout_sets')
    .select(`
      *,
      workout:workouts(date)
    `)
    .eq('exercise_id', exerciseId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return data
}

export async function startWorkout(type?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const now = new Date()
  const { data, error } = await supabase
    .from('workouts')
    .insert({
      user_id: user.id,
      date: now.toISOString().split('T')[0],
      started_at: now.toISOString(),
      type,
    })
    .select()
    .single()

  if (error) throw error
  revalidatePath('/m/gym')
  return data
}

export async function logSet(
  workoutId: string,
  exerciseId: string,
  setNumber: number,
  reps: number,
  weight: number,
  rpe?: number
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('workout_sets')
    .insert({
      workout_id: workoutId,
      exercise_id: exerciseId,
      set_number: setNumber,
      reps,
      weight,
      rpe,
    })
    .select()
    .single()

  if (error) throw error

  // Update workout total volume
  const volume = reps * weight
  await supabase.rpc('increment_workout_volume', {
    workout_id: workoutId,
    volume_to_add: volume,
  })

  revalidatePath('/m/gym')
  return data
}

export async function endWorkout(workoutId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('workouts')
    .update({ ended_at: new Date().toISOString() })
    .eq('id', workoutId)

  if (error) throw error
  revalidatePath('/m/gym')
  revalidatePath('/d/gym')
}

export async function getRecentWorkouts(limit = 10) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('workouts')
    .select(`
      *,
      workout_sets(
        *,
        exercise:exercises(name)
      )
    `)
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(limit)

  return data ?? []
}

export async function getGymStats() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const today = new Date()
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
  const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000)

  // This week's workouts
  const { data: thisWeek } = await supabase
    .from('workouts')
    .select('id, total_volume')
    .eq('user_id', user.id)
    .gte('date', weekAgo.toISOString().split('T')[0])

  // Last week's workouts
  const { data: lastWeek } = await supabase
    .from('workouts')
    .select('id, total_volume')
    .eq('user_id', user.id)
    .gte('date', twoWeeksAgo.toISOString().split('T')[0])
    .lt('date', weekAgo.toISOString().split('T')[0])

  const thisWeekVolume = thisWeek?.reduce((sum, w) => sum + (w.total_volume || 0), 0) ?? 0
  const lastWeekVolume = lastWeek?.reduce((sum, w) => sum + (w.total_volume || 0), 0) ?? 0
  const volumeChange = lastWeekVolume > 0
    ? Math.round(((thisWeekVolume - lastWeekVolume) / lastWeekVolume) * 100)
    : 0

  return {
    workoutsThisWeek: thisWeek?.length ?? 0,
    weeklyVolume: thisWeekVolume,
    volumeChange,
  }
}

export async function getPersonalRecords() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('personal_records')
    .select(`
      *,
      exercise:exercises(name)
    `)
    .eq('user_id', user.id)
    .order('date', { ascending: false })

  return data ?? []
}
