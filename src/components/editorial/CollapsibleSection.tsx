'use client'

import { ReactNode, useState } from 'react'

interface CollapsibleSectionProps {
  title: string
  badge?: string | number
  children: ReactNode
  defaultExpanded?: boolean
  variant?: 'default' | 'minimal'
  className?: string
}

/**
 * CollapsibleSection - Expandable content section
 *
 * Replaces collapsible card components (LifeGoalCard, ProjectCard).
 * Clean header with chevron indicator, no card container.
 * Editorial style with minimal visual weight.
 */
export function CollapsibleSection({
  title,
  badge,
  children,
  defaultExpanded = false,
  variant = 'default',
  className = ''
}: CollapsibleSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  return (
    <div className={`border-b border-zinc-800 ${className}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full py-4 px-4 hover:bg-zinc-900/30 transition-colors"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 text-left">
            <h3 className={variant === 'default' ? 'text-title-lg font-semibold text-white' : 'text-title-md font-medium text-white'}>
              {title}
            </h3>
            {badge && (
              <span className="text-label-sm text-zinc-500 font-normal">
                {badge}
              </span>
            )}
          </div>
          <svg
            className={`w-5 h-5 text-zinc-400 transition-transform duration-200 ${
              expanded ? 'rotate-90' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-6">
          {children}
        </div>
      )}
    </div>
  )
}
