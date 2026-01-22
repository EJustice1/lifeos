"use client";

import { getActiveWorkout } from '@/lib/actions/gym'
import { GymLogger } from './gym-logger'
import { useState, useEffect } from 'react'

export default function GymPage() {
  const [activeWorkout, setActiveWorkout] = useState<any>(null)

  // Check for active workout in background (doesn't block render)
  useEffect(() => {
    let mounted = true;

    const checkActiveWorkout = async () => {
      try {
        const workout = await getActiveWorkout()
        if (mounted) {
          setActiveWorkout(workout)
        }
      } catch (error) {
        console.error('Failed to check active workout:', error)
      }
    }

    checkActiveWorkout()

    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="min-h-screen bg-[var(--mobile-bg)] text-white">
      <GymLogger initialActiveWorkout={activeWorkout} />
    </div>
  )
}
