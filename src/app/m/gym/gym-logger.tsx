'use client'

import { useState, useTransition, useEffect } from 'react'
import { useGymSession, type LoggedSet } from '@/lib/hooks/useGymSession'
import { calculate1RM } from '@/lib/gym-utils'
import { getRecentWorkoutsWithDetails } from '@/lib/actions/gym'
import { MobileCard } from '@/components/mobile/cards/MobileCard'
import { PrimaryButton } from '@/components/mobile/buttons/PrimaryButton'
import { MobileSelect } from '@/components/mobile/inputs/MobileSelect'
import { AdjustButton } from '@/components/mobile/buttons/AdjustButton'
import { WorkoutTypeButton } from '@/components/mobile/buttons/WorkoutTypeButton'
import { useToast } from '@/components/mobile/feedback/ToastProvider'
import { useRef } from 'react'
import { Chart, registerables } from 'chart.js'

interface Exercise {
  readonly id: number
  readonly name: string
  readonly category: string
  readonly primary_muscles?: readonly string[]
  readonly secondary_muscles?: readonly string[]
  readonly is_compound: boolean
  readonly equipment?: string
}

interface WorkoutHistory {
  id: string
  date: string
  type: string
  duration: number // in minutes
  totalVolume: number // in lbs
  exercises: Array<{
    name: string
    totalSets: number
    totalReps: number
    totalVolume: number
    sets: Array<{
      setNumber: number
      reps: number
      weight: number
      volume: number
      estimated1RM: number
    }>
  }>
}

interface PersonalRecord {
  exercise: string
  oneRepMax: number
  date: string
  workoutType: string
}

interface StrengthCategory {
  name: string
  key: string
  score: number
}

// Strength Radar Chart Component
const StrengthRadarChart = ({ personalRecords }: { personalRecords: PersonalRecord[] }) => {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)

  // Register Chart.js components
  useEffect(() => {
    Chart.register(...registerables)
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [])

  // Calculate strength scores for radar chart
  const calculateStrengthScores = () => {
    // Define strength categories and their associated exercises
    const categories = [
      { name: 'Push Strength', exercises: ['Bench Press', 'Overhead Press', 'Dips'], key: 'push' },
      { name: 'Pull Strength', exercises: ['Pull Ups', 'Rows', 'Deadlifts'], key: 'pull' },
      { name: 'Leg Strength', exercises: ['Squats', 'Lunges', 'Leg Press'], key: 'legs' },
      { name: 'Core Strength', exercises: ['Planks', 'Ab Wheel', 'Hanging Leg Raises'], key: 'core' },
    ]

    // Calculate scores (0-100 scale based on PRs)
    return categories.map(category => {
      const categoryPRs = personalRecords.filter(pr =>
        category.exercises.some(ex => pr.exercise.toLowerCase().includes(ex.toLowerCase()))
      )

      if (categoryPRs.length === 0) return { ...category, score: 0 }

      const max1RM = Math.max(...categoryPRs.map(pr => pr.oneRepMax))

      // Simple scoring: scale based on weight (this would be more sophisticated in production)
      // For demo purposes, we'll use a simple linear scale
      const score = Math.min(100, max1RM / 2) // 200lbs 1RM = 100 score
      return { ...category, score: Math.round(score) }
    })
  }

  const strengthData = calculateStrengthScores()

  useEffect(() => {
    if (!chartRef.current) return

    const ctx = chartRef.current.getContext('2d')
    if (!ctx) return

    // Destroy previous chart
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    const data = {
      labels: strengthData.map(cat => cat.name),
      datasets: [{
        label: 'Strength Score',
        data: strengthData.map(cat => cat.score),
        backgroundColor: 'rgba(168, 85, 247, 0.2)',
        borderColor: 'rgba(168, 85, 247, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(168, 85, 247, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(168, 85, 247, 1)',
      }]
    }

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          angleLines: {
            color: 'rgba(255, 255, 255, 0.2)'
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          pointLabels: {
            color: 'white',
            font: {
              size: 12
            }
          },
          ticks: {
            display: false,
            beginAtZero: true,
            max: 100
          }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              return `${strengthData[context.dataIndex].name}: ${context.raw}%`
            }
          }
        }
      }
    }

    chartInstance.current = new Chart(ctx, {
      type: 'radar',
      data: data,
      options: options
    })

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [personalRecords])

  return <canvas ref={chartRef} />
}

