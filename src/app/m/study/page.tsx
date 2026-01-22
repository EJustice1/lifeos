"use client";

import { getBuckets, getTodaySessions } from '@/lib/actions/study'
import { CareerTracker } from './career-tracker'
import { useState, useEffect } from 'react'

export default function StudyPage() {
  const [buckets, setBuckets] = useState<any[]>([])
  const [todaySessions, setTodaySessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        const [bucketsData, sessionsData] = await Promise.all([
          getBuckets(),
          getTodaySessions(),
        ])

        if (mounted) {
          setBuckets([...bucketsData])
          setTodaySessions([...sessionsData])
        }
      } catch (error) {
        console.error('Failed to fetch study data:', error)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      mounted = false;
    };
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--mobile-bg)] text-white flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--mobile-secondary)] mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--mobile-bg)] text-white">
      <CareerTracker buckets={buckets} todaySessions={todaySessions} />
    </div>
  )
}
