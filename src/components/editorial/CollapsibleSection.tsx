'use client'

import { ReactNode, useState } from 'react'

type ColorVariant = 'default' | 'health' | 'career' | 'personal' | 'finance' | 'relationships' | 'today' | 'backlog' | 'completed'

interface CollapsibleSectionProps {
  title: string
  badge?: string | number
  children: ReactNode
  defaultExpanded?: boolean
  variant?: 'default' | 'minimal'
  colorVariant?: ColorVariant
  gradient?: boolean
  className?: string
}

/**
 * CollapsibleSection - Expandable content section with gradient headers
 *
 * Replaces collapsible card components (LifeGoalCard, ProjectCard).
 * Supports gradient colored headers for visual impact.
 * Bold typography for prominence.
 */
export function CollapsibleSection({
  title,
  badge,
  children,
  defaultExpanded = false,
  variant = 'default',
  colorVariant = 'default',
  gradient = false,
  className = ''
}: CollapsibleSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  // Colored background mappings (no gradients)
  const colorClasses = {
    health: 'bg-emerald-500/15 border-b-2 border-emerald-500/40',
    career: 'bg-blue-500/15 border-b-2 border-blue-500/40',
    personal: 'bg-purple-500/15 border-b-2 border-purple-500/40',
    finance: 'bg-amber-500/15 border-b-2 border-amber-500/40',
    relationships: 'bg-pink-500/15 border-b-2 border-pink-500/40',
    today: 'bg-blue-500/15 border-b-2 border-blue-500/40',
    backlog: 'bg-purple-500/15 border-b-2 border-purple-500/40',
    completed: 'bg-emerald-500/15 border-b-2 border-emerald-500/40',
    default: 'bg-zinc-900 border-b border-zinc-800',
  }

  // Badge color mappings
  const badgeClasses = {
    health: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40',
    career: 'bg-blue-500/20 text-blue-400 border border-blue-500/40',
    personal: 'bg-purple-500/20 text-purple-400 border border-purple-500/40',
    finance: 'bg-amber-500/20 text-amber-400 border border-amber-500/40',
    relationships: 'bg-pink-500/20 text-pink-400 border border-pink-500/40',
    today: 'bg-blue-500/20 text-blue-400 border border-blue-500/40',
    backlog: 'bg-purple-500/20 text-purple-400 border border-purple-500/40',
    completed: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40',
    default: 'bg-zinc-800 text-zinc-400',
  }

  const useColor = gradient || colorVariant !== 'default'
  const colorClass = useColor ? colorClasses[colorVariant] : ''
  const hoverClass = useColor ? 'hover:opacity-80' : 'hover:bg-zinc-900/30'
  const textClass = 'text-white'
  const roundedClass = ''

  return (
    <div className={`${useColor ? 'rounded-2xl overflow-hidden' : 'border-b border-zinc-800'} ${className}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full py-4 px-6 transition-all ${colorClass} ${hoverClass} ${roundedClass}`}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 text-left">
            <h3 className={`${variant === 'default' ? 'text-title-lg font-semibold' : 'text-title-lg font-semibold'} ${textClass}`}>
              {title}
            </h3>
            {badge && (
              <span className={`${badgeClasses[colorVariant]} px-2 py-1 rounded-lg font-semibold text-label-sm`}>
                {badge}
              </span>
            )}
          </div>
          <svg
            className={`w-5 h-5 ${textClass} transition-transform duration-200 ${
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
        <div className={`px-4 pb-6 ${useColor ? 'pt-4' : ''}`}>
          {children}
        </div>
      )}
    </div>
  )
}
