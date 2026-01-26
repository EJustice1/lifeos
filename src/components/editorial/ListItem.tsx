import { ReactNode } from 'react'

interface ListItemProps {
  title: string
  description?: string
  metadata?: ReactNode
  actions?: ReactNode
  status?: 'active' | 'today' | 'backlog' | 'completed' | 'cancelled' | 'in_progress'
  interactive?: boolean
  onClick?: () => void
  className?: string
  style?: React.CSSProperties
}

/**
 * ListItem - Structured list entry component
 *
 * Replaces TaskCard and TaskListItem with a unified, flexible component.
 * Features:
 * - Border-bottom separator (not border-all card)
 * - Optional status accent via border-left
 * - Hover state for interactive items
 * - Flexible layout for metadata and actions
 */
export function ListItem({
  title,
  description,
  metadata,
  actions,
  status,
  interactive = false,
  onClick,
  className = '',
  style
}: ListItemProps) {
  const statusColors = {
    active: 'border-l-emerald-400',
    today: 'border-l-blue-400',
    backlog: 'border-l-purple-400',
    completed: 'border-l-emerald-500',
    cancelled: 'border-l-red-400',
    in_progress: 'border-l-yellow-400',
  }

  const statusBorderClass = status ? `border-l-[3px] ${statusColors[status]}` : ''
  const interactiveClass = interactive ? 'cursor-pointer hover:bg-zinc-900/50 transition-colors' : ''
  const clickHandler = interactive && onClick ? onClick : undefined

  return (
    <div
      className={`border-b border-zinc-800 py-4 ${statusBorderClass} ${interactiveClass} ${className}`}
      onClick={clickHandler}
      style={style}
    >
      <div className="flex items-start justify-between gap-4 px-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-title-md font-medium text-white truncate">
            {title}
          </h3>
          {description && (
            <p className="text-body-sm text-zinc-400 mt-1 line-clamp-2">
              {description}
            </p>
          )}
          {metadata && (
            <div className="mt-2 text-label-md text-zinc-500">
              {metadata}
            </div>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
