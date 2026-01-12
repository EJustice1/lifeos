"use client";

import { getPredefinedExercises } from '@/lib/actions/gym'
import { GymLogger } from './gym-logger'
import { useState, useEffect } from 'react'

export default function GymPage() {
  const [exercises, setExercises] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const data = await getPredefinedExercises()
        setExercises([...data])
      } catch (error) {
        console.error('Failed to fetch exercises:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchExercises()
  }, [])

  return (
    <div className="min-h-screen bg-[var(--mobile-bg)] text-white">
      {loading ? (
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--mobile-accent)]"></div>
        </div>
      ) : (
        <GymLogger exercises={exercises} />
      )}
    </div>
  )
}
