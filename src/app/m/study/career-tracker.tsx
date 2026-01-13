'use client'

import { useState, useEffect, useTransition } from 'react'
import { useStudySession } from '@/lib/hooks/useStudySession'
import {
  logCompletedSession,
  createBucket,
  archiveBucket,
} from '@/lib/actions/study'
import { MobileCard } from '@/components/mobile/cards/MobileCard'
import { PrimaryButton } from '@/components/mobile/buttons/PrimaryButton'
import { MobileSelect } from '@/components/mobile/inputs/MobileSelect'
import { MobileSlider } from '@/components/mobile/inputs/MobileSlider'
import { ToggleButton } from '@/components/mobile/buttons/ToggleButton'
import { useToast } from '@/components/mobile/feedback/ToastProvider'

interface Bucket {
  id: string
  name: string
  type: 'class' | 'lab' | 'project' | 'work' | 'other'
  color: string
  is_archived: boolean
}

interface Session {
  id: string
  duration_minutes: number
  notes: string | null
  bucket: { name: string; color: string } | null
}

// Helper functions
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

const PRESET_COLORS = [
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#f97316', // orange
  '#6366f1', // indigo
]

const BUCKET_TYPES: Array<'class' | 'lab' | 'project' | 'work' | 'other'> = [
  'class',
  'lab',
  'project',
  'work',
  'other',
]

