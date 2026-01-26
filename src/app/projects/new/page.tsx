'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createProject, getLifeGoals } from '@/lib/actions/tasks'
import { triggerHapticFeedback, HapticPatterns } from '@/lib/utils/haptic-feedback'
import type { LifeGoal } from '@/types/database'

const PRESET_COLORS = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Indigo', value: '#6366f1' },
]

export default function NewProjectPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [lifeGoalId, setLifeGoalId] = useState('')
  const [color, setColor] = useState('#3b82f6')
  const [targetDate, setTargetDate] = useState('')
  const [lifeGoals, setLifeGoals] = useState<LifeGoal[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingGoals, setLoadingGoals] = useState(true)

  useEffect(() => {
    loadLifeGoals()
  }, [])

  async function loadLifeGoals() {
    try {
      setLoadingGoals(true)
      const goalsData = await getLifeGoals(false)
      setLifeGoals(goalsData)
    } catch (error) {
      console.error('Failed to load life goals:', error)
    } finally {
      setLoadingGoals(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    try {
      setLoading(true)

      await createProject({
        title: title.trim(),
        description: description.trim() || undefined,
        life_goal_id: lifeGoalId || undefined,
        color,
        target_date: targetDate || undefined,
      })

      triggerHapticFeedback(HapticPatterns.SUCCESS)
      router.push('/actions')
    } catch (error) {
      console.error('Failed to create project:', error)
      triggerHapticFeedback(HapticPatterns.FAILURE)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 pb-24">
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-40">
        <div className="px-4 py-4 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Add Project</h1>
          <button
            onClick={() => router.push('/actions')}
            className="p-2 text-zinc-400 hover:text-white transition-colors"
            aria-label="Cancel"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="px-4 py-6 space-y-4">
        {/* Title */}
        <div>
          <label htmlFor="project-title" className="block text-sm font-medium text-zinc-300 mb-2">
            Title <span className="text-red-400">*</span>
          </label>
          <input
            id="project-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Launch Personal Website"
            autoFocus
            required
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="project-description" className="block text-sm font-medium text-zinc-300 mb-2">
            Description
          </label>
          <textarea
            id="project-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this project about?"
            rows={3}
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
          />
        </div>

        {/* Life Goal */}
        <div>
          <label htmlFor="project-goal" className="block text-sm font-medium text-zinc-300 mb-2">
            Life Goal
          </label>
          {loadingGoals ? (
            <div className="px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-500">
              Loading goals...
            </div>
          ) : (
            <select
              id="project-goal"
              value={lifeGoalId}
              onChange={(e) => setLifeGoalId(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-cyan-500 transition-colors"
            >
              <option value="">No life goal</option>
              {lifeGoals.map((goal) => (
                <option key={goal.id} value={goal.id}>
                  {goal.title}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Color */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Color
          </label>
          <div className="grid grid-cols-9 gap-2">
            {PRESET_COLORS.map((presetColor) => (
              <button
                key={presetColor.value}
                type="button"
                onClick={() => setColor(presetColor.value)}
                className={`w-10 h-10 rounded-lg transition-all ${
                  color === presetColor.value
                    ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-950 scale-110'
                    : 'hover:scale-105'
                }`}
                style={{ backgroundColor: presetColor.value }}
                aria-label={presetColor.name}
                title={presetColor.name}
              />
            ))}
          </div>
        </div>

        {/* Target Date */}
        <div>
          <label htmlFor="project-target-date" className="block text-sm font-medium text-zinc-300 mb-2">
            Target Date
          </label>
          <input
            id="project-target-date"
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={() => router.push('/actions')}
            className="flex-1 px-4 py-3 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!title.trim() || loading}
            className="flex-1 px-4 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? 'Creating...' : 'Create Project'}
          </button>
        </div>
      </form>
    </div>
  )
}
