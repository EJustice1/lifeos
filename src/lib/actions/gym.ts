'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { PREDEFINED_EXERCISES, MUSCLE_GROUPS, calculate1RM, MuscleGroup } from '@/lib/gym-utils'

// Get all predefined exercises
export async function getPredefinedExercises() {
  return PREDEFINED_EXERCISES
}

// Get exercise by ID
export async function getExerciseById(exerciseId: number) {
  return PREDEFINED_EXERCISES.find(ex => ex.id === exerciseId)
}

// Helper to get date in EST timezone
function getESTDate(date: Date = new Date()): string {
  // Convert to EST (UTC-5) or EDT (UTC-4) depending on DST
  const estDate = new Date(date.toLocaleString('en-US', { timeZone: 'America/New_York' }))
  const year = estDate.getFullYear()
  const month = String(estDate.getMonth() + 1).padStart(2, '0')
  const day = String(estDate.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Start a new workout
export async function startWorkout(type?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // CRITICAL: End any existing active workouts before starting a new one
  // This ensures only ONE active workout exists at a time
  const { data: existingWorkouts } = await supabase
    .from('workouts')
    .select('id, started_at')
    .eq('user_id', user.id)
    .is('ended_at', null)

  if (existingWorkouts && existingWorkouts.length > 0) {
    const now = new Date()
    // End all active workouts
    for (const workout of existingWorkouts) {
      await supabase
        .from('workouts')
        .update({
          ended_at: now.toISOString(),
        })
        .eq('id', workout.id)
        .eq('user_id', user.id)
    }
  }

  const today = getESTDate()

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

// Delete a workout (for cleaning up empty workouts)
export async function deleteWorkout(workoutId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('workouts')
    .delete()
    .eq('id', workoutId)
    .eq('user_id', user.id)

  // Ignore "not found" errors - workout might have already been deleted or never created
  if (error && error.code !== 'PGRST116') throw error

  revalidatePath('/m/gym')
}

// End a workout
export async function endWorkout(workoutId: string, endedAt?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Get the workout to check if it exists and is not already ended
  const { data: workout } = await supabase
    .from('workouts')
    .select('ended_at')
    .eq('id', workoutId)
    .eq('user_id', user.id)
    .single()

  if (!workout) throw new Error('Workout not found')

  // If already ended, this is a no-op (prevents double-ending)
  if (workout.ended_at) {
    console.warn(`Workout ${workoutId} is already ended`)
    return
  }

  // Use provided endedAt timestamp or current time
  const endTime = endedAt ? new Date(endedAt) : new Date()

  // Always set ended_at (even if no sets, for proper deletion flow)
  const { error } = await supabase
    .from('workouts')
    .update({
      ended_at: endTime.toISOString(),
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
        exercise_id,
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
    lifts: workout.lifts?.map((lift: any) => ({
      ...lift,
      exercise: PREDEFINED_EXERCISES.find(ex => ex.id === lift.exercise_id)
    })) || []
  })) || []
}

// Get recent workouts with lifts and transform to UI format (server-side)
export async function getRecentWorkoutsTransformed(limit = 5) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('workouts')
    .select(
      `*,
      lifts(
        id,
        exercise_id,
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

  if (!data) return []

  // Transform workouts server-side
  return data.map(workout => {
    // Group lifts by exercise
    const exercisesMap = new Map<string, {
      totalSets: number;
      totalReps: number;
      totalVolume: number;
      sets: Array<{
        setNumber: number;
        reps: number;
        weight: number;
        volume: number;
        estimated1RM: number;
      }>;
    }>()

    workout.lifts?.forEach((lift: any) => {
      const exercise = PREDEFINED_EXERCISES.find(ex => ex.id === lift.exercise_id)
      const exerciseName = exercise?.name || 'Unknown Exercise'
      const setVolume = lift.weight * lift.reps
      const estimated1RM = calculate1RM(lift.weight, lift.reps)

      if (!exercisesMap.has(exerciseName)) {
        exercisesMap.set(exerciseName, {
          totalSets: 0,
          totalReps: 0,
          totalVolume: 0,
          sets: []
        })
      }

      const exerciseData = exercisesMap.get(exerciseName)
      if (exerciseData) {
        exerciseData.totalSets += 1
        exerciseData.totalReps += lift.reps
        exerciseData.totalVolume += setVolume

        exerciseData.sets.push({
          setNumber: lift.set_number,
          reps: lift.reps,
          weight: lift.weight,
          volume: setVolume,
          estimated1RM: estimated1RM
        })
      }
    })

    // Calculate workout duration in minutes
    const workoutDuration = workout.ended_at && workout.started_at ?
      Math.round((new Date(workout.ended_at).getTime() - new Date(workout.started_at).getTime()) / (1000 * 60)) :
      0

    return {
      id: workout.id,
      date: workout.date || workout.started_at?.split('T')[0],
      type: workout.type || 'General',
      duration: workoutDuration,
      totalVolume: workout.total_volume || Array.from(exercisesMap.values()).reduce((sum, ex) => sum + ex.totalVolume, 0),
      exercises: Array.from(exercisesMap.entries()).map(([name, data]) => ({
        name,
        totalSets: data.totalSets,
        totalReps: data.totalReps,
        totalVolume: data.totalVolume,
        sets: data.sets
      }))
    }
  })
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
        exercise_id,
        reps,
        weight,
        set_number,
        rpe,
        created_at
      )`
    )
    .eq('id', workoutId)
    .eq('workouts.user_id', user.id)
    .single()

  if (!data) return null

  // Enrich with exercise details
  return {
    ...data,
    lifts: data.lifts?.map((lift: any) => ({
      ...lift,
      exercise: PREDEFINED_EXERCISES.find(ex => ex.id === lift.exercise_id)
    })) || []
  }
}

// Get active workout (where ended_at is null)
// Returns the most recent active workout
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
        exercise_id,
        reps,
        weight,
        set_number,
        rpe,
        created_at
      )`
    )
    .eq('user_id', user.id)
    .is('ended_at', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle() // Use maybeSingle to handle 0 or 1 results gracefully

  if (!data) return null

  // Enrich with exercise details
  return {
    ...data,
    lifts: data.lifts?.map((lift: any) => ({
      ...lift,
      exercise: PREDEFINED_EXERCISES.find(ex => ex.id === lift.exercise_id)
    })) || []
  }
}

/**
 * Force end all active workouts for the current user
 * This is a cleanup function to handle orphaned workouts
 */
export async function endAllActiveWorkouts() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: activeWorkouts } = await supabase
    .from('workouts')
    .select('id, started_at')
    .eq('user_id', user.id)
    .is('ended_at', null)

  if (!activeWorkouts || activeWorkouts.length === 0) {
    return { count: 0 }
  }

  const now = new Date()
  let endedCount = 0

  for (const workout of activeWorkouts) {
    const { error } = await supabase
      .from('workouts')
      .update({
        ended_at: now.toISOString(),
      })
      .eq('id', workout.id)
      .eq('user_id', user.id)

    if (!error) {
      endedCount++
    }
  }

  revalidatePath('/m/gym')
  
  return { count: endedCount }
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
    .limit(20)

  // Enrich with exercise details
  return data?.map(pr => ({
    ...pr,
    exercise: PREDEFINED_EXERCISES.find(ex => ex.id === pr.exercise_id)
  })) || []
}

// Get featured personal records (curated list for progress page)
export async function getFeaturedPersonalRecords() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Import FEATURED_PR_EXERCISES from gym-utils
  const FEATURED_EXERCISES = [1, 2, 40, 33, 27]

  const { data } = await supabase
    .from('personal_records')
    .select('*')
    .eq('user_id', user.id)
    .in('exercise_id', FEATURED_EXERCISES)
    .order('estimated_1rm', { ascending: false })

  // Enrich with exercise details and sort by featured order
  const prs = data?.map(pr => ({
    ...pr,
    exercise: PREDEFINED_EXERCISES.find(ex => ex.id === pr.exercise_id)
  })) || []

  // Sort by the order defined in FEATURED_PR_EXERCISES
  return prs.sort((a, b) => {
    const aIndex = FEATURED_EXERCISES.indexOf(a.exercise_id)
    const bIndex = FEATURED_EXERCISES.indexOf(b.exercise_id)
    return aIndex - bIndex
  })
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
    const today = getESTDate()

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

// Get PR for a specific exercise
export async function getExercisePR(exerciseId: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('personal_records')
    .select('*')
    .eq('user_id', user.id)
    .eq('exercise_id', exerciseId)
    .single()

  if (!data) return null

  return {
    ...data,
    exercise: PREDEFINED_EXERCISES.find(ex => ex.id === data.exercise_id)
  }
}

// Get performance history for an exercise (for charts)
export async function getExercisePerformanceHistory(exerciseId: number, days = 90) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)

  // Query the materialized view (limit to prevent excessive data)
  const { data } = await supabase
    .from('exercise_performance_history')
    .select('*')
    .eq('user_id', user.id)
    .eq('exercise_id', exerciseId)
    .gte('date', cutoffDate.toISOString().split('T')[0])
    .order('date', { ascending: true })
    .limit(200)

  return data || []
}

// Get weekly muscle group volume with weighted sets (1.0 primary / 0.5 secondary)
// Now uses last 7 days instead of current week
export async function getWeeklyMuscleGroupVolume() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Get last 7 days
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  sevenDaysAgo.setHours(0, 0, 0, 0)

  // Get all lifts from last 7 days (with limit for safety)
  const { data: lifts } = await supabase
    .from('lifts')
    .select('exercise_id, workout_id')
    .eq('user_id', user.id)
    .gte('created_at', sevenDaysAgo.toISOString())
    .limit(500)

  if (!lifts || lifts.length === 0) {
    // Return zeros for all muscle groups
    const result: Record<string, number> = {}
    MUSCLE_GROUPS.forEach(mg => { result[mg] = 0 })
    return result
  }

  // Count sets per muscle group with weighting
  const muscleGroupSets: Record<string, number> = {}
  MUSCLE_GROUPS.forEach(mg => { muscleGroupSets[mg] = 0 })

  lifts.forEach(lift => {
    const exercise = PREDEFINED_EXERCISES.find(ex => ex.id === lift.exercise_id)
    if (!exercise) return

    // Primary muscles get 1.0 weight
    exercise.primary_muscles.forEach(mg => {
      muscleGroupSets[mg] = (muscleGroupSets[mg] || 0) + 1.0
    })

    // Secondary muscles get 0.5 weight
    exercise.secondary_muscles.forEach(mg => {
      muscleGroupSets[mg] = (muscleGroupSets[mg] || 0) + 0.5
    })
  })

  return muscleGroupSets
}

// Get muscle group targets
export async function getMuscleGroupTargets() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('muscle_group_targets')
    .select('*')
    .eq('user_id', user.id)

  if (!data || data.length === 0) {
    // Return defaults if not set
    const defaults: Record<string, number> = {}
    MUSCLE_GROUPS.forEach(mg => { defaults[mg] = 12 })
    return defaults
  }

  // Convert array to object
  const targets: Record<string, number> = {}
  data.forEach(row => {
    targets[row.muscle_group] = row.target_sets_per_week
  })

  // Fill in any missing muscle groups with default
  MUSCLE_GROUPS.forEach(mg => {
    if (!(mg in targets)) {
      targets[mg] = 12
    }
  })

  return targets
}

// Update muscle group target
export async function updateMuscleGroupTarget(muscleGroup: MuscleGroup, targetSets: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Validate inputs
  if (!MUSCLE_GROUPS.includes(muscleGroup)) {
    throw new Error('Invalid muscle group')
  }
  if (targetSets < 0 || targetSets > 30) {
    throw new Error('Target sets must be between 0 and 30')
  }

  const { error } = await supabase
    .from('muscle_group_targets')
    .upsert({
      user_id: user.id,
      muscle_group: muscleGroup,
      target_sets_per_week: targetSets,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,muscle_group'
    })

  if (error) throw error

  revalidatePath('/m/gym')
  revalidatePath('/m/gym/targets')
}

// Get muscle group percentiles for radar chart (with caching)
export async function getMuscleGroupPercentiles() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Try to get from cache first
  try {
    const { data: cachedData } = await supabase
      .rpc('get_gym_cache', {
        user_id_param: user.id,
        cache_key_param: 'gym_muscle_percentiles'
      })

    if (cachedData) {
      return cachedData as Record<string, number>
    }
  } catch (error) {
    console.warn('Cache read failed, computing fresh data:', error)
  }

  // Get weekly volume
  const weeklyVolume = await getWeeklyMuscleGroupVolume()

  // Get targets
  const targets = await getMuscleGroupTargets()

  // If no data, return zeros (not null) so chart still renders
  if (!weeklyVolume || !targets) {
    const percentiles: Record<string, number> = {}
    MUSCLE_GROUPS.forEach(mg => {
      percentiles[mg] = 0
    })
    return percentiles
  }

  // Calculate percentiles
  const percentiles: Record<string, number> = {}
  MUSCLE_GROUPS.forEach(mg => {
    const actual = weeklyVolume[mg] || 0
    const target = targets[mg] || 12
    const percentile = target > 0 ? Math.min(100, (actual / target) * 100) : 0
    percentiles[mg] = Math.round(percentile)
  })

  // Cache the result for 5 minutes
  try {
    await supabase.rpc('set_gym_cache', {
      user_id_param: user.id,
      cache_key_param: 'gym_muscle_percentiles',
      cache_data_param: percentiles,
      ttl_minutes: 5
    })
  } catch (error) {
    console.warn('Cache write failed:', error)
  }

  return percentiles
}

// Progress Tracking Functions

// Get comprehensive progress data for the gym progress page
export async function getProgressData(timeRange: 'month' | 'quarter' | 'year' | 'all' = 'month') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Calculate date range
  const endDate = new Date()
  const startDate = new Date()

  switch (timeRange) {
    case 'month':
      startDate.setMonth(startDate.getMonth() - 1)
      break
    case 'quarter':
      startDate.setMonth(startDate.getMonth() - 3)
      break
    case 'year':
      startDate.setFullYear(startDate.getFullYear() - 1)
      break
    case 'all':
      // No start date limit for 'all'
      startDate.setFullYear(startDate.getFullYear() - 10)
      break
  }

  const startDateStr = startDate.toISOString().split('T')[0]
  const endDateStr = endDate.toISOString().split('T')[0]

  try {
    // Get progress history data (limited to prevent slowness)
    const { data: progressHistory } = await supabase
      .from('gym_progress_history')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', startDateStr)
      .lte('date', endDateStr)
      .order('date', { ascending: false })
      .limit(500)

    // Get recent workouts (limited)
    const { data: workouts } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', startDateStr)
      .lte('date', endDateStr)
      .order('date', { ascending: false })
      .limit(100)

    // Get personal records (limited)
    const { data: personalRecords } = await supabase
      .from('personal_records')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(50)

    // Calculate metrics
    const totalWorkouts = workouts?.length || 0
    const totalVolume = workouts?.reduce((sum, workout) => sum + (workout.total_volume || 0), 0) || 0

    // Calculate strength score (0-100 based on PRs)
    const strengthScore = personalRecords && personalRecords.length > 0
      ? Math.min(100, personalRecords.length * 5 + (totalWorkouts / 10))
      : 0

    // Calculate consistency score (0-100 based on workout frequency)
    const consistencyScore = totalWorkouts > 0
      ? Math.min(100, (totalWorkouts / getExpectedWorkouts(timeRange)) * 100)
      : 0

    return {
      totalWorkouts,
      totalVolume,
      strengthScore: Math.round(strengthScore),
      consistencyScore: Math.round(consistencyScore),
      progressHistory: progressHistory || [],
      workouts: workouts || [],
      personalRecords: personalRecords || []
    }
  } catch (error) {
    console.error('Error fetching progress data:', error)
    return null
  }
}

// Helper function to get expected workouts for consistency calculation
function getExpectedWorkouts(timeRange: 'month' | 'quarter' | 'year' | 'all'): number {
  switch (timeRange) {
    case 'month': return 8 // 2 workouts per week
    case 'quarter': return 24 // 2 workouts per week
    case 'year': return 104 // 2 workouts per week
    case 'all': return 104 // Use 1 year as baseline
    default: return 104
  }
}

// Get progress history for a specific exercise
export async function getExerciseProgressHistory(exerciseId: number, timeRange: 'month' | 'quarter' | 'year' | 'all' = 'month') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Calculate date range
  const endDate = new Date()
  const startDate = new Date()

  switch (timeRange) {
    case 'month':
      startDate.setMonth(startDate.getMonth() - 1)
      break
    case 'quarter':
      startDate.setMonth(startDate.getMonth() - 3)
      break
    case 'year':
      startDate.setFullYear(startDate.getFullYear() - 1)
      break
    case 'all':
      startDate.setFullYear(startDate.getFullYear() - 10)
      break
  }

  const startDateStr = startDate.toISOString().split('T')[0]
  const endDateStr = endDate.toISOString().split('T')[0]

  const { data } = await supabase
    .from('gym_progress_history')
    .select('*')
    .eq('user_id', user.id)
    .eq('exercise_id', exerciseId)
    .gte('date', startDateStr)
    .lte('date', endDateStr)
    .order('date', { ascending: true })

  return data || []
}

// Generate and save a progress snapshot
export async function generateProgressSnapshot() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const today = getESTDate()

  try {
    // Call the database function to generate snapshot
    const { data: snapshotData, error } = await supabase
      .rpc('generate_gym_progress_snapshot', { user_id_param: user.id })

    if (error) throw error

    if (snapshotData) {
      // Save the snapshot to the database
      const { error: saveError } = await supabase
        .from('gym_progress_snapshots')
        .insert({
          user_id: user.id,
          date: today,
          snapshot_data: snapshotData
        })

      if (saveError) throw saveError
    }

    return snapshotData
  } catch (error) {
    console.error('Error generating progress snapshot:', error)
    throw error
  }
}

// Get progress snapshots for a date range
export async function getProgressSnapshots(startDate: string, endDate: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('gym_progress_snapshots')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false })

  return data || []
}

// Get strength standards for comparison
export async function getStrengthStandards(exerciseId: number, gender: 'male' | 'female' = 'male', weightClass: 'light' | 'medium' | 'heavy' = 'medium') {
  const supabase = await createClient()

  const { data } = await supabase
    .from('gym_strength_standards')
    .select('*')
    .eq('exercise_id', exerciseId)
    .eq('gender', gender)
    .eq('weight_class', weightClass)
    .single()

  return data
}

// Backfill historical progress data from existing workouts
export async function backfillGymProgressHistory() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  try {
    const { data, error } = await supabase
      .rpc('backfill_gym_progress_history', { user_id_param: user.id })

    if (error) throw error

    return data || 0
  } catch (error) {
    console.error('Error backfilling progress history:', error)
    throw error
  }
}

// Calculate strength balance metrics
export async function calculateStrengthBalanceMetrics() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Get recent progress data (last 3 months)
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - 3)
  const startDateStr = startDate.toISOString().split('T')[0]

  const { data: progressData } = await supabase
    .from('gym_progress_history')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', startDateStr)
    .order('date', { ascending: false })

  if (!progressData || progressData.length === 0) return null

  // Calculate metrics by muscle group
  const pushExercises = [1, 2, 3] // Bench Press, Incline Dumbbell Press, Overhead Press
  const pullExercises = [6, 7, 8] // Deadlift, Barbell Row, Pull-up
  const legExercises = [11, 12, 13] // Squat, Leg Press, Romanian Deadlift
  const coreExercises = [23, 24] // Plank, Cable Crunch

  const pushMax = Math.max(...progressData.filter(p => pushExercises.includes(p.exercise_id)).map(p => p.one_rep_max || 0), 0)
  const pullMax = Math.max(...progressData.filter(p => pullExercises.includes(p.exercise_id)).map(p => p.one_rep_max || 0), 0)
  const legMax = Math.max(...progressData.filter(p => legExercises.includes(p.exercise_id)).map(p => p.one_rep_max || 0), 0)
  const coreMax = Math.max(...progressData.filter(p => coreExercises.includes(p.exercise_id)).map(p => p.one_rep_max || 0), 0)

  // Calculate ratios and scores
  const pushPullRatio = pullMax > 0 ? pushMax / pullMax : 0
  const upperLowerRatio = legMax > 0 ? ((pushMax + pullMax) / 2) / legMax : 0
  const strengthBalanceScore = Math.min(100, Math.round(
    (0.4 * (pushPullRatio >= 0.7 && pushPullRatio <= 1.0 ? 100 : 50)) +
    (0.6 * (upperLowerRatio >= 0.5 && upperLowerRatio <= 0.7 ? 100 : 50))
  ))

  return {
    pushMax,
    pullMax,
    legMax,
    coreMax,
    pushPullRatio,
    upperLowerRatio,
    strengthBalanceScore,
    pushStrength: pushMax,
    pullStrength: pullMax,
    legStrength: legMax,
    coreStrength: coreMax
  }
}

// Get progress trends and projections
export async function getProgressTrends() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Get progress data for the last 6 months
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - 6)
  const startDateStr = startDate.toISOString().split('T')[0]

  const { data: progressData } = await supabase
    .from('gym_progress_history')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', startDateStr)
    .order('date', { ascending: true })

  if (!progressData || progressData.length < 2) return null

  // Simple linear regression to calculate trends
  const calculateTrend = (data: { date: string; one_rep_max: number }[]) => {
    if (data.length < 2) return { slope: 0, intercept: 0, rSquared: 0 }

    const n = data.length
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0

    data.forEach((point, index) => {
      const x = index
      const y = point.one_rep_max
      sumX += x
      sumY += y
      sumXY += x * y
      sumX2 += x * x
      sumY2 += y * y
    })

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n
    const rSquared = Math.pow((n * sumXY - sumX * sumY) / Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)), 2)

    return { slope, intercept, rSquared }
  }

  // Group by exercise and calculate trends
  const exerciseTrends: Record<number, any> = {}
  const exercises = [...new Set(progressData.map(p => p.exercise_id))]

  exercises.forEach(exerciseId => {
    const exerciseData = progressData.filter(p => p.exercise_id === exerciseId)
    const trend = calculateTrend(exerciseData.map(p => ({ date: p.date, one_rep_max: p.one_rep_max })))

    exerciseTrends[exerciseId] = {
      ...trend,
      current: exerciseData[exerciseData.length - 1]?.one_rep_max || 0,
      start: exerciseData[0]?.one_rep_max || 0,
      change: (exerciseData[exerciseData.length - 1]?.one_rep_max || 0) - (exerciseData[0]?.one_rep_max || 0),
      percentChange: exerciseData[0]?.one_rep_max
        ? ((exerciseData[exerciseData.length - 1]?.one_rep_max || 0) - (exerciseData[0]?.one_rep_max || 0)) / (exerciseData[0]?.one_rep_max || 0) * 100
        : 0
    }
  })

  return {
    exerciseTrends,
    overallTrend: calculateTrend(progressData.map(p => ({ date: p.date, one_rep_max: p.one_rep_max })))
  }
}