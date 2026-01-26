'use client'

import { useState, useEffect } from 'react'
import { getUserSettings, updateUserSettings } from '@/lib/actions/settings'
import { endAllActiveStudySessions } from '@/lib/actions/study'
import { endAllActiveWorkouts } from '@/lib/actions/gym'
import { PrimaryButton } from '@/components/mobile/buttons/PrimaryButton'
import Link from 'next/link'

export default function SettingsPage() {
  const [studyTarget, setStudyTarget] = useState<number>(120)
  const [workoutTarget, setWorkoutTarget] = useState<number>(1)
  const [reviewCutoffHour, setReviewCutoffHour] = useState<number>(9)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [cleaning, setCleaning] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    async function fetchSettings() {
      try {
        const settings = await getUserSettings()
        if (settings) {
          setStudyTarget(settings.daily_study_target_minutes)
          setWorkoutTarget(settings.daily_workout_target)
          setReviewCutoffHour(settings.daily_review_cutoff_hour)
        }
      } catch (error) {
        console.error('Error loading settings:', error)
        setMessage({ type: 'error', text: 'Failed to load settings' })
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const result = await updateUserSettings(studyTarget, workoutTarget, reviewCutoffHour)

      if (result.success) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' })
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to save settings' })
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      setMessage({ type: 'error', text: 'Unexpected error occurred' })
    } finally {
      setSaving(false)
    }
  }

  const handleCleanupSessions = async () => {
    if (!confirm('This will end all active sessions (study and gym). Are you sure?')) {
      return
    }

    setCleaning(true)
    setMessage(null)

    try {
      const [studyResult, gymResult] = await Promise.all([
        endAllActiveStudySessions(),
        endAllActiveWorkouts()
      ])

      const totalEnded = studyResult.count + gymResult.count

      if (totalEnded > 0) {
        setMessage({ 
          type: 'success', 
          text: `Successfully ended ${totalEnded} orphaned session${totalEnded === 1 ? '' : 's'}!` 
        })
      } else {
        setMessage({ 
          type: 'success', 
          text: 'No orphaned sessions found. Everything is clean!' 
        })
      }

      setTimeout(() => setMessage(null), 5000)
    } catch (error) {
      console.error('Error cleaning up sessions:', error)
      setMessage({ type: 'error', text: 'Failed to clean up sessions' })
    } finally {
      setCleaning(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--mobile-bg)] text-white flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--mobile-bg)] text-white p-4 pb-24">
      {/* Back to root button */}
      <Link 
        href="/" 
        className="fixed top-4 right-4 z-50 w-10 h-10 bg-zinc-800/80 backdrop-blur-sm border border-zinc-700 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </Link>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center pt-4 pb-2">
          <h1 className="text-headline-md font-bold mb-2">Settings</h1>
          <p className="text-zinc-400 text-body-sm">Configure your daily goals</p>
        </div>

        {/* Message Toast */}
        {message && (
          <div
            className={`p-4 rounded-lg border ${
              message.type === 'success'
                ? 'bg-emerald-900/30 border-emerald-500 text-emerald-300'
                : 'bg-red-900/30 border-red-500 text-red-300'
            }`}
          >
            <p className="text-body-sm font-medium">{message.text}</p>
          </div>
        )}

        {/* Study Target */}
        <div>
          <h3 className="text-title-lg font-semibold mb-4 text-white">Study Target</h3>
          <p className="text-body-sm text-zinc-400 mb-4">
            Daily study time goal (used for execution score validation)
          </p>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="study-target" className="text-zinc-300 font-medium">
                Target Minutes
              </label>
              <span className="text-purple-400 font-semibold">
                {Math.floor(studyTarget / 60)}h {studyTarget % 60}m
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setStudyTarget(Math.max(0, studyTarget - 15))}
                className="w-12 h-12 rounded-lg bg-zinc-800 border border-zinc-700 hover:border-purple-500 transition-colors flex items-center justify-center text-xl"
              >
                −
              </button>

              <input
                id="study-target"
                type="number"
                value={studyTarget}
                onChange={(e) => setStudyTarget(Math.max(0, Math.min(1440, parseInt(e.target.value) || 0)))}
                className="flex-1 h-12 px-4 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-center focus:outline-none focus:border-purple-500 transition-colors"
                min="0"
                max="1440"
              />

              <button
                onClick={() => setStudyTarget(Math.min(1440, studyTarget + 15))}
                className="w-12 h-12 rounded-lg bg-zinc-800 border border-zinc-700 hover:border-purple-500 transition-colors flex items-center justify-center text-xl"
              >
                +
              </button>
            </div>

            {/* Quick presets */}
            <div className="flex gap-2">
              {[30, 60, 90, 120, 180].map((mins) => (
                <button
                  key={mins}
                  onClick={() => setStudyTarget(mins)}
                  className={`flex-1 py-2 px-3 rounded-lg text-label-sm font-medium transition-colors ${
                    studyTarget === mins
                      ? 'bg-purple-500 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Workout Target */}
        <div>
          <h3 className="text-title-lg font-semibold mb-4 text-white">Workout Target</h3>
          <p className="text-body-sm text-zinc-400 mb-4">
            Daily workout sessions goal (used for execution score validation)
          </p>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="workout-target" className="text-zinc-300 font-medium">
                Target Sessions
              </label>
              <span className="text-purple-400 font-semibold">
                {workoutTarget} {workoutTarget === 1 ? 'session' : 'sessions'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setWorkoutTarget(Math.max(0, workoutTarget - 1))}
                className="w-12 h-12 rounded-lg bg-zinc-800 border border-zinc-700 hover:border-purple-500 transition-colors flex items-center justify-center text-xl"
              >
                −
              </button>

              <input
                id="workout-target"
                type="number"
                value={workoutTarget}
                onChange={(e) => setWorkoutTarget(Math.max(0, Math.min(10, parseInt(e.target.value) || 0)))}
                className="flex-1 h-12 px-4 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-center focus:outline-none focus:border-purple-500 transition-colors"
                min="0"
                max="10"
              />

              <button
                onClick={() => setWorkoutTarget(Math.min(10, workoutTarget + 1))}
                className="w-12 h-12 rounded-lg bg-zinc-800 border border-zinc-700 hover:border-purple-500 transition-colors flex items-center justify-center text-xl"
              >
                +
              </button>
            </div>

            {/* Quick presets */}
            <div className="flex gap-2">
              {[0, 1, 2, 3].map((sessions) => (
                <button
                  key={sessions}
                  onClick={() => setWorkoutTarget(sessions)}
                  className={`flex-1 py-2 px-3 rounded-lg text-label-sm font-medium transition-colors ${
                    workoutTarget === sessions
                      ? 'bg-purple-500 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {sessions}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Daily Review Cutoff */}
        <div>
          <h3 className="text-title-lg font-semibold mb-4 text-white">Daily Review Cutoff</h3>
          <p className="text-body-sm text-zinc-400 mb-4">
            Hour when daily review switches from previous day to current day
          </p>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="review-cutoff" className="text-zinc-300 font-medium">
                Cutoff Time
              </label>
              <span className="text-purple-400 font-semibold">
                {reviewCutoffHour === 0 ? '12:00 AM' : reviewCutoffHour === 12 ? '12:00 PM' : reviewCutoffHour < 12 ? `${reviewCutoffHour}:00 AM` : `${reviewCutoffHour - 12}:00 PM`}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setReviewCutoffHour(Math.max(0, reviewCutoffHour - 1))}
                className="w-12 h-12 rounded-lg bg-zinc-800 border border-zinc-700 hover:border-purple-500 transition-colors flex items-center justify-center text-xl"
              >
                −
              </button>

              <input
                id="review-cutoff"
                type="number"
                value={reviewCutoffHour}
                onChange={(e) => setReviewCutoffHour(Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))}
                className="flex-1 h-12 px-4 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-center focus:outline-none focus:border-purple-500 transition-colors"
                min="0"
                max="23"
              />

              <button
                onClick={() => setReviewCutoffHour(Math.min(23, reviewCutoffHour + 1))}
                className="w-12 h-12 rounded-lg bg-zinc-800 border border-zinc-700 hover:border-purple-500 transition-colors flex items-center justify-center text-xl"
              >
                +
              </button>
            </div>

            {/* Quick presets */}
            <div className="flex gap-2">
              {[6, 7, 8, 9, 10].map((hour) => (
                <button
                  key={hour}
                  onClick={() => setReviewCutoffHour(hour)}
                  className={`flex-1 py-2 px-3 rounded-lg text-label-sm font-medium transition-colors ${
                    reviewCutoffHour === hour
                      ? 'bg-purple-500 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {hour}:00
                </button>
              ))}
            </div>

            <div className="p-3 bg-zinc-800/50 border border-zinc-700 rounded-lg">
              <p className="text-label-sm text-zinc-400">
                Before {reviewCutoffHour === 0 ? '12:00 AM' : reviewCutoffHour === 12 ? '12:00 PM' : reviewCutoffHour < 12 ? `${reviewCutoffHour}:00 AM` : `${reviewCutoffHour - 12}:00 PM`}, daily review shows data from yesterday. After, it shows today's data.
              </p>
            </div>
          </div>
        </div>

        {/* Information Card */}
        <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg">
          <h3 className="text-body-sm font-semibold text-purple-400 mb-2">How These Goals Are Used</h3>
          <ul className="space-y-2 text-label-sm text-zinc-400">
            <li className="flex gap-2">
              <span className="text-purple-400">•</span>
              <span>Used to calculate your suggested execution score in daily review</span>
            </li>
            <li className="flex gap-2">
              <span className="text-purple-400">•</span>
              <span>Meeting targets increases minimum allowed execution score</span>
            </li>
            <li className="flex gap-2">
              <span className="text-purple-400">•</span>
              <span>Missing targets may cap your maximum execution score</span>
            </li>
            <li className="flex gap-2">
              <span className="text-purple-400">•</span>
              <span>Adjust these based on your realistic capacity</span>
            </li>
          </ul>
        </div>

        {/* Save Button */}
        <PrimaryButton
          variant="primary"
          size="lg"
          onClick={handleSave}
          disabled={saving}
          className="w-full"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </PrimaryButton>

        {/* Integrations Section */}
        <div>
          <h3 className="text-title-lg font-semibold mb-4 text-white">Integrations</h3>
          <p className="text-body-sm text-zinc-400 mb-4">
            Connect external services to enhance your workflow
          </p>
          
          <Link href="/settings/google-calendar">
            <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg hover:bg-zinc-750 transition-colors cursor-pointer border border-zinc-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-white">Google Calendar</div>
                  <div className="text-label-sm text-zinc-400">Sync events and tasks</div>
                </div>
              </div>
              <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        </div>

        {/* Maintenance Section */}
        <div>
          <h3 className="text-title-lg font-semibold mb-4 text-white">Maintenance</h3>
          <p className="text-body-sm text-zinc-400 mb-4">
            Clean up orphaned or stuck sessions
          </p>

          <div className="space-y-3">
            <div className="p-3 bg-amber-900/20 border border-amber-600/30 rounded-lg">
              <p className="text-label-sm text-amber-300 mb-2">
                ⚠️ Use this if you have a session that won't end or is stuck showing incorrect time.
              </p>
              <p className="text-label-sm text-zinc-400">
                This will forcefully end all active study and gym sessions in the database.
              </p>
            </div>

            <button
              onClick={handleCleanupSessions}
              disabled={cleaning}
              className="w-full py-3 px-4 rounded-lg bg-amber-600/20 border border-amber-600/50 text-amber-300 hover:bg-amber-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {cleaning ? 'Cleaning up...' : 'Clean Up Orphaned Sessions'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
