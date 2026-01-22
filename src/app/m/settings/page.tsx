'use client'

import { useState, useEffect } from 'react'
import { getUserSettings, updateUserSettings } from '@/lib/actions/settings'
import { MobileCard } from '@/components/mobile/cards/MobileCard'
import { PrimaryButton } from '@/components/mobile/buttons/PrimaryButton'

export default function SettingsPage() {
  const [studyTarget, setStudyTarget] = useState<number>(120)
  const [workoutTarget, setWorkoutTarget] = useState<number>(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    async function fetchSettings() {
      try {
        const settings = await getUserSettings()
        if (settings) {
          setStudyTarget(settings.daily_study_target_minutes)
          setWorkoutTarget(settings.daily_workout_target)
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
      const result = await updateUserSettings(studyTarget, workoutTarget)

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
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center pt-4 pb-2">
          <h1 className="text-2xl font-bold mb-2">Settings</h1>
          <p className="text-zinc-400 text-sm">Configure your daily goals</p>
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
            <p className="text-sm font-medium">{message.text}</p>
          </div>
        )}

        {/* Study Target */}
        <MobileCard title="Study Target">
          <p className="text-sm text-zinc-400 mb-4">
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
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
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
        </MobileCard>

        {/* Workout Target */}
        <MobileCard title="Workout Target">
          <p className="text-sm text-zinc-400 mb-4">
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
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
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
        </MobileCard>

        {/* Information Card */}
        <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg">
          <h3 className="text-sm font-semibold text-purple-400 mb-2">How These Goals Are Used</h3>
          <ul className="space-y-2 text-xs text-zinc-400">
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
      </div>
    </div>
  )
}
