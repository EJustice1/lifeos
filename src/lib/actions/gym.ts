'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { PREDEFINED_EXERCISES, MUSCLE_GROUPS, calculate1RM } from '@/lib/gym-utils'

// Get all predefined exercises
export async function getPredefinedExercises() {
  return PREDEFINED_EXERCISES
}

// Get exercise by ID
export async function getExerciseById(exerciseId: number) {
  return PREDEFINED_EXERCISES.find(ex => ex.id === exerciseId)
}

// Start a new workout
export async function startWorkout(type?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('workouts')
    .insert({
      user_id: user.id,
      date: today,
      started_at: new Date().toISOString(),
      type: type || null,
      total_volume: 0,
    })
    .select()
    .single()

  if (error) throw error

  revalidatePath('/m/gym')
  return data
}

// Log a lift (replaces the old logSet function)
export async function logLift(
  workoutId: string,
  exerciseId: number,
  weight: number,
  reps: number,
  rpe?: number
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Get current sets for this exercise in this workout
  const { data: existingSets } = await supabase
    .from('lifts')
    .select('set_number')
    .eq('workout_id', workoutId)
    .eq('exercise_id', exerciseId)
    .order('set_number', { ascending: false })
    .limit(1)

  const setNumber = existingSets && existingSets.length > 0
    ? existingSets[0].set_number + 1
    : 1


  // Create the lift record
  const { data: liftData, error: liftError } = await supabase
    .from('lifts')
    .insert({
      user_id: user.id,
      workout_id: workoutId,
      exercise_id: exerciseId,
      set_number: setNumber,
      reps: reps,
      weight: weight,
      rpe: rpe || null,
    })
    .select()
    .single()

  if (liftError) throw liftError

  // Update workout total volume by calculating it manually
  const { data: allLifts, error: liftsError } = await supabase
    .from('lifts')
    .select('weight, reps')
    .eq('workout_id', workoutId)

  if (liftsError) throw liftsError

  const totalVolume = allLifts?.reduce((sum, lift) => sum + (lift.weight * lift.reps), 0) ?? 0

  const { error: workoutError } = await supabase
    .from('workouts')
    .update({
      total_volume: totalVolume
    })
    .eq('id', workoutId)

  if (workoutError) throw workoutError

  // Check for PR
  const prResult = await checkAndSavePR(user.id, exerciseId, weight, reps)

  revalidatePath('/m/gym')
  return {
    lift: liftData,
    isNewPR: prResult.isNewPR,
    previousPR: prResult.previousPR
  }
}

// End a workout
export async function endWorkout(workoutId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('workouts')
    .update({
      ended_at: new Date().toISOString(),
    })
    .eq('id', workoutId)
    .eq('user_id', user.id)

  if (error) throw error

  revalidatePath('/m/gym')
}

// Get recent workouts with lifts
export async function getRecentWorkoutsWithDetails(limit = 10) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('workouts')
    .select(
      `*,
      lifts(
        id,
        reps,
        weight,
        set_number,
        rpe,
        created_at
      )`
    )
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(limit)

  // Enrich with exercise details
  return data?.map(workout => ({
    ...workout,
    lifts: workout.lifts?.map((lift: { exercise_id: number }) => ({
      ...lift,
      exercise: PREDEFINED_EXERCISES.find(ex => ex.id === lift.exercise_id)
    })) || []
  })) || []
}

// Get workout with lifts
export async function getWorkoutWithLifts(workoutId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data } = await supabase
    .from('workouts')
    .select(
      `*,
      lifts(
        id,
        reps,
        weight,
        set_number,
        rpe,
        created_at,
        exercise_id
      )`
    )
    .eq('id', workoutId)
    .eq('workouts.user_id', user.id)
    .single()

  if (!data) return null

  // Enrich with exercise details
  return {
    ...data,
    lifts: data.lifts?.map((lift: { exercise_id: number }) => ({
      ...lift,
      exercise: PREDEFINED_EXERCISES.find(ex => ex.id === lift.exercise_id)
    })) || []
  }
}

