"use client";

import { getActiveWorkout } from '@/lib/actions/gym'
import { GymLogger } from './gym-logger'
import { useState, useEffect } from 'react'
import Link from 'next/link'

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
      {/* Back to root button */}
      <Link 
        href="/" 
        className="fixed top-4 right-4 z-50 w-10 h-10 bg-zinc-800/80 backdrop-blur-sm border border-zinc-700 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </Link>
      <GymLogger initialActiveWorkout={activeWorkout} />
    </div>
  )
}
