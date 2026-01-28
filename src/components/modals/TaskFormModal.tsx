'use client'

import { useState, useEffect } from 'react'
import { useTasks } from '@/contexts/TaskContext'
import { triggerHapticFeedback, HapticPatterns } from '@/lib/utils/haptic-feedback'
import { TaskFormFields } from '@/components/tasks/TaskFormFields'
import type { Task } from '@/types/database'

interface TaskFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  defaultDate?: string
  taskToEdit?: Task | null
}

export function TaskFormModal({ isOpen, onClose, onSuccess, defaultDate, taskToEdit }: TaskFormModalProps) {
  const { createTask, updateTask, deleteTask } = useTasks()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [projectId, setProjectId] = useState<string>('')
  const [scheduledDate, setScheduledDate] = useState(defaultDate || '')
  const [scheduledTime, setScheduledTime] = useState('')
  const [durationMinutes, setDurationMinutes] = useState<number | ''>('')
  const [priority, setPriority] = useState(3)
  const [tags, setTags] = useState('')
  const [loading, setLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Populate form when editing
  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title)
      setDescription(taskToEdit.description || '')
      setProjectId(taskToEdit.project_id || '')
      setScheduledDate(taskToEdit.scheduled_date || '')
      setScheduledTime(taskToEdit.scheduled_time || '')
      setDurationMinutes(taskToEdit.duration_minutes || '')
      setPriority(taskToEdit.priority || 3)
      setTags(taskToEdit.tags?.join(', ') || '')
    } else {
      // Reset form for new task
      setTitle('')
      setDescription('')
      setProjectId('')
      setScheduledDate(defaultDate || '')
      setScheduledTime('')
      setDurationMinutes('')
      setPriority(3)
      setTags('')
    }
  }, [taskToEdit, defaultDate])

  const handleSubmit = async (e: React.FormEvent, targetStatus?: 'today' | 'backlog' | 'keep') => {
    e.preventDefault()
    if (!title.trim()) return

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
      } else if (targetStatus === 'keep' && taskToEdit) {
        // Keep the current status and scheduled date when just saving
        status = taskToEdit.status as 'today' | 'backlog'
        finalScheduledDate = scheduledDate || taskToEdit.scheduled_date || ''
      }

      if (taskToEdit) {
        // Update existing task
        await updateTask(taskToEdit.id, {
          title: title.trim(),
          description: description.trim() || null,
          project_id: projectId || null,
          scheduled_date: finalScheduledDate || null,
          scheduled_time: scheduledTime || null,
          duration_minutes: durationMinutes ? Number(durationMinutes) : null,
          priority,
          tags: tagArray.length > 0 ? tagArray : null,
          status,
        })
      } else {
        // Create new task
        await createTask({
          title: title.trim(),
          description: description.trim() || undefined,
          project_id: projectId || undefined,
          scheduled_date: finalScheduledDate || undefined,
          scheduled_time: scheduledTime || undefined,
          duration_minutes: durationMinutes ? Number(durationMinutes) : undefined,
          priority,
          tags: tagArray.length > 0 ? tagArray : undefined,
          status,
        })
      }

      triggerHapticFeedback(HapticPatterns.SUCCESS)
      
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error(`Failed to ${taskToEdit ? 'update' : 'create'} task:`, error)
      triggerHapticFeedback(HapticPatterns.FAILURE)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!taskToEdit) return

    try {
      setLoading(true)
      await deleteTask(taskToEdit.id)
      triggerHapticFeedback(HapticPatterns.SUCCESS)
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Failed to delete task:', error)
      triggerHapticFeedback(HapticPatterns.FAILURE)
    } finally {
      setLoading(false)
      setShowDeleteConfirm(false)
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
          <h2 className="text-headline-md font-bold text-white">{taskToEdit ? 'Edit Task' : 'Add Task'}</h2>
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
            {taskToEdit && (
              <>
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
              </>
            )}
            {taskToEdit ? (
              <>
                {/* Primary Save Button */}
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, 'keep')}
                  disabled={!title.trim() || loading}
                  className="w-full px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>

                {/* Move Action - only show opposite of current state */}
                {taskToEdit.status === 'backlog' ? (
                  <button
                    type="button"
                    onClick={(e) => handleSubmit(e, 'today')}
                    disabled={!title.trim() || loading}
                    className="w-full px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    Move to Today
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => handleSubmit(e, 'backlog')}
                    disabled={!title.trim() || loading}
                    className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    Move to Backlog
                  </button>
                )}
              </>
            ) : (
              <div className="flex gap-3">
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
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
