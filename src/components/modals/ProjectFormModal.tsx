'use client'

import { useState, useEffect } from 'react'
import { useProjects } from '@/contexts/ProjectContext'
import { useGoals } from '@/contexts/GoalContext'
import { triggerHapticFeedback, HapticPatterns } from '@/lib/utils/haptic-feedback'
import type { Project } from '@/types/database'

interface ProjectFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  defaultLifeGoalId?: string
  editingProject?: Project
  mode?: 'create' | 'edit'
}

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

const PROJECT_TYPES: Array<{ value: 'class' | 'lab' | 'project' | 'work' | 'other'; label: string }> = [
  { value: 'class', label: 'Class' },
  { value: 'lab', label: 'Lab' },
  { value: 'project', label: 'Project' },
  { value: 'work', label: 'Work' },
  { value: 'other', label: 'Other' },
]

export function ProjectFormModal({ isOpen, onClose, onSuccess, defaultLifeGoalId, editingProject, mode = 'create' }: ProjectFormModalProps) {
  const { createProject, updateProject } = useProjects()
  const { goals: lifeGoals, loading: loadingGoals } = useGoals()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [lifeGoalId, setLifeGoalId] = useState(defaultLifeGoalId || '')
  const [color, setColor] = useState('#3b82f6')
  const [type, setType] = useState<'class' | 'lab' | 'project' | 'work' | 'other' | ''>('')
  const [targetDate, setTargetDate] = useState('')
  const [loading, setLoading] = useState(false)

  // Initialize form with editing project data
  useEffect(() => {
    if (isOpen) {
      if (editingProject && mode === 'edit') {
        setTitle(editingProject.title)
        setDescription(editingProject.description || '')
        setLifeGoalId(editingProject.life_goal_id || '')
        setColor(editingProject.color)
        setType(editingProject.type || '')
        setTargetDate(editingProject.target_date || '')
      } else {
        // Reset for create mode
        setTitle('')
        setDescription('')
        setLifeGoalId(defaultLifeGoalId || '')
        setColor('#3b82f6')
        setType('')
        setTargetDate('')
      }
    }
  }, [isOpen, editingProject, mode, defaultLifeGoalId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    try {
      setLoading(true)

      if (mode === 'edit' && editingProject) {
        await updateProject(editingProject.id, {
          title: title.trim(),
          description: description.trim() || null,
          life_goal_id: lifeGoalId || null,
          color,
          type: type || null,
          target_date: targetDate || null,
        })
      } else {
        await createProject({
          title: title.trim(),
          description: description.trim() || undefined,
          life_goal_id: lifeGoalId || undefined,
          color,
          type: type || undefined,
          target_date: targetDate || undefined,
        })
      }

      triggerHapticFeedback(HapticPatterns.SUCCESS)
      
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error(`Failed to ${mode} project:`, error)
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
          <h2 className="text-headline-md font-bold text-white">{mode === 'edit' ? 'Edit Project' : 'Add Project'}</h2>
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
            <label htmlFor="project-title" className="block text-body-sm font-medium text-zinc-300 mb-2">
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
            <label htmlFor="project-description" className="block text-body-sm font-medium text-zinc-300 mb-2">
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

          {/* Type */}
          <div>
            <label className="block text-body-sm font-medium text-zinc-300 mb-2">
              Type (optional)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setType('')}
                className={`px-3 py-2 rounded-lg text-body-sm font-medium transition-colors ${
                  type === ''
                    ? 'bg-cyan-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                None
              </button>
              {PROJECT_TYPES.map((projectType) => (
                <button
                  key={projectType.value}
                  type="button"
                  onClick={() => setType(projectType.value)}
                  className={`px-3 py-2 rounded-lg text-body-sm font-medium transition-colors ${
                    type === projectType.value
                      ? 'bg-cyan-600 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {projectType.label}
                </button>
              ))}
            </div>
          </div>

          {/* Life Goal */}
          <div>
            <label htmlFor="project-goal" className="block text-body-sm font-medium text-zinc-300 mb-2">
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
            <label className="block text-body-sm font-medium text-zinc-300 mb-2">
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
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900 scale-110'
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
            <label htmlFor="project-target-date" className="block text-body-sm font-medium text-zinc-300 mb-2">
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
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || loading}
              className="flex-1 px-4 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? (mode === 'edit' ? 'Updating...' : 'Creating...') : (mode === 'edit' ? 'Update Project' : 'Create Project')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
