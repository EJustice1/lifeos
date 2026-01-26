'use client'

import { useState, useEffect, useTransition } from 'react'
import { useSession } from '@/context/SessionContext'
import { startStudySession, endStudySession, deleteStudySession, updateStudySession } from '@/lib/actions/study'
import { useRouter } from 'next/navigation'

interface Bucket {
  id: string
  name: string
  color: string
}

interface Session {
  id: string
  duration_minutes: number
  bucket: { id?: string; name: string; color: string } | null
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
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedBucket, setSelectedBucket] = useState(buckets[0]?.id ?? '')
  const [activeSession, setActiveSession] = useState<string | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [editingSession, setEditingSession] = useState<string | null>(null)
  const [editDuration, setEditDuration] = useState(0)

  const {
    activeSession: contextSession,
    startSession,
    endSession,
    getSessionDuration
  } = useSession()

  // Sync local state with context session
  const [seconds, setSeconds] = useState(contextSession?.type === 'study' ? getSessionDuration() : 0)

  // Restore selected bucket from active session on mount
  // Only restore if session is recent (within last 30 seconds of starting)
  useEffect(() => {
    if (contextSession?.type === 'study' && contextSession.bucketId) {
      // Validate that session is actually active and recent
      const sessionStartTime = new Date(contextSession.startedAt).getTime()
      const timeSinceStart = Date.now() - sessionStartTime
      
      // Only restore if session started recently or has been running
      // Don't restore if session is very fresh (< 2 seconds) as it might be a leftover
      if (timeSinceStart > 2000) {
        setSelectedBucket(contextSession.bucketId)
        setIsRunning(true)
      }
    }
  }, [])

  // Sync with context session changes
  useEffect(() => {
    if (contextSession?.type === 'study') {
      setSeconds(getSessionDuration())
      setIsRunning(true)
      // Update selected bucket if session bucket changes
      if (contextSession.bucketId) {
        setSelectedBucket(contextSession.bucketId)
      }
    } else {
      setIsRunning(false)
    }
  }, [contextSession, getSessionDuration])

  // Update timer display every second when running
  useEffect(() => {
    if (isRunning) {
      const interval = setInterval(() => {
        setSeconds(getSessionDuration())
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [isRunning, getSessionDuration])

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
      startSession('study', { bucketId: selectedBucket })
      setIsRunning(true)
    })
  }

  async function handleStop() {
    if (!activeSession) return

    const sessionId = activeSession
    const durationSeconds = seconds

    startTransition(async () => {
      let shouldNavigateToReview = false
      
      try {
        await endStudySession(sessionId)
        // Only show review if session is at least 1 minute (60 seconds)
        shouldNavigateToReview = durationSeconds >= 60
      } catch (error) {
        // Check if it's a validation error (session too short)
        const isValidationError = error instanceof Error && 
          (error.message.includes('no time') || error.message.includes('too short'))
        
        // Only log real errors (not validation errors)
        if (!isValidationError) {
          console.error('Failed to end study session:', error)
        }
        
        // Don't navigate to review if session was too short or failed
        shouldNavigateToReview = false
      } finally {
        // Always clear session state
        endSession()
        setActiveSession(null)
        setIsRunning(false)
        
        // Navigate to review after state is cleared, only if session was long enough
        if (shouldNavigateToReview) {
          setTimeout(() => {
            router.push(`/review/study?sessionId=${sessionId}`)
          }, 100)
        } else {
          // Just refresh the page to show updated stats
          router.refresh()
        }
      }
    })
  }

  function handleReset() {
    setSeconds(0)
  }

  async function handleDeleteSession(sessionId: string) {
    if (!confirm('Delete this session?')) return

    startTransition(async () => {
      try {
        await deleteStudySession(sessionId)
        router.refresh()
      } catch (error) {
        console.error('Failed to delete session:', error)
      }
    })
  }

  async function handleUpdateSession(sessionId: string) {
    if (editDuration <= 0) return

    startTransition(async () => {
      try {
        await updateStudySession(sessionId, editDuration)
        setEditingSession(null)
        router.refresh()
      } catch (error) {
        console.error('Failed to update session:', error)
      }
    })
  }

  function startEdit(session: Session) {
    setEditingSession(session.id)
    setEditDuration(session.duration_minutes || 0)
  }

  if (buckets.length === 0) {
    return (
      <div className="bg-zinc-900 rounded-xl p-6 text-center">
        <p className="text-zinc-400 mb-4">No buckets found. Create one to start tracking.</p>
        <p className="text-zinc-500 text-body-sm">Run the database migration and add buckets from the desktop view.</p>
      </div>
    )
  }

  return (
      <section className="space-y-4">
      {/* Bucket selector */}
      <div className="bg-zinc-900 rounded-xl p-4">
        <label className="text-body-sm text-zinc-400 block mb-2">Bucket</label>
        <select
          value={selectedBucket}
          onChange={(e) => setSelectedBucket(e.target.value)}
          disabled={isRunning}
          className="w-full bg-zinc-800 rounded-lg p-3 text-title-md disabled:opacity-50"
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
        <p className={`text-display-lg font-mono font-bold ${isRunning ? 'text-blue-400' : ''}`}>
          {formatTime(seconds)}
        </p>
        <p className="text-zinc-500 text-body-sm mt-2">
          {isRunning ? 'Session in progress' : 'Session time'}
        </p>
      </div>

      {/* Timer controls */}
      <div className="grid grid-cols-2 gap-3">
        {!isRunning ? (
          <button
            onClick={handleStart}
            disabled={isPending}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-xl p-4 text-title-md font-semibold transition-colors"
          >
            {isPending ? 'Starting...' : 'Start'}
          </button>
        ) : (
          <button
            onClick={handleStop}
            disabled={isPending}
            className="bg-red-600 hover:bg-red-500 disabled:opacity-50 rounded-xl p-4 text-title-md font-semibold transition-colors"
          >
            {isPending ? 'Stopping...' : 'Stop'}
          </button>
        )}
        <button
          onClick={handleReset}
          disabled={isRunning}
          className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 rounded-xl p-4 text-title-md font-semibold transition-colors"
        >
          Reset
        </button>
      </div>

      {/* Today's completed sessions */}
      {todaySessions.length > 0 && (
        <div className="bg-zinc-900 rounded-xl p-4">
          <h3 className="text-body-sm text-zinc-400 mb-3">Today's Sessions</h3>
          <div className="space-y-2">
            {todaySessions.map((session) => {
              const bucketData = Array.isArray(session.bucket) ? session.bucket[0] : session.bucket
              const bucketName = bucketData?.name ?? 'Unknown'
              
              return (
                <div key={session.id} className="bg-zinc-800 rounded-lg p-3">
                  {editingSession === session.id ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={editDuration}
                          onChange={(e) => setEditDuration(parseInt(e.target.value) || 0)}
                          className="flex-1 bg-zinc-700 rounded px-2 py-1 text-white"
                          min="1"
                        />
                        <span className="text-zinc-400 text-body-sm">min</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateSession(session.id)}
                          disabled={isPending}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded px-3 py-1 text-body-sm font-semibold transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingSession(null)}
                          className="flex-1 bg-zinc-700 hover:bg-zinc-600 rounded px-3 py-1 text-body-sm font-semibold transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="font-medium">{bucketName}</div>
                        <div className="text-body-sm text-zinc-400">{formatMinutes(session.duration_minutes || 0)}</div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(session)}
                          className="p-1.5 hover:bg-zinc-700 rounded transition-colors"
                          title="Edit duration"
                        >
                          <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteSession(session.id)}
                          disabled={isPending}
                          className="p-1.5 hover:bg-zinc-700 rounded transition-colors disabled:opacity-50"
                          title="Delete session"
                        >
                          <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          
          {/* Summary */}
          {Object.keys(todayByBucket).length > 0 && (
            <div className="mt-3 pt-3 border-t border-zinc-800">
              <h4 className="text-label-sm text-zinc-500 mb-2">Summary by Subject</h4>
              <div className="space-y-1">
                {Object.entries(todayByBucket).map(([name, minutes]) => (
                  <div key={name} className="flex justify-between text-body-sm">
                    <span className="text-zinc-400">{name}</span>
                    <span className="text-emerald-400 font-medium">{formatMinutes(minutes)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      </section>
  )
}
