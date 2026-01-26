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
    // Task statuses - Subtle backgrounds
    active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40',
    today: 'bg-blue-500/15 text-blue-400 border-blue-500/40',
    backlog: 'bg-purple-500/15 text-purple-400 border-purple-500/40',
    completed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40',
    cancelled: 'bg-red-500/15 text-red-400 border-red-500/40',
    in_progress: 'bg-amber-500/15 text-amber-400 border-amber-500/40',
    // Life goal categories
    health: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40',
    career: 'bg-blue-500/15 text-blue-400 border-blue-500/40',
    relationships: 'bg-pink-500/15 text-pink-400 border-pink-500/40',
    finance: 'bg-amber-500/15 text-amber-400 border-amber-500/40',
    personal: 'bg-purple-500/15 text-purple-400 border-purple-500/40',
  }

  const solidStyles = {
    active: 'bg-emerald-500/80 text-white border-emerald-500',
    today: 'bg-blue-500/80 text-white border-blue-500',
    backlog: 'bg-purple-500/80 text-white border-purple-500',
    completed: 'bg-emerald-500/80 text-white border-emerald-500',
    cancelled: 'bg-red-500/80 text-white border-red-500',
    in_progress: 'bg-amber-500/80 text-white border-amber-500',
    health: 'bg-emerald-500/80 text-white border-emerald-500',
    career: 'bg-blue-500/80 text-white border-blue-500',
    relationships: 'bg-pink-500/80 text-white border-pink-500',
    finance: 'bg-amber-500/80 text-white border-amber-500',
    personal: 'bg-purple-500/80 text-white border-purple-500',
  }

  const sizeClasses = {
    sm: 'px-2.5 py-1 text-label-sm',
    md: 'px-3 py-1.5 text-label-md',
  }

  const variantClass = variant === 'subtle' ? statusStyles[status] : solidStyles[status]
  const borderClass = variant === 'subtle' ? 'border' : ''

  return (
    <span
      className={`inline-flex items-center rounded-lg font-semibold ${sizeClasses[size]} ${variantClass} ${borderClass} ${className}`}
    >
      {label || status}
    </span>
  )
}