// Workout History Card Component
const WorkoutHistoryCard = ({ workout, onExerciseClick }: {
  workout: WorkoutHistory
  onExerciseClick: (exerciseName: string) => void
}) => {
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null)
  const [expandedWorkout, setExpandedWorkout] = useState<string | null>(null)

  return (
    <div className="border-b border-zinc-800 pb-4">
      {/* Workout Header - Clickable */}
      <button
        onClick={() => setExpandedWorkout(expandedWorkout === workout.id ? null : workout.id)}
        className="w-full text-left mb-3 flex items-center justify-between"
      >
        <div>
          <p className="font-semibold">{workout.type} Workout</p>
          <p className="text-sm text-zinc-400">{new Date(workout.date).toLocaleDateString()}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-emerald-400 font-bold">{workout.totalVolume.toLocaleString()} lbs</p>
            <p className="text-sm text-zinc-400">{workout.duration} min</p>
          </div>
          <svg
            className={`w-5 h-5 transform transition-transform ${expandedWorkout === workout.id ? 'rotate-90' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </button>

      {/* Exercise List - Only show when workout is expanded */}
      {expandedWorkout === workout.id && (
        <div className="space-y-2 ml-4">
          {workout.exercises.map((exercise) => (
            <div key={exercise.name} className="border-l-2 border-zinc-700 pl-3">
              {/* Exercise Header - Clickable */}
              <button
                onClick={() => setExpandedExercise(expandedExercise === exercise.name ? null : exercise.name)}
                className="w-full text-left py-2 flex items-center justify-between"
              >
                <div>
                  <span className="font-medium">{exercise.name}</span>
                  <span className="text-zinc-400 ml-2 text-sm">
                    {exercise.totalSets} sets • {exercise.totalReps} reps • {exercise.totalVolume} lbs
                  </span>
                </div>
                <svg
                  className={`w-4 h-4 transform transition-transform ${expandedExercise === exercise.name ? 'rotate-90' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Expanded Set Details - More Compact */}
              {expandedExercise === exercise.name && (
                <div className="ml-4 mt-2 space-y-1">
                  {exercise.sets.map((set, index) => (
                    <div key={index} className="bg-zinc-900/50 rounded p-1.5 flex items-center justify-between text-xs">
                      <span className="text-zinc-300">Set {set.setNumber}</span>
                      <span className="text-emerald-400 font-semibold">
                        {set.weight} × {set.reps} = {set.volume} lbs
                      </span>
                      <span className="text-purple-400 ml-2">1RM: {set.estimated1RM}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function GymLogger({
  exercises,
  initialWorkoutHistory = [],
}: {
  exercises: readonly Exercise[]
  initialWorkoutHistory?: any[]
}) {
  const [isPending, startTransition] = useTransition()
  const [selectedExercise, setSelectedExercise] = useState<number | null>(exercises.length > 0 ? exercises[0].id : null)
  const [reps, setReps] = useState(8)
  const [weight, setWeight] = useState(135)
  const [workoutType, setWorkoutType] = useState<string>('')
  const [activeSection, setActiveSection] = useState<'workout' | 'history' | 'progress'>('workout')
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutHistory[]>(initialWorkoutHistory)

  // Function to refresh workout history from database
  const refreshWorkoutHistory = async () => {
    try {
      const dbWorkoutHistory = await getRecentWorkoutsWithDetails(20)

      // Transform database workout history to match expected format
      const transformedHistory = dbWorkoutHistory.map(workout => {
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

        workout.lifts.forEach((lift: any) => {
          const exerciseName = lift.exercise?.name || 'Unknown Exercise'
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
          date: workout.date || workout.started_at.split('T')[0],
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

      setWorkoutHistory(transformedHistory)
    } catch (error) {
      console.error('Failed to refresh workout history:', error)
    }
  }
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([])

  const {
    activeWorkout,
    startWorkout,
    logSet,
    endWorkout,
    isWorkoutActive,
    getSessionDuration,
  } = useGymSession()

  // Get logged sets from active workout
  const loggedSets = activeWorkout?.loggedSets || []

  // Sync workout duration
  const [workoutDuration, setWorkoutDuration] = useState<number>(getSessionDuration())

  // Calculate estimated 1RM for current input
  const estimated1RM = calculate1RM(weight, reps)


  // Update timer display every second when workout is active
  useEffect(() => {
    if (isWorkoutActive) {
      const interval = setInterval(() => {
        setWorkoutDuration(getSessionDuration())
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [isWorkoutActive, getSessionDuration])

  // Format duration as MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Calculate total volume for current workout
  const totalVolume = loggedSets.reduce((sum, s) => sum + s.reps * s.weight, 0)

  // Get sets for current exercise
  const currentExerciseSets = selectedExercise ? loggedSets.filter(s => s.exerciseId === selectedExercise) : []
  const currentSetNumber = currentExerciseSets.length + 1

  // Get current exercise details
  const currentExerciseDetails = exercises.find(e => e.id === selectedExercise)

  const adjustWeight = (delta: number) => {
    setWeight(prev => Math.max(0, prev + delta))
  }

  const adjustReps = (delta: number) => {
    setReps(prev => Math.max(1, prev + delta))
  }



  const { showToast } = useToast()

  async function handleStartWorkout(type: string) {
    startTransition(async () => {
      try {
        await startWorkout(type)
      } catch (error) {
        showToast('Failed to start workout', 'error')
      }
    })
  }

  async function handleLogSet() {
    if (!isWorkoutActive || !selectedExercise) return

    startTransition(async () => {
      try {
        const exerciseName = exercises.find(e => e.id === selectedExercise)?.name ?? ''
        const result = await logSet(selectedExercise, weight, reps, exerciseName)

        if (result.isNewPR) {
          showToast(`🏆 New PR on ${exerciseName}!`, 'success')

          // Update personal records
          const newPR: PersonalRecord = {
            exercise: exerciseName,
            oneRepMax: calculate1RM(weight, reps),
            date: new Date().toISOString(),
            workoutType: activeWorkout?.workoutType || 'General'
          }

          setPersonalRecords(prev => {
            // Remove any existing PR for this exercise if new one is better
            const existingPRs = prev.filter(pr => pr.exercise !== exerciseName || pr.oneRepMax > newPR.oneRepMax)
            return [...existingPRs, newPR]
          })
        }
      } catch (error) {
        showToast('Failed to log set', 'error')
      }
    })
  }

  async function handleEndWorkout() {
    if (!activeWorkout) return

    startTransition(async () => {
      try {
        // Use actual workout duration from timer
        const duration = Math.round(workoutDuration / 60) // Convert seconds to minutes

        // Calculate total volume
        const totalVolume = loggedSets.reduce((sum, set) => sum + set.reps * set.weight, 0)

        // Group exercises with detailed set information for history
        const exerciseDetails = loggedSets.reduce((acc, set) => {
          if (!acc[set.exercise]) {
            acc[set.exercise] = {
              sets: [],
              totalSets: 0,
              totalReps: 0,
              totalVolume: 0
            }
          }
          acc[set.exercise].sets.push({
            setNumber: set.setNumber,
            reps: set.reps,
            weight: set.weight,
            volume: set.reps * set.weight,
            estimated1RM: set.estimated1RM
          })
          acc[set.exercise].totalSets++
          acc[set.exercise].totalReps += set.reps
          acc[set.exercise].totalVolume += set.reps * set.weight
          return acc
        }, {} as Record<string, {
          sets: Array<{ setNumber: number; reps: number; weight: number; volume: number; estimated1RM: number }>;
          totalSets: number;
          totalReps: number;
          totalVolume: number;
        }>)

        // Create workout history entry with detailed set data
        const newWorkoutHistory: WorkoutHistory = {
          id: activeWorkout.workoutId,
          date: new Date().toISOString(),
          type: activeWorkout.workoutType || 'General',
          duration: duration,
          totalVolume: totalVolume,
          exercises: Object.entries(exerciseDetails).map(([name, data]) => ({
            name,
            totalSets: data.totalSets,
            totalReps: data.totalReps,
            totalVolume: data.totalVolume,
            sets: data.sets // Store individual sets with details
          }))
        }

        // End workout first to ensure database is updated
        await endWorkout()

        // Refresh workout history from database to ensure consistency
        await refreshWorkoutHistory()

        // Show success confirmation
        showToast('Workout completed successfully! 🎉', 'success')

        // Update local state
        setWorkoutType('')

        // Always return to main gym page after ending workout
        // Use setTimeout to ensure state updates are processed in order
        setTimeout(() => {
          setActiveSection('workout')
        }, 50)
      } catch (error) {
        showToast('Failed to end workout', 'error')
      }
    })
  }



  // Group logged sets by exercise for summary
  const exerciseSummary = loggedSets.reduce((acc, set) => {
    if (!acc[set.exercise]) {
      acc[set.exercise] = { sets: 0, totalReps: 0, totalVolume: 0, bestSet: set, best1RM: set.estimated1RM }
    }
    acc[set.exercise].sets++
    acc[set.exercise].totalReps += set.reps
    acc[set.exercise].totalVolume += set.reps * set.weight
    if (set.estimated1RM > acc[set.exercise].best1RM) {
      acc[set.exercise].bestSet = set
      acc[set.exercise].best1RM = set.estimated1RM
    }
    return acc
  }, {} as Record<string, { sets: number; totalReps: number; totalVolume: number; bestSet: LoggedSet; best1RM: number }>)



  return (
    <section className="space-y-4">
      {activeSection === 'workout' && !isWorkoutActive ? (
          /* New front screen design - 2-column grid with big buttons */
          <div className="flex flex-col h-[calc(100vh-4rem)] p-4">
            <div className="grid grid-cols-2 gap-4 flex-1 content-start">
              {/* Workout Type Buttons - 2 columns */}
              {['Push', 'Pull', 'Chest/Back', 'Arms', 'Legs', 'Upper', 'Full', 'Core'].map(type => (
                <button
                  key={type}
                  onClick={() => {
                    setWorkoutType(type)
                    handleStartWorkout(type)
                  }}
                  className={`p-6 rounded-xl text-lg font-semibold transition-all ${
                    workoutType === type
                      ? 'bg-[var(--mobile-accent)] text-white shadow-lg'
                      : 'bg-[var(--mobile-card-bg)] text-white hover:bg-zinc-800'
                  }`}
                >
                  {type}
                </button>
              ))}

              {/* See History Button */}
              <button
                onClick={() => setActiveSection('history')}
                className="p-6 rounded-xl text-lg font-semibold bg-zinc-800 text-white hover:bg-zinc-700 transition-all col-span-2"
              >
                See History
              </button>

              {/* Progress Button */}
              <button
                onClick={() => setActiveSection('progress')}
                className="p-6 rounded-xl text-lg font-semibold bg-purple-900/50 text-purple-300 hover:bg-purple-900/70 transition-all col-span-2"
              >
                Progress & Strength
              </button>
            </div>

          </div>
        ) : activeSection === 'workout' && isWorkoutActive ? (
        /* Active workout screen */
        <>
          <MobileCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Active Workout</p>
                <p className="font-semibold text-lg">
                  {activeWorkout?.workoutType || 'General'} • {loggedSets.length} sets
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-zinc-400">Timer</p>
                <p className="font-bold text-yellow-400 text-lg">
                  {formatDuration(workoutDuration)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-zinc-400">Volume</p>
                <p className="font-bold text-emerald-400 text-lg">
                  {totalVolume.toLocaleString()} lbs
                </p>
              </div>
            </div>
          </MobileCard>


          <MobileCard>
            <div className="text-sm text-zinc-400 mb-2">Exercise</div>
            <MobileSelect
              options={exercises.map((ex) => ({
                value: ex.id.toString(),
                label: `${ex.name} ${ex.is_compound ? '🏋️' : ''}`,
              }))}
              value={selectedExercise?.toString() || ''}
              onChange={(e) => setSelectedExercise(e.target.value ? parseInt(e.target.value) : null)}
            />
          </MobileCard>

          {/* Set counter */}
          <div className="bg-orange-900/30 rounded-lg p-3 text-center">
            <span className="text-orange-400 font-bold">Set #{currentSetNumber}</span>
            {currentExerciseSets.length > 0 && (
              <span className="text-zinc-400 ml-2">
                (Previous: {currentExerciseSets[currentExerciseSets.length - 1].reps} × {currentExerciseSets[currentExerciseSets.length - 1].weight} lbs)
              </span>
            )}
          </div>

          {/* Show rep and 1RM counter above reps, always show volume */}
          <MobileCard>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <span className="text-zinc-500 text-sm block">Set Volume</span>
                <span className="text-emerald-400 font-bold text-xl">
                  {(reps * weight).toLocaleString()} lbs
                </span>
              </div>
              <div>
                <span className="text-zinc-500 text-sm block">Est. 1RM</span>
                <span className="text-purple-400 font-bold text-xl">
                  {estimated1RM} lbs
                </span>
              </div>
            </div>
          </MobileCard>

          <MobileCard>
            <div className="text-sm text-zinc-400 mb-3 text-center">Reps</div>
            <div className="flex items-center justify-center gap-4">
              <AdjustButton onClick={() => adjustReps(-1)}>−</AdjustButton>
              <input
                type="number"
                value={reps}
                onChange={(e) => setReps(Math.max(1, Number(e.target.value)))}
                className="w-24 bg-transparent text-5xl font-bold text-center"
              />
              <AdjustButton onClick={() => adjustReps(1)}>+</AdjustButton>
            </div>
          </MobileCard>

          <MobileCard>
            <div className="text-sm text-zinc-400 block mb-3 text-center">Weight (lbs)</div>
            <div className="flex items-center justify-center gap-4">
              <AdjustButton onClick={() => adjustWeight(-5)}>-5</AdjustButton>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(Math.max(0, Number(e.target.value)))}
                className="w-28 bg-transparent text-5xl font-bold text-center"
              />
              <AdjustButton onClick={() => adjustWeight(5)}>+5</AdjustButton>
            </div>
            {/* Quick weight adjustments */}
            <div className="flex justify-center gap-2 mt-3">
              {[-10, -2.5, 2.5, 10].map(delta => (
                <button
                  key={delta}
                  onClick={() => adjustWeight(delta)}
                  className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm text-zinc-400"
                >
                  {delta > 0 ? '+' : ''}{delta}
                </button>
              ))}
            </div>
          </MobileCard>

          {/* Side-by-side buttons moved above workout summary */}
          <div className="grid grid-cols-2 gap-2">
            <PrimaryButton
              variant="primary"
              size="lg"
              onClick={handleLogSet}
              disabled={isPending || !selectedExercise}
              loading={isPending}
              className="w-full"
            >
              {isPending ? 'Logging...' : 'Log Set'}
            </PrimaryButton>

            <PrimaryButton
              variant="secondary"
              size="lg"
              onClick={handleEndWorkout}
              disabled={isPending}
              className="w-full"
            >
              End Workout
            </PrimaryButton>
          </div>


          {/* Logged sets summary - Compact display like history */}
          {Object.keys(exerciseSummary).length > 0 && (
            <MobileCard>
              <h3 className="text-sm text-zinc-400 mb-3 font-medium">This Workout</h3>
              <div className="space-y-2 ml-2">
                {Object.entries(exerciseSummary).map(([exerciseName, data]) => (
                  <div key={exerciseName} className="border-l-2 border-zinc-700 pl-3">
                    <div className="py-2 flex items-center justify-between">
                      <div>
                        <span className="font-medium">{exerciseName}</span>
                        <span className="text-zinc-400 ml-2 text-sm">
                          {data.sets} sets • {data.totalReps} reps • {data.totalVolume} lbs
                        </span>
                      </div>
                      <span className="text-emerald-400 font-semibold">
                        Best: {data.bestSet.reps}×{data.bestSet.weight}
                        {data.bestSet.isNewPR && <span className="text-yellow-400 ml-1">🏆</span>}
                      </span>
                    </div>

                    {/* Show all sets for this exercise - compact format */}
                    <div className="ml-4 mt-1 space-y-1">
                      {loggedSets
                        .filter(set => set.exercise === exerciseName)
                        .map((set, index) => (
                          <div key={index} className="bg-zinc-900/50 rounded p-1.5 flex items-center justify-between text-xs">
                            <span className="text-zinc-300">Set {set.setNumber}</span>
                            <span className="text-emerald-400 font-semibold">
                              {set.weight} × {set.reps} = {set.weight * set.reps} lbs
                            </span>
                            <span className="text-purple-400 ml-2">1RM: {set.estimated1RM}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </MobileCard>
          )}
        </>
      ) : activeSection === 'history' ? (
        /* Enhanced History Section */
        <div className="flex flex-col h-[calc(100vh-4rem)] p-4">

          <MobileCard className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Workout History</h2>
              <button
                onClick={() => setActiveSection('workout')}
                className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {workoutHistory.length === 0 ? (
              <p className="text-zinc-400 text-center py-8">No workout history yet. Complete a workout to see your history here.</p>
            ) : (
              <div className="space-y-4">
                {workoutHistory.map(workout => (
                  <WorkoutHistoryCard
                    key={workout.id}
                    workout={workout}
                    onExerciseClick={(exerciseName) => {
                      // Handle exercise click - could show detailed view
                      console.log('Exercise clicked:', exerciseName)
                    }}
                  />
                ))}
              </div>
            )}
          </MobileCard>
        </div>
      ) : (
        /* PRs & Strength Radar Section */
        <div className="flex flex-col h-[calc(100vh-4rem)] p-4">

          <MobileCard className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Progress & Strength</h2>
              <button
                onClick={() => setActiveSection('workout')}
                className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {personalRecords.length === 0 ? (
              <p className="text-zinc-400 text-center py-8">No personal records yet. Complete workouts and set new PRs to track your progress.</p>
            ) : (
              <div className="space-y-6">
                {/* PRs List */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Personal Records</h3>
                  <div className="space-y-3">
                    {personalRecords.map((pr, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg">
                        <div>
                          <p className="font-medium">{pr.exercise}</p>
                          <p className="text-sm text-zinc-400">{pr.workoutType} • {new Date(pr.date).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-emerald-400 font-bold text-lg">{pr.oneRepMax} lbs</p>
                          <p className="text-xs text-zinc-500">1RM</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Strength Radar Chart */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Strength Balance</h3>
                  <div className="h-64 relative">
                    <StrengthRadarChart personalRecords={personalRecords} />
                  </div>
                </div>
              </div>
            )}
          </MobileCard>
        </div>
      )}


      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </section>
  )
}
