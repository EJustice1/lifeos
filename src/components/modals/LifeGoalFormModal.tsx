'use client'

import { useState } from 'react'
import { useGoals } from '@/contexts/GoalContext'
import { triggerHapticFeedback, HapticPatterns } from '@/lib/utils/haptic-feedback'
import type { LifeGoal } from '@/types/database'

interface LifeGoalFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function LifeGoalFormModal({ isOpen, onClose, onSuccess }: LifeGoalFormModalProps) {
  const { createGoal } = useGoals()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<LifeGoal['category']>('personal')
  const [targetDate, setTargetDate] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim()) return

    try {
      setLoading(true)
      await createGoal({
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        target_date: targetDate || undefined,
      })
      
      triggerHapticFeedback(HapticPatterns.SUCCESS)
      
      // Reset form
      setTitle('')
      setDescription('')
      setCategory('personal')
      setTargetDate('')
      
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Failed to create life goal:', error)
      triggerHapticFeedback(HapticPatterns.FAILURE)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg shadow-2xl border border-zinc-800 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
          <h2 className="text-headline-md font-bold text-white">Create Life Goal</h2>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="goal-title" className="block text-body-sm font-medium text-zinc-300 mb-2">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              id="goal-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Master Public Speaking"
              autoFocus
              required
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="goal-description" className="block text-body-sm font-medium text-zinc-300 mb-2">
              Description
            </label>
            <textarea
              id="goal-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this goal mean to you?"
              rows={3}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors resize-none"
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="goal-category" className="block text-body-sm font-medium text-zinc-300 mb-2">
              Category
            </label>
            <select
              id="goal-category"
              value={category || 'personal'}
              onChange={(e) => setCategory(e.target.value as LifeGoal['category'])}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
            >
              <option value="personal">Personal</option>
              <option value="career">Career</option>
              <option value="health">Health</option>
              <option value="relationships">Relationships</option>
              <option value="finance">Finance</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Target Date */}
          <div>
            <label htmlFor="goal-target-date" className="block text-body-sm font-medium text-zinc-300 mb-2">
              Target Date
            </label>
            <input
              id="goal-target-date"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || loading}
              className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? 'Creating...' : 'Create Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
