'use client'

import { useState } from 'react'
import { useTasks } from '@/contexts/TaskContext'
import { useProjects } from '@/contexts/ProjectContext'
import { triggerHapticFeedback, HapticPatterns } from '@/lib/utils/haptic-feedback'

interface TaskFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  defaultDate?: string
}

export function TaskFormModal({ isOpen, onClose, onSuccess, defaultDate }: TaskFormModalProps) {
  const { createTask } = useTasks()
  const { projects, loading: loadingProjects } = useProjects()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [projectId, setProjectId] = useState<string>('')
  const [scheduledDate, setScheduledDate] = useState(defaultDate || '')
  const [scheduledTime, setScheduledTime] = useState('')
  const [durationMinutes, setDurationMinutes] = useState<number | ''>('')
  const [priority, setPriority] = useState(3)
  const [tags, setTags] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    try {
      setLoading(true)
      
      // Parse tags
      const tagArray = tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0)

      // Determine status based on scheduled date
      const today = new Date().toISOString().split('T')[0]
      const status = scheduledDate === today ? 'today' : 'backlog'

      await createTask({
        title: title.trim(),
        description: description.trim() || undefined,
        project_id: projectId || undefined,
        scheduled_date: scheduledDate || undefined,
        scheduled_time: scheduledTime || undefined,
        duration_minutes: durationMinutes ? Number(durationMinutes) : undefined,
        priority,
        tags: tagArray.length > 0 ? tagArray : undefined,
        status,
      })

      triggerHapticFeedback(HapticPatterns.SUCCESS)
      
      // Reset form
      setTitle('')
      setDescription('')
      setProjectId('')
      setScheduledDate(defaultDate || '')
      setScheduledTime('')
      setDurationMinutes('')
      setPriority(3)
      setTags('')
      
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Failed to create task:', error)
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
          <h2 className="text-headline-md font-bold text-white">Add Task</h2>
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
            <label htmlFor="task-title" className="block text-body-sm font-medium text-zinc-300 mb-2">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              id="task-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              autoFocus
              required
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="task-description" className="block text-body-sm font-medium text-zinc-300 mb-2">
              Description
            </label>
            <textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details..."
              rows={3}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
            />
          </div>

          {/* Project */}
          <div>
            <label htmlFor="task-project" className="block text-body-sm font-medium text-zinc-300 mb-2">
              Project
            </label>
            {loadingProjects ? (
              <div className="px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-500">
                Loading projects...
              </div>
            ) : (
              <select
                id="task-project"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition-colors"
              >
                <option value="">No project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Date and Time Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Due Date */}
            <div>
              <label htmlFor="task-date" className="block text-body-sm font-medium text-zinc-300 mb-2">
                Due Date
              </label>
              <input
                id="task-date"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            {/* Time */}
            <div>
              <label htmlFor="task-time" className="block text-body-sm font-medium text-zinc-300 mb-2">
                Time
              </label>
              <input
                id="task-time"
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Duration */}
          <div>
            <label htmlFor="task-duration" className="block text-body-sm font-medium text-zinc-300 mb-2">
              Duration (minutes)
            </label>
            <input
              id="task-duration"
              type="number"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value ? parseInt(e.target.value) : '')}
              placeholder="e.g., 30"
              min="1"
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Priority */}
          <div>
            <label htmlFor="task-priority" className="block text-body-sm font-medium text-zinc-300 mb-2">
              Priority
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                    priority === p
                      ? 'bg-emerald-600 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <p className="text-label-sm text-zinc-500 mt-2">1 = Lowest, 5 = Highest</p>
          </div>

          {/* Tags */}
          <div>
            <label htmlFor="task-tags" className="block text-body-sm font-medium text-zinc-300 mb-2">
              Tags
            </label>
            <input
              id="task-tags"
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="work, urgent, personal (comma-separated)"
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
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
              className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
