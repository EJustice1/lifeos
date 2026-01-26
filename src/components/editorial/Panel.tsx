import { ReactNode } from 'react'

interface PanelProps {
  children: ReactNode
  variant?: 'default' | 'elevated' | 'bordered'
  accent?: 'left' | 'top' | 'none'
  accentColor?: string
  className?: string
}

/**
 * Panel - Structured content block
 *
 * Replaces card components with a lighter-weight alternative.
 * Optional left/top accent border for hierarchy.
 * Subtle background only for elevated variant.
 */
export function Panel({
  children,
  variant = 'default',
  accent = 'none',
  accentColor,
  className = ''
}: PanelProps) {
  const variantClasses = {
    default: '',
    elevated: 'bg-zinc-900/50',
    bordered: 'border border-zinc-800'
  }

  const accentClasses = {
    left: 'border-l-[3px]',
    top: 'border-t-[3px]',
    none: ''
  }

  const accentStyle = accentColor
    ? { [`border${accent === 'left' ? 'Left' : accent === 'top' ? 'Top' : ''}Color`]: accentColor }
    : {}

  return (
    <div
      className={`${variantClasses[variant]} ${accentClasses[accent]} ${className}`}
      style={accentStyle}
    >
      {children}
    </div>
  )
}
