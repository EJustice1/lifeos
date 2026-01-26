interface StatusBadgeProps {
  status: 'active' | 'today' | 'backlog' | 'completed' | 'cancelled' | 'in_progress' | 'health' | 'career' | 'relationships' | 'finance' | 'personal'
  size?: 'sm' | 'md'
  variant?: 'subtle' | 'solid'
  label?: string
  className?: string
}

/**
 * StatusBadge - Unified status indicator component
 *
 * Consolidates all duplicated status color logic from:
 * - TaskCard (lines 128-143)
 * - TaskListItem (lines 33-42)
 * - LifeGoalCard (lines 17-35)
 * - ProjectCard (lines 19-27)
 *
 * Uses informative color semantics:
 * - emerald: success/active/health
 * - blue: primary/today/career
 * - purple: backlog/personal
 * - yellow: in_progress/warning/finance
 * - red: cancelled/danger
 * - pink: relationships
 */
export function StatusBadge({
  status,
  size = 'sm',
  variant = 'subtle',
  label,
  className = ''
}: StatusBadgeProps) {
  const statusStyles = {
    // Task statuses
    active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    today: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    backlog: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
    in_progress: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    // Life goal categories
    health: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    career: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    relationships: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
    finance: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    personal: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  }

  const solidStyles = {
    active: 'bg-emerald-500 text-white',
    today: 'bg-blue-500 text-white',
    backlog: 'bg-purple-500 text-white',
    completed: 'bg-emerald-500 text-white',
    cancelled: 'bg-red-500 text-white',
    in_progress: 'bg-yellow-500 text-white',
    health: 'bg-emerald-500 text-white',
    career: 'bg-blue-500 text-white',
    relationships: 'bg-pink-400 text-white',
    finance: 'bg-yellow-500 text-white',
    personal: 'bg-purple-500 text-white',
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-label-sm',
    md: 'px-2.5 py-1 text-label-md',
  }

  const variantClass = variant === 'subtle' ? statusStyles[status] : solidStyles[status]
  const borderClass = variant === 'subtle' ? 'border' : ''

  return (
    <span
      className={`inline-flex items-center rounded font-medium ${sizeClasses[size]} ${variantClass} ${borderClass} ${className}`}
    >
      {label || status}
    </span>
  )
}
