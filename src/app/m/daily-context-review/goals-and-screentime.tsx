'use client'

import { useState, useEffect } from 'react'
import { useDailyReview } from './DailyReviewContext'
import { MobileCard } from '@/components/mobile/cards/MobileCard'
import { PrimaryButton } from '@/components/mobile/buttons/PrimaryButton'
import { TimeInput } from '@/components/mobile/inputs/TimeInput'
import { MobileSelect } from '@/components/mobile/inputs/MobileSelect'
import { createClient } from '@/lib/supabase/client'
import { getBuckets, logCompletedSession, getTodaySessions, deleteStudySession, updateStudySession } from '@/lib/actions/study'

export default function GoalsAndScreentime({ onNext }: { onNext: () => void }) {
  const { formData, setFormData, yesterdayGoals, setYesterdayGoals, completedGoals, setCompletedGoals } = useDailyReview()
  const [loadingGoals, setLoadingGoals] = useState(true)
  const [totalScreenMinutes, setTotalScreenMinutes] = useState(0)
  
  // Study sessions state
  const [existingSessions, setExistingSessions] = useState<Array<{
    id: string
    bucket_id: string
    duration_minutes: number
    bucket: { id: string; name: string; color: string } | null
  }>>([])
  const [buckets, setBuckets] = useState<Array<{id: string, name: string, color: string}>>([])
  const [currentBucketId, setCurrentBucketId] = useState('')
  const [currentDuration, setCurrentDuration] = useState(0)
  const [loadingBuckets, setLoadingBuckets] = useState(true)
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [savingSessions, setSavingSessions] = useState(false)
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const [editDuration, setEditDuration] = useState(0)
  const [showAddSession, setShowAddSession] = useState(false)

  useEffect(() => {
    async function fetchYesterdayGoals() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Get yesterday's date
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayDate = yesterday.toISOString().split('T')[0]

        // Fetch yesterday's review
        const { data } = await supabase
          .from('daily_context_reviews')
          .select('tomorrow_goals')
          .eq('user_id', user.id)
          .eq('date', yesterdayDate)
          .single()

        if (data && data.tomorrow_goals) {
          setYesterdayGoals(data.tomorrow_goals)
        }
      } catch (error) {
        console.error('Error fetching yesterday goals:', error)
      } finally {
        setLoadingGoals(false)
      }
    }

    fetchYesterdayGoals()
  }, [setYesterdayGoals])

  // Fetch buckets and today's sessions
  useEffect(() => {
    async function fetchData() {
      try {
        const [bucketsData, sessionsData] = await Promise.all([
          getBuckets(),
          getTodaySessions()
        ])
        
        setBuckets(bucketsData)
        if (bucketsData.length > 0) setCurrentBucketId(bucketsData[0].id)
        
        setExistingSessions(sessionsData)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoadingBuckets(false)
        setLoadingSessions(false)
      }
    }
    fetchData()
  }, [])

  // Update form data when total screen time changes
  useEffect(() => {
    // Split 50/50 between productive and distracted as default
    const productive = Math.floor(totalScreenMinutes * 0.5)
    const distracted = totalScreenMinutes - productive
    setFormData({
      productiveScreenMinutes: productive,
      distractedScreenMinutes: distracted,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalScreenMinutes])

  const toggleGoalCompletion = (index: number) => {
    const newCompleted = new Set(completedGoals)
    if (newCompleted.has(index)) {
      newCompleted.delete(index)
    } else {
      newCompleted.add(index)
    }
    setCompletedGoals(newCompleted)
  }

  const addStudySession = async () => {
    if (currentBucketId && currentDuration > 0) {
      setSavingSessions(true)
      try {
        // Use midnight start for daily review entries (more intuitive)
        await logCompletedSession(currentBucketId, currentDuration, undefined, {
          useMidnightStart: true
        })
        // Refresh sessions
        const sessionsData = await getTodaySessions()
        setExistingSessions(sessionsData)
        setCurrentDuration(0)
        setShowAddSession(false) // Hide form after adding
      } catch (error) {
        console.error('Error saving study session:', error)
      } finally {
        setSavingSessions(false)
      }
    }
  }

  const deleteSession = async (sessionId: string) => {
    if (!confirm('Delete this session?')) return
    
    setSavingSessions(true)
    try {
      await deleteStudySession(sessionId)
      // Refresh sessions
      const sessionsData = await getTodaySessions()
      setExistingSessions(sessionsData)
    } catch (error) {
      console.error('Error deleting session:', error)
    } finally {
      setSavingSessions(false)
    }
  }

  const startEditSession = (sessionId: string, currentMinutes: number) => {
    setEditingSessionId(sessionId)
    setEditDuration(currentMinutes)
  }

  const cancelEditSession = () => {
    setEditingSessionId(null)
    setEditDuration(0)
  }

  const saveEditSession = async () => {
    if (!editingSessionId || editDuration <= 0) return
    
    setSavingSessions(true)
    try {
      await updateStudySession(editingSessionId, editDuration)
      // Refresh sessions
      const sessionsData = await getTodaySessions()
      setExistingSessions(sessionsData)
      setEditingSessionId(null)
      setEditDuration(0)
    } catch (error) {
      console.error('Error updating session:', error)
    } finally {
      setSavingSessions(false)
    }
  }

  const handleContinue = () => {
    // No need to save sessions here anymore - they're saved immediately
    onNext()
  }

  // Calculate total study time
  const totalStudyMinutes = existingSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-center mb-6">Goals & Screen Time</h1>

      {/* Yesterday's Goals with Checkboxes */}
      {!loadingGoals && yesterdayGoals.length > 0 && (
        <MobileCard title="Yesterday's Goals">
          <p className="text-xs text-zinc-400 mb-3">Did you complete these?</p>
          <div className="space-y-2">
            {yesterdayGoals.map((goal, i) => (
              <button
                key={i}
                onClick={() => toggleGoalCompletion(i)}
                className="w-full flex items-start gap-3 p-2 rounded-lg hover:bg-zinc-800/50 transition-colors text-left"
              >
                <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                  completedGoals.has(i)
                    ? 'bg-emerald-500 border-emerald-500'
                    : 'border-zinc-600'
                }`}>
                  {completedGoals.has(i) && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className={`flex-1 transition-all ${
                  completedGoals.has(i)
                    ? 'text-zinc-500 line-through'
                    : 'text-zinc-300'
                }`}>
                  {goal}
                </span>
              </button>
            ))}
          </div>
          {yesterdayGoals.length > 0 && (
            <div className="mt-3 pt-3 border-t border-zinc-800 text-sm text-zinc-400 flex items-center justify-between">
              <span>Completion Rate</span>
              <span className={`font-semibold ${
                completedGoals.size === yesterdayGoals.length ? 'text-emerald-400' :
                completedGoals.size >= yesterdayGoals.length / 2 ? 'text-yellow-400' :
                'text-red-400'
              }`}>
                {completedGoals.size}/{yesterdayGoals.length} ({Math.round((completedGoals.size / yesterdayGoals.length) * 100)}%)
              </span>
            </div>
          )}
        </MobileCard>
      )}

      {/* Study Sessions */}
      <MobileCard title="Study Sessions">
        <p className="text-xs text-zinc-400 mb-3">
          Review and manage today's study sessions
        </p>
        
        {loadingSessions ? (
          <div className="text-sm text-zinc-400">Loading sessions...</div>
        ) : (
          <>
            {/* Existing Sessions List */}
            {existingSessions.length > 0 ? (
              <div className="space-y-2">
                {existingSessions.map((session) => {
                  const bucketData = Array.isArray(session.bucket) ? session.bucket[0] : session.bucket
                  const bucketName = bucketData?.name ?? 'Unknown'
                  
                  return (
                    <div key={session.id} className="bg-zinc-800 rounded-lg p-3">
                      {editingSessionId === session.id ? (
                        <div className="space-y-2">
                          <div className="text-xs text-zinc-400 mb-1">{bucketName}</div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={editDuration}
                              onChange={(e) => setEditDuration(parseInt(e.target.value) || 0)}
                              className="flex-1 bg-zinc-700 rounded px-2 py-1 text-white"
                              min="1"
                            />
                            <span className="text-zinc-400 text-sm">min</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={saveEditSession}
                              disabled={savingSessions || editDuration <= 0}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded px-3 py-1.5 text-sm font-semibold transition-colors"
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEditSession}
                              disabled={savingSessions}
                              className="flex-1 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 rounded px-3 py-1.5 text-sm font-semibold transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-white">{bucketName}</div>
                            <div className="text-xs text-zinc-400">
                              {session.duration_minutes}m
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEditSession(session.id, session.duration_minutes)}
                              disabled={savingSessions}
                              className="p-1.5 hover:bg-zinc-700 rounded transition-colors disabled:opacity-50"
                              title="Edit duration"
                            >
                              <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => deleteSession(session.id)}
                              disabled={savingSessions}
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
                
                {/* Total */}
                <div className="pt-2 border-t border-zinc-700 text-sm flex justify-between">
                  <span className="text-zinc-400">Total Study Time:</span>
                  <span className="text-emerald-400 font-semibold">
                    {Math.floor(totalStudyMinutes / 60)}h {totalStudyMinutes % 60}m
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-zinc-500 text-center py-4">No study sessions logged today</p>
            )}
            
            {/* Add Session Button (when form is hidden) */}
            {!showAddSession && (
              <div className="pt-3 border-t border-zinc-800">
                <PrimaryButton
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowAddSession(true)}
                  className="w-full"
                >
                  + Add Study Session
                </PrimaryButton>
              </div>
            )}
            
            {/* Add New Session Form (when visible) */}
            {showAddSession && (
              <div className="space-y-3 pt-3 border-t border-zinc-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs text-zinc-400 font-semibold">Add New Session</h4>
                  <button
                    onClick={() => setShowAddSession(false)}
                    className="text-xs text-zinc-500 hover:text-zinc-300"
                  >
                    Cancel
                  </button>
                </div>
              
              {!loadingBuckets && buckets.length > 0 && (
                <MobileSelect
                  label="Subject"
                  value={currentBucketId}
                  onChange={(e) => setCurrentBucketId(e.target.value)}
                  options={buckets.map(bucket => ({
                    value: bucket.id,
                    label: bucket.name
                  }))}
                />
              )}
              
              {loadingBuckets && (
                <div className="text-sm text-zinc-400">Loading subjects...</div>
              )}
              
              {!loadingBuckets && buckets.length === 0 && (
                <div className="text-sm text-yellow-400">
                  No study subjects found. Create one in the Study section first.
                </div>
              )}
              
              <TimeInput
                label="Duration"
                value={currentDuration}
                onChange={setCurrentDuration}
              />
              
                <PrimaryButton
                  variant="secondary"
                  size="sm"
                  onClick={addStudySession}
                  disabled={!currentBucketId || currentDuration === 0 || savingSessions}
                  loading={savingSessions}
                >
                  Add Session
                </PrimaryButton>
              </div>
            )}
          </>
        )}
      </MobileCard>

      {/* Screentime Tracker - Single Input */}
      <MobileCard title="Total Screen Time">
        <p className="text-xs text-zinc-400 mb-3">How much time on devices today?</p>
        <TimeInput
          label="Total screentime"
          value={totalScreenMinutes}
          onChange={setTotalScreenMinutes}
        />
      </MobileCard>

      <PrimaryButton
        variant="primary"
        size="lg"
        onClick={handleContinue}
        className="w-full"
      >
        Continue to Context Snapshot
      </PrimaryButton>
    </div>
  )
}