// Get active workout (where ended_at is null)
export async function getActiveWorkout() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('workouts')
    .select(
      `*,
      lifts(
        id,
        reps,
        weight,
        set_number,
        rpe,
        created_at,
        exercise_id
      )`
    )
    .eq('user_id', user.id)
    .is('ended_at', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .single()

  if (!data) return null

  // Enrich with exercise details
  return {
    ...data,
    lifts: data.lifts?.map((lift: { exercise_id: number }) => ({
      ...lift,
      exercise: PREDEFINED_EXERCISES.find(ex => ex.id === lift.exercise_id)
    })) || []
  }
}

// Get gym statistics
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

// Get personal records
export async function getPersonalRecords() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('personal_records')
    .select('*')
    .eq('user_id', user.id)
    .order('estimated_1rm', { ascending: false })

  // Enrich with exercise details
  return data?.map(pr => ({
    ...pr,
    exercise: PREDEFINED_EXERCISES.find(ex => ex.id === pr.exercise_id)
  })) || []
}

// Get muscle group stats
export async function getMuscleGroupStats() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Get all PRs
  const { data: prs } = await supabase
    .from('personal_records')
    .select('*')
    .eq('user_id', user.id)

  if (!prs) return null

  // Calculate estimated 1RM for each exercise and aggregate by muscle group
  const muscleGroupScores: Record<string, { total1RM: number; count: number; exercises: string[] }> = {}

  prs.forEach(pr => {
    const exercise = PREDEFINED_EXERCISES.find(e => e.id === pr.exercise_id)
    if (!exercise) return

    const allMuscles = [...exercise.primary_muscles, ...exercise.secondary_muscles]
    allMuscles.forEach((mg: string) => {
      if (!muscleGroupScores[mg]) {
        muscleGroupScores[mg] = { total1RM: 0, count: 0, exercises: [] }
      }
      muscleGroupScores[mg].total1RM += pr.estimated_1rm
      muscleGroupScores[mg].count += 1
      if (!muscleGroupScores[mg].exercises.includes(exercise.name)) {
        muscleGroupScores[mg].exercises.push(exercise.name)
      }
    })
  })

  // Convert to array and calculate average 1RM per muscle group
  const result: Record<string, {
    score: number
    avg1RM: number
    exerciseCount: number
    exercises: string[]
  }> = {}

  MUSCLE_GROUPS.forEach(mg => {
    if (muscleGroupScores[mg]) {
      result[mg] = {
        score: muscleGroupScores[mg].count,
        avg1RM: muscleGroupScores[mg].total1RM / muscleGroupScores[mg].count,
        exerciseCount: muscleGroupScores[mg].exercises.length,
        exercises: muscleGroupScores[mg].exercises,
      }
    } else {
      result[mg] = { score: 0, avg1RM: 0, exerciseCount: 0, exercises: [] }
    }
  })

  return result
}

// Improved PR detection logic
async function checkAndSavePR(
  userId: string,
  exerciseId: number,
  weight: number,
  reps: number
) {
  const supabase = await createClient()

  // Get current PR for this exercise
  const { data: currentPR } = await supabase
    .from('personal_records')
    .select('weight, reps, estimated_1rm')
    .eq('user_id', userId)
    .eq('exercise_id', exerciseId)
    .order('estimated_1rm', { ascending: false })
    .limit(1)
    .single()

  // Calculate estimated 1RM using Brzycki formula
  const new1RM = calculate1RM(weight, reps)
  const current1RM = currentPR ? currentPR.estimated_1rm : 0

  // Only consider it a PR if:
  // 1. No existing PR (first time)
  // 2. New 1RM is at least 2.5 lbs (1 kg) higher than current
  // 3. Same or better reps at higher weight
  const isNewPR = !currentPR ||
                  (new1RM >= current1RM + 2.5) ||
                  (weight > currentPR.weight && reps >= currentPR.reps)

  if (isNewPR) {
    // New PR!
    const today = new Date().toISOString().split('T')[0]

    await supabase
      .from('personal_records')
      .upsert({
        user_id: userId,
        exercise_id: exerciseId,
        weight: weight,
        reps: reps,
        estimated_1rm: new1RM,
        date: today,
      }, {
        onConflict: 'user_id,exercise_id'
      })

    return { isNewPR: true, previousPR: currentPR }
  }

  return { isNewPR: false }
}