export function CareerTracker({
  buckets: initialBuckets,
  todaySessions: initialSessions,
}: {
  buckets: Bucket[]
  todaySessions: Session[]
}) {
  const [isPending, startTransition] = useTransition()

  const {
    activeSession: activeStudySession,
    startSession,
    updateTimer,
    updateNotes: updateSessionNotes,
    endSession,
    isSessionActive,
  } = useStudySession()

  // Session state derived from hook
  const isRunning = isSessionActive
  const seconds = activeStudySession?.elapsedSeconds || 0

  // UI mode state
  const [mode, setMode] = useState<'timer' | 'manual'>('timer')
  const [showBucketManager, setShowBucketManager] = useState(false)
  const [showCreateBucket, setShowCreateBucket] = useState(false)

  // Form state
  const [selectedBucket, setSelectedBucket] = useState(
    activeStudySession?.bucketId || initialBuckets[0]?.id || ''
  )
  const [notes, setNotes] = useState(activeStudySession?.notes || '')
  const [manualMinutes, setManualMinutes] = useState(30)
  const [manualHours, setManualHours] = useState(0)

  // Bucket creation state
  const [newBucketName, setNewBucketName] = useState('')
  const [newBucketType, setNewBucketType] = useState<'class' | 'lab' | 'project' | 'work' | 'other'>('class')
  const [newBucketColor, setNewBucketColor] = useState(PRESET_COLORS[0])
  const [bucketError, setBucketError] = useState('')

  // Data state
  const [buckets, setBuckets] = useState(initialBuckets)
  const [todaySessions, setTodaySessions] = useState(initialSessions)

  // Timer effect - increment seconds and update storage
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRunning) {
      interval = setInterval(() => {
        updateTimer(seconds + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRunning, seconds, updateTimer])

  const { showToast } = useToast()

  // Sync notes with session
  useEffect(() => {
    if (notes && isSessionActive) {
      updateSessionNotes(notes)
    }
  }, [notes, isSessionActive])

  // Aggregate today's sessions
  const todayByBucket = todaySessions.reduce((acc, session) => {
    const name = session.bucket?.name ?? 'Unknown'
    const color = session.bucket?.color ?? '#3b82f6'
    if (!acc[name]) {
      acc[name] = { minutes: 0, color }
    }
    acc[name].minutes += session.duration_minutes || 0
    return acc
  }, {} as Record<string, { minutes: number; color: string }>)

  const totalMinutes = Object.values(todayByBucket).reduce((sum, b) => sum + b.minutes, 0)
  const currentSessionMinutes = isRunning ? Math.floor(seconds / 60) : 0
  const adjustedTotal = totalMinutes + currentSessionMinutes

  // Timer handlers
  async function handleStartTimer() {
    if (!selectedBucket) return

    startTransition(async () => {
      try {
        await startSession(selectedBucket)
      } catch (error) {
        showToast('Failed to start session. Please try again.', 'error')
        console.error('Start session error:', error)
      }
    })
  }

  async function handleStopTimer() {
    if (!activeStudySession) return

    const previousSessions = todaySessions

    startTransition(async () => {
      try {
        // Optimistically update
        const bucket = buckets.find(b => b.id === selectedBucket)
        const newSession: Session = {
          id: activeStudySession.sessionId,
          duration_minutes: Math.floor(seconds / 60),
          notes: notes || null,
          bucket: bucket ? { name: bucket.name, color: bucket.color } : null,
        }
        setTodaySessions(prev => [newSession, ...prev])

        await endSession(notes || undefined)
        setNotes('')
        showToast('Session saved!', 'success')
      } catch (error) {
        setTodaySessions(previousSessions)
        showToast('Failed to save session. Please try again.', 'error')
        console.error('Stop session error:', error)
      }
    })
  }

  function handleResetTimer() {
    updateTimer(0)
  }

  // Manual entry handler
  async function handleManualLog() {
    if (!selectedBucket) return

    const totalMin = (manualHours * 60) + manualMinutes
    if (totalMin <= 0) {
      showToast('Duration must be greater than 0', 'error')
      return
    }

    const previousSessions = todaySessions

    startTransition(async () => {
      try {
        // Optimistic update
        const bucket = buckets.find(b => b.id === selectedBucket)
        const tempSession: Session = {
          id: 'temp-' + Date.now(),
          duration_minutes: totalMin,
          notes: notes || null,
          bucket: bucket ? { name: bucket.name, color: bucket.color } : null,
        }
        setTodaySessions(prev => [tempSession, ...prev])

        await logCompletedSession(selectedBucket, totalMin, notes || undefined)

        setManualMinutes(30)
        setManualHours(0)
        setNotes('')
        showToast('Session logged!', 'success')
      } catch (error) {
        setTodaySessions(previousSessions)
        showToast('Failed to log session. Please try again.', 'error')
        console.error('Manual log error:', error)
      }
    })
  }

  // Bucket management handlers
  async function handleCreateBucket() {
    if (!newBucketName.trim()) {
      setBucketError('Name is required')
      return
    }

    setBucketError('')

    startTransition(async () => {
      try {
        const bucket = await createBucket(newBucketName.trim(), newBucketType, newBucketColor)
        setBuckets(prev => [...prev, bucket])
        setSelectedBucket(bucket.id)
        setNewBucketName('')
        setNewBucketType('class')
        setNewBucketColor(PRESET_COLORS[0])
        setShowCreateBucket(false)
        showToast('Bucket created!', 'success')
      } catch (error) {
        showToast('Failed to create bucket. Please try again.', 'error')
        console.error('Create bucket error:', error)
      }
    })
  }

  async function handleArchiveBucket(bucketId: string) {
    const bucketToArchive = buckets.find(b => b.id === bucketId)
    if (!bucketToArchive) return

    const confirmed = confirm(
      `Archive "${bucketToArchive.name}"? Sessions will be preserved but the bucket will be hidden.`
    )
    if (!confirmed) return

    startTransition(async () => {
      try {
        await archiveBucket(bucketId)
        setBuckets(prev => prev.filter(b => b.id !== bucketId))

        if (selectedBucket === bucketId) {
          const remaining = buckets.filter(b => b.id !== bucketId)
          setSelectedBucket(remaining[0]?.id ?? '')
        }

        showToast('Bucket archived!', 'success')
      } catch (error) {
        showToast('Failed to archive bucket. Please try again.', 'error')
        console.error('Archive bucket error:', error)
      }
    })
  }

  // No buckets state
  if (buckets.length === 0) {
    return (
      <section className="space-y-4">
        <div className="bg-zinc-900 rounded-xl p-6 text-center">
          <p className="text-zinc-400 mb-4">No buckets found. Create one to start tracking.</p>
          <button
            onClick={() => {
              setShowBucketManager(true)
              setShowCreateBucket(true)
            }}
            className="bg-emerald-600 hover:bg-emerald-500 rounded-xl px-6 py-3 font-semibold transition-colors"
          >
            Create Your First Bucket
          </button>
        </div>

        {/* Bucket creation form */}
        {showCreateBucket && (
          <div className="bg-zinc-900 rounded-xl p-4">
            <h3 className="text-lg font-semibold mb-4">Create New Bucket</h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-zinc-400 block mb-2">Name</label>
                <input
                  type="text"
                  value={newBucketName}
                  onChange={(e) => {
                    setNewBucketName(e.target.value)
                    setBucketError('')
                  }}
                  placeholder="e.g., CS 101"
                  className="w-full bg-zinc-800 rounded-lg p-3 text-base"
                  maxLength={50}
                />
                {bucketError && (
                  <p className="text-red-400 text-sm mt-1">{bucketError}</p>
                )}
              </div>

              <div>
                <label className="text-sm text-zinc-400 block mb-2">Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {BUCKET_TYPES.map(type => (
                    <button
                      key={type}
                      onClick={() => setNewBucketType(type)}
                      className={`p-3 rounded-lg text-sm font-medium capitalize transition-colors ${
                        newBucketType === type
                          ? 'bg-emerald-600 text-white'
                          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-zinc-400 block mb-2">Color</label>
                <div className="grid grid-cols-8 gap-2">
                  {PRESET_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => setNewBucketColor(color)}
                      className={`w-10 h-10 rounded-lg transition-transform ${
                        newBucketColor === color ? 'ring-2 ring-white scale-110' : ''
                      }`}
                      style={{ backgroundColor: color }}
                      aria-label={`Select color ${color}`}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowCreateBucket(false)
                    setNewBucketName('')
                    setBucketError('')
                  }}
                  disabled={isPending}
                  className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 rounded-xl p-4 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateBucket}
                  disabled={isPending}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-xl p-4 font-semibold transition-colors"
                >
                  {isPending ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    )
  }

  return (
    <section className="space-y-4">

      <MobileCard>
        <button
          onClick={() => setShowBucketManager(!showBucketManager)}
          className="w-full flex items-center justify-between text-left"
        >
          <span className="font-semibold">Manage Buckets</span>
          <span className="text-zinc-400">{showBucketManager ? '▲' : '▼'}</span>
        </button>
      </MobileCard>

      {/* Bucket Manager Section */}
      {showBucketManager && (
        <div className="bg-zinc-900 rounded-xl p-4 space-y-4">
          <div>
            <h3 className="text-sm text-zinc-400 mb-3 font-medium">ACTIVE BUCKETS</h3>
            <div className="space-y-2">
              {buckets.map(bucket => (
                <div
                  key={bucket.id}
                  className="bg-zinc-800 rounded-lg p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: bucket.color }}
                    />
                    <div>
                      <p className="font-medium">{bucket.name}</p>
                      <p className="text-xs text-zinc-500 capitalize">{bucket.type}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleArchiveBucket(bucket.id)}
                    disabled={isPending}
                    className="text-xs text-zinc-400 hover:text-red-400 disabled:opacity-50 transition-colors"
                  >
                    Archive
                  </button>
                </div>
              ))}
            </div>
          </div>

          {!showCreateBucket ? (
            <button
              onClick={() => setShowCreateBucket(true)}
              className="w-full bg-zinc-800 hover:bg-zinc-700 rounded-xl p-4 font-semibold transition-colors"
            >
              + Create New Bucket
            </button>
          ) : (
            <div className="space-y-4 pt-2 border-t border-zinc-800">
              <h3 className="text-lg font-semibold">Create New Bucket</h3>

              <div>
                <label className="text-sm text-zinc-400 block mb-2">Name</label>
                <input
                  type="text"
                  value={newBucketName}
                  onChange={(e) => {
                    setNewBucketName(e.target.value)
                    setBucketError('')
                  }}
                  placeholder="e.g., CS 101"
                  className="w-full bg-zinc-800 rounded-lg p-3 text-base"
                  maxLength={50}
                />
                {bucketError && (
                  <p className="text-red-400 text-sm mt-1">{bucketError}</p>
                )}
              </div>

              <div>
                <label className="text-sm text-zinc-400 block mb-2">Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {BUCKET_TYPES.map(type => (
                    <button
                      key={type}
                      onClick={() => setNewBucketType(type)}
                      className={`p-3 rounded-lg text-sm font-medium capitalize transition-colors ${
                        newBucketType === type
                          ? 'bg-emerald-600 text-white'
                          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-zinc-400 block mb-2">Color</label>
                <div className="grid grid-cols-8 gap-2">
                  {PRESET_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => setNewBucketColor(color)}
                      className={`w-10 h-10 rounded-lg transition-transform ${
                        newBucketColor === color ? 'ring-2 ring-white scale-110' : ''
                      }`}
                      style={{ backgroundColor: color }}
                      aria-label={`Select color ${color}`}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setShowCreateBucket(false)
                    setNewBucketName('')
                    setBucketError('')
                  }}
                  disabled={isPending}
                  className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 rounded-xl p-4 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateBucket}
                  disabled={isPending}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-xl p-4 font-semibold transition-colors"
                >
                  {isPending ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <MobileCard>
        <ToggleButton
          options={[
            { value: 'timer', label: 'Timer' },
            { value: 'manual', label: 'Manual' },
          ]}
          selectedValue={mode}
          onChange={(value) => setMode(value as 'timer' | 'manual')}
          className={`${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
      </MobileCard>

      {/* Main Interface - Timer Mode */}
      {mode === 'timer' && (
        <>
          {/* Bucket selector */}
          <div className="bg-zinc-900 rounded-xl p-4">
            <label className="text-sm text-zinc-400 block mb-2">
              {isRunning ? 'Current Bucket' : 'Select Bucket'}
            </label>
            <select
              value={selectedBucket}
              onChange={(e) => setSelectedBucket(e.target.value)}
              disabled={isRunning}
              className="w-full bg-zinc-800 rounded-lg p-4 text-lg font-medium disabled:opacity-50"
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
            <p className={`text-6xl font-mono font-bold ${isRunning ? 'text-blue-400' : 'text-white'}`}>
              {formatTime(seconds)}
            </p>
            <p className="text-zinc-500 text-sm mt-3">
              {isRunning ? '🔴 Recording...' : 'Ready to start'}
            </p>
          </div>

          {/* Notes input */}
          <div className="bg-zinc-900 rounded-xl p-4">
            <label className="text-sm text-zinc-400 block mb-2">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What are you working on?"
              className="w-full bg-zinc-800 rounded-lg p-3 text-base resize-none"
              rows={2}
              maxLength={500}
              disabled={isPending}
            />
            {notes.length > 400 && (
              <p className="text-xs text-zinc-500 mt-1">{notes.length}/500</p>
            )}
          </div>

          {/* Timer controls */}
          <div className="grid grid-cols-2 gap-3">
            {!isRunning ? (
              <button
                onClick={handleStartTimer}
                disabled={isPending || !selectedBucket}
                className="col-span-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 rounded-xl p-5 text-xl font-bold transition-colors"
              >
                {isPending ? 'Starting...' : 'Start Session'}
              </button>
            ) : (
              <button
                onClick={handleStopTimer}
                disabled={isPending}
                className="col-span-2 bg-red-600 hover:bg-red-500 active:bg-red-700 disabled:opacity-50 rounded-xl p-5 text-xl font-bold transition-colors"
              >
                {isPending ? 'Stopping...' : 'Stop Session'}
              </button>
            )}
            <button
              onClick={handleResetTimer}
              disabled={isRunning}
              className="col-span-2 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 disabled:opacity-50 rounded-xl p-4 text-lg font-semibold transition-colors"
            >
              Reset
            </button>
          </div>
        </>
      )}

      {/* Main Interface - Manual Mode */}
      {mode === 'manual' && (
        <>
          {/* Bucket selector */}
          <div className="bg-zinc-900 rounded-xl p-4">
            <label className="text-sm text-zinc-400 block mb-2">Select Bucket</label>
            <select
              value={selectedBucket}
              onChange={(e) => setSelectedBucket(e.target.value)}
              className="w-full bg-zinc-800 rounded-lg p-4 text-lg font-medium"
            >
              {buckets.map((bucket) => (
                <option key={bucket.id} value={bucket.id}>
                  {bucket.name}
                </option>
              ))}
            </select>
          </div>

          {/* Duration slider */}
          <div className="bg-zinc-900 rounded-xl p-4">
            <label className="text-sm text-zinc-400 block mb-2">
              Duration: {formatMinutes(manualMinutes + manualHours * 60)}
            </label>
            <input
              type="range"
              min="5"
              max="240"
              step="5"
              value={manualMinutes + manualHours * 60}
              onChange={(e) => {
                const total = Number(e.target.value)
                setManualHours(Math.floor(total / 60))
                setManualMinutes(total % 60)
              }}
              className="w-full accent-emerald-500"
            />

            {/* Quick buttons */}
            <div className="grid grid-cols-4 gap-2 mt-3">
              {[15, 30, 60, 120].map(mins => (
                <button
                  key={mins}
                  onClick={() => {
                    setManualHours(Math.floor(mins / 60))
                    setManualMinutes(mins % 60)
                  }}
                  className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm text-zinc-400 transition-colors"
                >
                  {formatMinutes(mins)}
                </button>
              ))}
            </div>

            {/* Manual input */}
            <div className="mt-4 pt-4 border-t border-zinc-800">
              <p className="text-xs text-zinc-500 mb-2">Or enter manually:</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-500 block mb-1">Hours</label>
                  <input
                    type="number"
                    min="0"
                    max="12"
                    value={manualHours}
                    onChange={(e) => setManualHours(Math.max(0, Math.min(12, Number(e.target.value))))}
                    className="w-full bg-zinc-800 rounded-lg p-2 text-center"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 block mb-1">Minutes</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={manualMinutes}
                    onChange={(e) => setManualMinutes(Math.max(0, Math.min(59, Number(e.target.value))))}
                    className="w-full bg-zinc-800 rounded-lg p-2 text-center"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Notes input */}
          <div className="bg-zinc-900 rounded-xl p-4">
            <label className="text-sm text-zinc-400 block mb-2">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What did you work on?"
              className="w-full bg-zinc-800 rounded-lg p-3 text-base resize-none"
              rows={2}
              maxLength={500}
            />
          </div>

          {/* Log button */}
          <button
            onClick={handleManualLog}
            disabled={isPending || !selectedBucket}
            className="w-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 rounded-xl p-5 text-xl font-bold transition-colors"
          >
            {isPending ? 'Logging...' : 'Log Session'}
          </button>
        </>
      )}

      {/* Today's Summary */}
      {(Object.keys(todayByBucket).length > 0 || isRunning) && (
        <div className="bg-zinc-900 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm text-zinc-400 font-medium">TODAY'S PROGRESS</h3>
            <span className="text-2xl font-bold text-emerald-400">
              {formatMinutes(adjustedTotal)}
              {isRunning && <span className="text-sm text-zinc-500 ml-1">(+{formatMinutes(currentSessionMinutes)})</span>}
            </span>
          </div>

          <div className="space-y-3">
            {Object.entries(todayByBucket).map(([name, data]) => {
              const percentage = totalMinutes > 0 ? Math.round((data.minutes / totalMinutes) * 100) : 0
              return (
                <div key={name}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: data.color }}
                      />
                      <span className="text-sm">{name}</span>
                    </div>
                    <span className="text-sm text-emerald-400 font-semibold">
                      {formatMinutes(data.minutes)}
                    </span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: data.color,
                      }}
                    />
                  </div>
                  <p className="text-xs text-zinc-600 mt-1">{percentage}%</p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}
