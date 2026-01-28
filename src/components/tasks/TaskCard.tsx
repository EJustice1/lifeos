'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Task } from '@/types/database'
import { useTasks } from '@/contexts/TaskContext'
import { useProjects } from '@/contexts/ProjectContext'
import { DomainLaunchModal } from '@/components/modals/DomainLaunchModal'
import { triggerHapticFeedback, HapticPatterns } from '@/lib/utils/haptic-feedback'

interface TaskCardProps {
  task: Task
  variant?: 'today' | 'backlog' | 'default'
  showCheckbox?: boolean
  showEditButton?: boolean
  onTaskUpdate?: () => void
}

/**
 * Universal TaskCard component that handles all task interactions internally.
 * 
 * Features:
 * - Automatically fetches and applies project colors
 * - Handles task completion toggling
 * - Opens edit modal when clicked (or edit button pressed)
 * - Supports domain-specific launches (gym, study)
 * - Self-contained - manages its own modals and state
 * - Adapts styling based on variant (today/backlog/default)
 */
export function TaskCard({ 
  task, 
  variant = 'default',
  showCheckbox = true,
  showEditButton = true,
  onTaskUpdate
}: TaskCardProps) {
  const router = useRouter()
  const { completeTask, uncompleteTask } = useTasks()
  const { projects } = useProjects()
  
  // Local state for domain modal only
  const [showDomainModal, setShowDomainModal] = useState(false)

  // Get project color
  const project = projects.find(p => p.id === task.project_id)
  const projectColor = project?.color || '#3b82f6'
  
  const isCompleted = task.status === 'completed'

  // Handle checkbox toggle
  const handleToggleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      if (isCompleted) {
        await uncompleteTask(task.id)
      } else {
        await completeTask(task.id)
      }
      triggerHapticFeedback(HapticPatterns.SUCCESS)
      onTaskUpdate?.()
    } catch (error) {
      console.error('Failed to toggle task completion:', error)
      triggerHapticFeedback(HapticPatterns.FAILURE)
    }
  }

  // Handle card click - check for domain launch or navigate to edit page
  const handleCardClick = () => {
    if (task.linked_domain) {
      setShowDomainModal(true)
    } else {
      router.push(`/tasks/${task.id}/edit`)
    }
  }

  // Handle edit button click
  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    router.push(`/tasks/${task.id}/edit`)
    triggerHapticFeedback(HapticPatterns.LIGHT)
  }

  // Get styling based on variant and completion status
  const getCardStyles = () => {
    if (variant === 'backlog') {
      return {
        containerClass: 'py-4 px-6 cursor-pointer hover:opacity-80 transition-opacity bg-zinc-950',
        titleClass: 'text-lg font-bold text-white leading-tight',
        descriptionClass: 'text-sm text-zinc-500 mt-1',
        checkboxSize: 'w-6 h-6',
        checkboxBorderWidth: '2px'
      }
    }
    
    // today or default variant
    return {
      containerClass: `py-6 px-6 cursor-pointer hover:opacity-80 transition-colors border-l-4 ${
        isCompleted ? 'border-emerald-500 bg-emerald-500/5 opacity-70' : 'bg-opacity-5'
      }`,
      titleClass: `text-2xl font-bold leading-tight ${isCompleted ? 'text-zinc-500 line-through' : 'text-white'}`,
      descriptionClass: `text-base mt-2 ${isCompleted ? 'text-zinc-600 line-through' : 'text-zinc-400'}`,
      checkboxSize: 'w-8 h-8',
      checkboxBorderWidth: '3px'
    }
  }

  const styles = getCardStyles()

  // Apply dynamic styles for border and background (only for today/default)
  const dynamicStyles = variant === 'backlog' ? {} : {
    borderLeftColor: isCompleted ? '#10b981' : projectColor,
    backgroundColor: isCompleted ? undefined : `${projectColor}10`
  }

  return (
    <>
      <div 
        onClick={handleCardClick}
        className={styles.containerClass}
        style={dynamicStyles}
      >
        <div className="flex items-start gap-4">
          {/* Checkbox */}
          {showCheckbox && (
            <button
              onClick={handleToggleComplete}
              className={`${styles.checkboxSize} rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-90 ${
                isCompleted
                  ? 'border-emerald-500 bg-emerald-500'
                  : 'hover:border-emerald-500'
              }`}
              style={{
                borderColor: isCompleted ? '#10b981' : projectColor,
                borderWidth: styles.checkboxBorderWidth
              }}
              aria-label={isCompleted ? 'Mark as incomplete' : 'Complete task'}
            >
              {isCompleted && (
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          )}
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className={styles.titleClass}>
              {task.title}
            </div>
            
            {task.description && (
              <div className={styles.descriptionClass}>
                {task.description}
              </div>
            )}
            
            {/* Metadata */}
            <div className="flex items-center gap-4 mt-3">
              {task.scheduled_time && (
                <span 
                  className={`text-sm font-bold font-mono ${isCompleted ? 'text-zinc-600' : ''}`}
                  style={{ color: isCompleted ? undefined : projectColor }}
                >
                  {task.scheduled_time}
                </span>
              )}
              
              {task.duration_minutes && (
                <span 
                  className={`text-sm font-bold ${isCompleted ? 'text-zinc-600' : ''}`}
                  style={{ color: isCompleted ? undefined : projectColor }}
                >
                  {task.duration_minutes}m
                </span>
              )}
              
              {task.linked_domain && (
                <span 
                  className={`text-sm font-bold ${isCompleted ? 'text-zinc-600' : ''}`}
                  style={{ color: isCompleted ? undefined : projectColor }}
                >
                  {task.linked_domain === 'gym' ? '💪 GYM' : '📚 STUDY'}
                </span>
              )}
              
              {task.tags && task.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {task.tags.map(tag => (
                    <span 
                      key={tag} 
                      className={`px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${
                        variant === 'backlog' ? '' : isCompleted ? 'text-zinc-600' : ''
                      }`}
                      style={{ 
                        color: variant === 'backlog' || !isCompleted ? projectColor : undefined 
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Edit Button */}
          {showEditButton && (
            <button
              onClick={handleEditClick}
              className="w-10 h-10 flex items-center justify-center hover:opacity-70 transition-opacity flex-shrink-0"
              style={{ color: projectColor }}
              aria-label="Edit task"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" 
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Domain Launch Modal */}
      {task.linked_domain && showDomainModal && (
        <DomainLaunchModal
          task={task}
          domain={task.linked_domain}
          onClose={() => setShowDomainModal(false)}
        />
      )}
    </>
  )
}
