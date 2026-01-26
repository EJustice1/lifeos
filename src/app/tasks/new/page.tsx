'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createTask, getProjects } from '@/lib/actions/tasks'
import { triggerHapticFeedback, HapticPatterns } from '@/lib/utils/haptic-feedback'
import { useMachine } from '@/lib/state-machines/useMachine'
import { taskCreationConfig } from '@/lib/state-machines/taskCreationMachine'
import type { Project } from '@/types/database'

function NewTaskForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultDate = searchParams.get('date') || ''
  
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [projectId, setProjectId] = useState<string>('')
  const [scheduledDate, setScheduledDate] = useState(defaultDate)
  const [scheduledTime, setScheduledTime] = useState('')
  const [durationMinutes, setDurationMinutes] = useState<number | ''>('')
  const [projects, setProjects] = useState<Project[]>([])
  const [loadingProjects, setLoadingProjects] = useState(true)

  // State machine for task creation
  const machine = useMachine(taskCreationConfig, 'idle', {})

  useEffect(() => {
    loadProjects()
  }, [])

  async function loadProjects() {
    try {
      setLoadingProjects(true)
      const projectsData = await getProjects(undefined, false)
      setProjects(projectsData)
    } catch (error) {
      console.error('Failed to load projects:', error)
    } finally {
      setLoadingProjects(false)
    }
  }

  const handleSubmit = async (status: 'today' | 'backlog') => {
    if (!title.trim() || machine.state !== 'idle') return

    try {
      // Transition to validating
      machine.transition('EDIT')
      machine.transition('SUBMIT')

      // Validate
      if (!title.trim()) {
        machine.transition('ERROR')
        return
      }

      // Transition to saving
      machine.transition('SUCCESS')

      const taskData = {
        title: title.trim(),
        description: description.trim() || undefined,
        project_id: projectId || undefined,
        scheduled_date: scheduledDate || undefined,
        scheduled_time: scheduledTime || undefined,
        duration_minutes: durationMinutes ? Number(durationMinutes) : undefined,
        status,
      }

      const newTask = await createTask(taskData)

      // Transition to success
      machine.transition('SUCCESS')
      triggerHapticFeedback(HapticPatterns.SUCCESS)
      
      // Navigate back to tasks page (no review for tasks)
      router.push('/tasks')
    } catch (error) {
      console.error('Failed to create task:', error)
      machine.transition('ERROR')
      triggerHapticFeedback(HapticPatterns.FAILURE)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 pb-24">
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-40">
        <div className="px-4 py-4 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Add Task</h1>
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
      <div className="px-4 py-6 space-y-4">
        {/* Title */}
        <div>
          <label htmlFor="task-title" className="block text-sm font-medium text-zinc-300 mb-2">
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
          <label htmlFor="task-description" className="block text-sm font-medium text-zinc-300 mb-2">
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
          <label htmlFor="task-project" className="block text-sm font-medium text-zinc-300 mb-2">
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
          <div>
            <label htmlFor="task-date" className="block text-sm font-medium text-zinc-300 mb-2">
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

          <div>
            <label htmlFor="task-time" className="block text-sm font-medium text-zinc-300 mb-2">
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
          <label htmlFor="task-duration" className="block text-sm font-medium text-zinc-300 mb-2">
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

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={() => handleSubmit('backlog')}
            disabled={!title.trim() || machine.state === 'saving' || machine.state === 'validating'}
            className="flex-1 px-4 py-3 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {machine.state === 'saving' || machine.state === 'validating' ? 'Adding...' : 'Add to Backlog'}
          </button>
          <button
            type="button"
            onClick={() => handleSubmit('today')}
            disabled={!title.trim() || machine.state === 'saving' || machine.state === 'validating'}
            className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {machine.state === 'saving' || machine.state === 'validating' ? 'Adding...' : 'Add to Today'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function NewTaskPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    }>
      <NewTaskForm />
    </Suspense>
  )
}
