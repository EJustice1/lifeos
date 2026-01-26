import { ReactNode } from 'react'

interface ContentBlockProps {
  layout?: 'default' | 'split-left' | 'split-right' | 'stacked'
  primary: ReactNode
  secondary?: ReactNode
  spacing?: 'tight' | 'normal' | 'loose'
  className?: string
}

/**
 * ContentBlock - Asymmetric content layout
 *
 * Enables editorial-style layouts with flexible column proportions.
 * Stacks on mobile, asymmetric on desktop.
 *
 * Layouts:
 * - default: Single column, full width
 * - split-left: 40% / 60% (metadata left, content right)
 * - split-right: 60% / 40% (content left, metadata right)
 * - stacked: Full width with floating secondary
 */
export function ContentBlock({
  layout = 'default',
  primary,
  secondary,
  spacing = 'normal',
  className = ''
}: ContentBlockProps) {
  const spacingClasses = {
    tight: 'gap-4',
    normal: 'gap-8',
    loose: 'gap-12',
  }

  const layoutClasses = {
    default: '',
    'split-left': 'grid grid-cols-1 lg:grid-cols-[2fr_3fr]',
    'split-right': 'grid grid-cols-1 lg:grid-cols-[3fr_2fr]',
    stacked: 'relative',
  }

  if (layout === 'default') {
    return <div className={className}>{primary}</div>
  }

  if (layout === 'stacked') {
    return (
      <div className={`space-y-6 ${className}`}>
        <div>{primary}</div>
        {secondary && <div className="text-zinc-400">{secondary}</div>}
      </div>
    )
  }

  return (
    <div className={`${layoutClasses[layout]} ${spacingClasses[spacing]} ${className}`}>
      {layout === 'split-left' ? (
        <>
          {secondary && <div>{secondary}</div>}
          <div>{primary}</div>
        </>
      ) : (
        <>
          <div>{primary}</div>
          {secondary && <div>{secondary}</div>}
        </>
      )}
    </div>
  )
}
