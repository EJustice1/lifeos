'use client'

import { useState, useEffect, useTransition } from 'react'
import { startStudySession, endStudySession } from '@/lib/actions/study'

interface Bucket {
  id: string
  name: string
  color: string
}

interface Session {
  id: string
  duration_minutes: number
  bucket: { name: string; color: string } | null
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export function StudyTimer({
  buckets,
  todaySessions,
}: {
  buckets: Bucket[]
  todaySessions: Session[]
}) {
  const [isPending, startTransition] = useTransition()
  const [selectedBucket, setSelectedBucket] = useState(buckets[0]?.id ?? '')
  const [activeSession, setActiveSession] = useState<string | null>(null)
  const [seconds, setSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((s) => s + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRunning])

  // Aggregate today's sessions by bucket
  const todayByBucket = todaySessions.reduce((acc, s) => {
    const name = s.bucket?.name ?? 'Unknown'
    if (!acc[name]) acc[name] = 0
    acc[name] += s.duration_minutes || 0
    return acc
  }, {} as Record<string, number>)

  async function handleStart() {
    if (!selectedBucket) return

    startTransition(async () => {
      const session = await startStudySession(selectedBucket)
      setActiveSession(session.id)
      setIsRunning(true)
      setSeconds(0)
    })
  }

  async function handleStop() {
    if (!activeSession) return

    startTransition(async () => {
      await endStudySession(activeSession)
      setActiveSession(null)
      setIsRunning(false)
      setSeconds(0)
    })
  }

  function handleReset() {
    setSeconds(0)
  }

  if (buckets.length === 0) {
    return (
      <div className="bg-zinc-900 rounded-xl p-6 text-center">
        <p className="text-zinc-400 mb-4">No buckets found. Create one to start tracking.</p>
        <p className="text-zinc-500 text-sm">Run the database migration and add buckets from the desktop view.</p>
      </div>
    )
  }

  return (
    <section className="space-y-4">
      {/* Bucket selector */}
      <div className="bg-zinc-900 rounded-xl p-4">
        <label className="text-sm text-zinc-400 block mb-2">Bucket</label>
        <select
          value={selectedBucket}
          onChange={(e) => setSelectedBucket(e.target.value)}
          disabled={isRunning}
          className="w-full bg-zinc-800 rounded-lg p-3 text-lg disabled:opacity-50"
        >
          {buckets.map((bucket) => (
            <option key={bucket.id} value={bucket.id}>
              {bucket.name}
            </option>
          ))}
        </select>
      </div>

      {/* Timer display */}
      <div className="bg-zinc-900 rounded-xl p-8 text-center">
        <p className={`text-5xl font-mono font-bold ${isRunning ? 'text-blue-400' : ''}`}>
          {formatTime(seconds)}
        </p>
        <p className="text-zinc-500 text-sm mt-2">
          {isRunning ? 'Session in progress' : 'Session time'}
        </p>
      </div>

      {/* Timer controls */}
      <div className="grid grid-cols-2 gap-3">
        {!isRunning ? (
          <button
            onClick={handleStart}
            disabled={isPending}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-xl p-4 text-lg font-semibold transition-colors"
          >
            {isPending ? 'Starting...' : 'Start'}
          </button>
        ) : (
          <button
            onClick={handleStop}
            disabled={isPending}
            className="bg-red-600 hover:bg-red-500 disabled:opacity-50 rounded-xl p-4 text-lg font-semibold transition-colors"
          >
            {isPending ? 'Stopping...' : 'Stop'}
          </button>
        )}
        <button
          onClick={handleReset}
          disabled={isRunning}
          className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 rounded-xl p-4 text-lg font-semibold transition-colors"
        >
          Reset
        </button>
      </div>

      {/* Today's progress */}
      {Object.keys(todayByBucket).length > 0 && (
        <div className="bg-zinc-900 rounded-xl p-4">
          <h3 className="text-sm text-zinc-400 mb-3">Today</h3>
          <div className="space-y-2">
            {Object.entries(todayByBucket).map(([name, minutes]) => (
              <div key={name} className="flex justify-between">
                <span>{name}</span>
                <span className="text-emerald-400">{formatMinutes(minutes)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
