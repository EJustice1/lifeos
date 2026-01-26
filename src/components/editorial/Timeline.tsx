import { ReactNode } from 'react'

interface TimelineItem {
  time?: string
  title: string
  description?: string
  status?: string
  actions?: ReactNode
}

interface TimelineProps {
  items: TimelineItem[]
  variant?: 'default' | 'compact'
  className?: string
}

/**
 * Timeline - Vertical chronological layout
 *
 * Replaces DayTimeline and calendar event cards with clean timeline.
 * Left-aligned times with connected vertical line.
 */
export function Timeline({
  items,
  variant = 'default',
  className = ''
}: TimelineProps) {
  if (items.length === 0) {
    return null
  }

  return (
    <div className={`space-y-0 ${className}`}>
      {items.map((item, index) => (
        <div
          key={index}
          className="relative border-b border-zinc-800 last:border-b-0"
        >
          {/* Vertical connecting line */}
          {index < items.length - 1 && (
            <div className="absolute left-[4.5rem] top-6 bottom-0 w-px bg-zinc-800"></div>
          )}

          <div className="flex gap-6 py-4 px-4">
            {/* Time column (if provided) */}
            {item.time && (
              <div className="w-20 flex-shrink-0">
                <time className="text-label-md font-mono text-zinc-500">
                  {item.time}
                </time>
              </div>
            )}

            {/* Content column */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h4 className={variant === 'compact' ? 'text-title-md font-medium text-white' : 'text-title-lg font-semibold text-white'}>
                    {item.title}
                  </h4>
                  {item.description && (
                    <p className="text-body-sm text-zinc-400 mt-1">
                      {item.description}
                    </p>
                  )}
                  {item.status && (
                    <span className="inline-block mt-2 text-label-sm text-zinc-500">
                      {item.status}
                    </span>
                  )}
                </div>
                {item.actions && (
                  <div className="flex-shrink-0">
                    {item.actions}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
