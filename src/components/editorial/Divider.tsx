interface DividerProps {
  spacing?: 'compact' | 'normal' | 'spacious'
  label?: string
  variant?: 'subtle' | 'default' | 'strong'
  className?: string
}

/**
 * Divider - Semantic section break
 *
 * Replaces spacing between cards with intentional separation.
 * Optional label for section headings.
 */
export function Divider({
  spacing = 'normal',
  label,
  variant = 'default',
  className = ''
}: DividerProps) {
  const spacingClasses = {
    compact: 'my-4',
    normal: 'my-8',
    spacious: 'my-12',
  }

  const variantClasses = {
    subtle: 'border-zinc-800/50',
    default: 'border-zinc-800',
    strong: 'border-zinc-700',
  }

  if (label) {
    return (
      <div className={`flex items-center ${spacingClasses[spacing]} ${className}`}>
        <div className={`flex-1 border-t ${variantClasses[variant]}`}></div>
        <span className="px-4 text-label-sm uppercase tracking-wider text-zinc-500 font-semibold">
          {label}
        </span>
        <div className={`flex-1 border-t ${variantClasses[variant]}`}></div>
      </div>
    )
  }

  return (
    <hr
      className={`border-t ${variantClasses[variant]} ${spacingClasses[spacing]} ${className}`}
    />
  )
}
