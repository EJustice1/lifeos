'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useTasks } from '@/contexts/TaskContext'
import { TaskFormFields } from '@/components/tasks/TaskFormFields'
import { triggerHapticFeedback, HapticPatterns } from '@/lib/utils/haptic-feedback'

function EditTaskForm() {
  const router = useRouter()
  const params = useParams()
  const taskId = params.id as string
  const { tasks, updateTask, deleteTask } = useTasks()
  
  const task = tasks.find(t => t.id === taskId)
  
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [projectId, setProjectId] = useState<string>('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [durationMinutes, setDurationMinutes] = useState<number | ''>('')
  const [priority, setPriority] = useState(3)
  const [tags, setTags] = useState('')
  const [loading, setLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Populate form when task loads
  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || '')
      setProjectId(task.project_id || '')
      setScheduledDate(task.scheduled_date || '')
      setScheduledTime(task.scheduled_time || '')
      setDurationMinutes(task.duration_minutes || '')
      setPriority(task.priority || 3)
      setTags(task.tags?.join(', ') || '')
    }
  }, [task])

  // Redirect if task not found
  useEffect(() => {
    if (!task && tasks.length > 0) {
      router.push('/tasks')
    }
  }, [task, tasks, router])

  const handleSubmit = async (targetStatus?: 'today' | 'backlog' | 'keep') => {
    if (!title.trim() || !task) return

    try {
      setLoading(true)
      
      // Parse tags
      const tagArray = tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0)

      // Determine status based on target or scheduled date
      const today = new Date().toISOString().split('T')[0]
      let status: 'today' | 'backlog' = scheduledDate === today ? 'today' : 'backlog'
      let finalScheduledDate = scheduledDate

      // Handle explicit status changes
      if (targetStatus === 'today') {
        status = 'today'
        finalScheduledDate = today
      } else if (targetStatus === 'backlog') {
        status = 'backlog'
        finalScheduledDate = ''
      } else if (targetStatus === 'keep') {
        // Keep the current status and scheduled date when just saving
        status = task.status as 'today' | 'backlog'
        finalScheduledDate = scheduledDate || task.scheduled_date || ''
      }

      await updateTask(task.id, {
        title: title.trim(),
        description: description.trim() || null,
        project_id: projectId || null,
        scheduled_date: finalScheduledDate || null,
        scheduled_time: scheduledTime || null,
        duration_minutes: durationMinutes ? Number(durationMinutes) : null,
        priority,
        tags: tagArray.length > 0 ? tagArray : undefined,
        status,
      })

      triggerHapticFeedback(HapticPatterns.SUCCESS)
      router.push('/tasks')
    } catch (error) {
      console.error('Failed to update task:', error)
      triggerHapticFeedback(HapticPatterns.FAILURE)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!task) return

    try {
      setLoading(true)
      await deleteTask(task.id)
      triggerHapticFeedback(HapticPatterns.SUCCESS)
      router.push('/tasks')
    } catch (error) {
      console.error('Failed to delete task:', error)
      triggerHapticFeedback(HapticPatterns.FAILURE)
    } finally {
      setLoading(false)
      setShowDeleteConfirm(false)
    }
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 pb-24">
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-40">
        <div className="px-4 py-4 flex items-center justify-between">
          <h1 className="text-headline-lg font-bold text-white">Edit Task</h1>
          <button
            onClick={() => router.push('/tasks')}
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
        <TaskFormFields
          title={title}
          description={description}
          projectId={projectId}
          scheduledDate={scheduledDate}
          scheduledTime={scheduledTime}
          durationMinutes={durationMinutes}
          priority={priority}
          tags={tags}
          onTitleChange={setTitle}
          onDescriptionChange={setDescription}
          onProjectIdChange={setProjectId}
          onScheduledDateChange={setScheduledDate}
          onScheduledTimeChange={setScheduledTime}
          onDurationMinutesChange={setDurationMinutes}
          onPriorityChange={setPriority}
          onTagsChange={setTags}
        />

        {/* Actions */}
        <div className="space-y-3 pt-4">
          {/* Delete Button */}
          {showDeleteConfirm ? (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <p className="text-white text-sm font-medium mb-3">
                Are you sure you want to delete this task?
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full px-4 py-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors font-medium"
            >
              Delete Task
            </button>
          )}

          {/* Primary Save Button */}
          <button
            type="button"
            onClick={() => handleSubmit('keep')}
            disabled={!title.trim() || loading}
            className="w-full px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>

          {/* Move Action - only show opposite of current state */}
          {task.status === 'backlog' ? (
            <button
              type="button"
              onClick={() => handleSubmit('today')}
              disabled={!title.trim() || loading}
              className="w-full px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Move to Today
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleSubmit('backlog')}
              disabled={!title.trim() || loading}
              className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Move to Backlog
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function EditTaskPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    }>
      <EditTaskForm />
    </Suspense>
  )
}
