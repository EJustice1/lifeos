'use client'

export interface RatingOption {
  value: number
  label: string
  description: string
  color: string
  recommended?: boolean
}

export interface RatingWidgetProps {
  title: string
  titleColor?: string
  numRatings: number
  icon: React.ReactNode
  iconFilled: React.ReactNode
  options: RatingOption[]
  value: number
  onChange: (value: number) => void
  description?: string
}

export function RatingWidget({
  title,
  titleColor = 'text-white',
  numRatings,
  icon,
  iconFilled,
  options,
  value,
  onChange,
  description
}: RatingWidgetProps) {
  const selectedOption = options.find(o => o.value === value) || options.find(o => o.recommended) || options[0]
  
  return (
    <div className="space-y-4">
      {/* Main title above everything */}
      <div className="text-left">
        <h3 className={`text-title-lg font-bold ${titleColor} mb-1`}>
          {title}
        </h3>
        {description && (
          <p className="text-body-sm text-zinc-500">
            {description}
          </p>
        )}
      </div>

      {/* Selected option label above rating (left aligned) */}
      {selectedOption && (
        <div className="text-left">
          <div className={`text-headline-md font-bold ${selectedOption.color}`}>
            {selectedOption.label}
          </div>
        </div>
      )}
      
      {/* Icon list (horizontally centered) */}
      <div className="flex justify-center gap-3">
        {Array.from({ length: numRatings }).map((_, i) => {
          const rating = i + 1
          const isSelected = rating <= value
          
          return (
            <button
              key={i}
              onClick={() => onChange(rating)}
              className="transition-transform hover:scale-110 active:scale-95"
              type="button"
            >
              {isSelected ? iconFilled : icon}
            </button>
          )
        })}
      </div>
      
      {/* Description below rating (left aligned) */}
      {selectedOption && (
        <div className="text-left">
          <p className="text-body-sm text-zinc-400">
            {selectedOption.description}
          </p>
        </div>
      )}
    </div>
  )
}
