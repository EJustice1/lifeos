import { ReactNode } from 'react'

interface SectionProps {
  children: ReactNode
  spacing?: 'compact' | 'normal' | 'spacious'
  className?: string
}

/**
 * Section - Top-level content container
 *
 * No background, relies on spacing and typography hierarchy.
 * Use for major page sections.
 */
export function Section({
  children,
  spacing = 'normal',
  className = ''
}: SectionProps) {
  const spacingClasses = {
    compact: 'space-y-4',
    normal: 'space-y-8',
    spacious: 'space-y-16',
  }

  return (
    <section className={`${spacingClasses[spacing]} ${className}`}>
      {children}
    </section>
  )
}
