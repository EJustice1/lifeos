import { ReactNode } from 'react'

interface PanelProps {
  children: ReactNode
  variant?: 'default' | 'elevated' | 'bordered' |
            'health' | 'career' | 'personal' | 'finance' | 'relationships' |
            'today' | 'completed' | 'backlog' | 'in-progress'
  gradient?: boolean
  accent?: 'left' | 'top' | 'none'
  accentColor?: string
  className?: string
}

/**
 * Panel - Structured content block with prominent color support
 *
 * Replaces card components with colored background variants.
 * Supports life area colors (health, career, etc.) and status colors.
 * Optional gradient backgrounds for headers.
 */
export function Panel({
  children,
  variant = 'default',
  gradient = false,
  accent = 'none',
  accentColor,
  className = ''
}: PanelProps) {
  // Colored background variants (prominent)
  const coloredVariantClasses = {
    health: 'bg-emerald-500/15 border-2 border-emerald-500/30',
    career: 'bg-blue-500/15 border-2 border-blue-500/30',
    personal: 'bg-purple-500/15 border-2 border-purple-500/30',
    finance: 'bg-amber-500/15 border-2 border-amber-500/30',
    relationships: 'bg-pink-500/15 border-2 border-pink-500/30',
    today: 'bg-blue-500/20 border-2 border-blue-500/40',
    completed: 'bg-emerald-500/20 border-2 border-emerald-500/40',
    backlog: 'bg-purple-500/20 border-2 border-purple-500/40',
    'in-progress': 'bg-amber-500/20 border-2 border-amber-500/40',
  }

  // Default variants
  const defaultVariantClasses = {
    default: '',
    elevated: 'bg-zinc-900/50',
    bordered: 'border border-zinc-800'
  }

  // Get the appropriate variant class
  const variantClass = coloredVariantClasses[variant as keyof typeof coloredVariantClasses] ||
                       defaultVariantClasses[variant as keyof typeof defaultVariantClasses] ||
                       ''

  const accentClasses = {
    left: 'border-l-[3px]',
    top: 'border-t-[3px]',
    none: ''
  }

  const accentStyle = accentColor
    ? { [`border${accent === 'left' ? 'Left' : accent === 'top' ? 'Top' : ''}Color`]: accentColor }
    : {}

  // Add rounded corners for colored panels
  const roundedClass = coloredVariantClasses[variant as keyof typeof coloredVariantClasses] ? 'rounded-2xl' : ''

  return (
    <div
      className={`${variantClass} ${accentClasses[accent]} ${roundedClass} ${className}`}
      style={accentStyle}
    >
      {children}
    </div>
  )
}
