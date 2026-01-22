'use client'

import { useState, useEffect } from 'react'
import { useDailyReview } from './DailyReviewContext'
import { MobileCard } from '@/components/mobile/cards/MobileCard'
import { PrimaryButton } from '@/components/mobile/buttons/PrimaryButton'
import { TimeInput } from '@/components/mobile/inputs/TimeInput'
import { MobileSelect } from '@/components/mobile/inputs/MobileSelect'
import { createClient } from '@/lib/supabase/client'
import { getBuckets, logCompletedSession } from '@/lib/actions/study'

export default function GoalsAndScreentime({ onNext }: { onNext: () => void }) {
  const { formData, setFormData, yesterdayGoals, setYesterdayGoals, completedGoals, setCompletedGoals } = useDailyReview()
  const [loadingGoals, setLoadingGoals] = useState(true)
  const [totalScreenMinutes, setTotalScreenMinutes] = useState(0)
  
  // Study sessions state
  const [studySessions, setStudySessions] = useState<Array<{
    bucketId: string
    minutes: number
  }>>([])
  const [buckets, setBuckets] = useState<Array<{id: string, name: string, color: string}>>([])
  const [currentBucketId, setCurrentBucketId] = useState('')
  const [currentDuration, setCurrentDuration] = useState(0)
  const [loadingBuckets, setLoadingBuckets] = useState(true)
  const [savingSessions, setSavingSessions] = useState(false)

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

  // Fetch buckets
  useEffect(() => {
    async function fetchBuckets() {
      try {
        const data = await getBuckets()
        setBuckets(data)
        if (data.length > 0) setCurrentBucketId(data[0].id)
      } catch (error) {
        console.error('Error fetching buckets:', error)
      } finally {
        setLoadingBuckets(false)
      }
    }
    fetchBuckets()
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

  const addStudySession = () => {
    if (currentBucketId && currentDuration > 0) {
      setStudySessions([...studySessions, { 
        bucketId: currentBucketId,
        minutes: currentDuration 
      }])
      setCurrentDuration(0)
    }
  }

  const removeStudySession = (index: number) => {
    setStudySessions(studySessions.filter((_, i) => i !== index))
  }

  const handleContinue = async () => {
    // Save each study session
    if (studySessions.length > 0) {
      setSavingSessions(true)
      for (const session of studySessions) {
        try {
          await logCompletedSession(session.bucketId, session.minutes)
        } catch (error) {
          console.error('Error saving study session:', error)
        }
      }
      setSavingSessions(false)
    }
    
    // Proceed to next screen
    onNext()
  }

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
          Add study sessions completed today
        </p>
        
        <div className="space-y-3">
          {/* Bucket Dropdown */}
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
          
          {/* Duration Input */}
          <TimeInput
            label="Duration"
            value={currentDuration}
            onChange={setCurrentDuration}
          />
          
          {/* Add Button */}
          <PrimaryButton
            variant="secondary"
            size="sm"
            onClick={addStudySession}
            disabled={!currentBucketId || currentDuration === 0}
          >
            Add Session
          </PrimaryButton>
        </div>
        
        {/* Sessions List */}
        {studySessions.length > 0 && (
          <div className="mt-4 space-y-2">
            {studySessions.map((session, i) => (
              <div key={i} className="flex justify-between items-center p-2 bg-zinc-800 rounded">
                <div className="flex-1">
                  <div className="text-sm text-white">
                    {buckets.find(b => b.id === session.bucketId)?.name}
                  </div>
                  <div className="text-xs text-zinc-400">
                    {session.minutes}m
                  </div>
                </div>
                <button onClick={() => removeStudySession(i)} className="p-1">
                  <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            
            {/* Total */}
            <div className="pt-2 border-t border-zinc-700 text-sm">
              <span className="text-zinc-400">Total: </span>
              <span className="text-white font-semibold">
                {Math.floor(studySessions.reduce((sum, s) => sum + s.minutes, 0) / 60)}h{' '}
                {studySessions.reduce((sum, s) => sum + s.minutes, 0) % 60}m
              </span>
            </div>
          </div>
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
        disabled={savingSessions}
        loading={savingSessions}
        className="w-full"
      >
        {savingSessions ? 'Saving...' : 'Continue to Context Snapshot'}
      </PrimaryButton>
    </div>
  )
}
