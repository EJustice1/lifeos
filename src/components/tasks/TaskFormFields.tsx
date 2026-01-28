'use client'

import { useProjects } from '@/contexts/ProjectContext'
import type { Task } from '@/types/database'

interface TaskFormFieldsProps {
  // Form state
  title: string
  description: string
  projectId: string
  scheduledDate: string
  scheduledTime: string
  durationMinutes: number | ''
  priority: number
  tags: string

  // Form handlers
  onTitleChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onProjectIdChange: (value: string) => void
  onScheduledDateChange: (value: string) => void
  onScheduledTimeChange: (value: string) => void
  onDurationMinutesChange: (value: number | '') => void
  onPriorityChange: (value: number) => void
  onTagsChange: (value: string) => void

  // Optional config
  autoFocus?: boolean
  showAllFields?: boolean
}

/**
 * Common base component for task form fields.
 * Provides consistent styling and behavior across all task forms.
 * 
 * Usage:
 * <TaskFormFields
 *   title={title}
 *   onTitleChange={setTitle}
 *   description={description}
 *   onDescriptionChange={setDescription}
 *   ...
 * />
 */
export function TaskFormFields({
  title,
  description,
  projectId,
  scheduledDate,
  scheduledTime,
  durationMinutes,
  priority,
  tags,
  onTitleChange,
  onDescriptionChange,
  onProjectIdChange,
  onScheduledDateChange,
  onScheduledTimeChange,
  onDurationMinutesChange,
  onPriorityChange,
  onTagsChange,
  autoFocus = true,
  showAllFields = true,
}: TaskFormFieldsProps) {
  const { projects, loading: loadingProjects } = useProjects()

  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <label htmlFor="task-title" className="block text-body-sm font-medium text-zinc-300 mb-2">
          Title <span className="text-red-400">*</span>
        </label>
        <input
          id="task-title"
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="What needs to be done?"
          autoFocus={autoFocus}
          required
          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
        />
      </div>

      {/* Description */}
      {showAllFields && (
        <div>
          <label htmlFor="task-description" className="block text-body-sm font-medium text-zinc-300 mb-2">
            Description
          </label>
          <textarea
            id="task-description"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Add more details..."
            rows={3}
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
          />
        </div>
      )}

      {/* Project */}
      {showAllFields && (
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
              onChange={(e) => onProjectIdChange(e.target.value)}
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
      )}

      {/* Date and Time Row */}
      {showAllFields && (
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
              onChange={(e) => onScheduledDateChange(e.target.value)}
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
              onChange={(e) => onScheduledTimeChange(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>
      )}

      {/* Duration */}
      {showAllFields && (
        <div>
          <label htmlFor="task-duration" className="block text-body-sm font-medium text-zinc-300 mb-2">
            Duration (minutes)
          </label>
          <input
            id="task-duration"
            type="number"
            value={durationMinutes}
            onChange={(e) => onDurationMinutesChange(e.target.value ? parseInt(e.target.value) : '')}
            placeholder="e.g., 30"
            min="1"
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
      )}

      {/* Priority */}
      {showAllFields && (
        <div>
          <label htmlFor="task-priority" className="block text-body-sm font-medium text-zinc-300 mb-2">
            Priority
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => onPriorityChange(p)}
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
      )}

      {/* Tags */}
      {showAllFields && (
        <div>
          <label htmlFor="task-tags" className="block text-body-sm font-medium text-zinc-300 mb-2">
            Tags
          </label>
          <input
            id="task-tags"
            type="text"
            value={tags}
            onChange={(e) => onTagsChange(e.target.value)}
            placeholder="work, urgent, personal (comma-separated)"
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
      )}
    </div>
  )
}
