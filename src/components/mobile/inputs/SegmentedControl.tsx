'use client'

import { triggerHapticFeedback, HapticPatterns } from '@/lib/utils/haptic-feedback'

interface SegmentedControlOption {
  id: string
  label: string
}

interface SegmentedControlProps {
  options: SegmentedControlOption[]
  value: string
  onChange: (value: string) => void
  className?: string
}

export function SegmentedControl({ options, value, onChange, className = '' }: SegmentedControlProps) {
  const handleChange = (newValue: string) => {
    if (newValue !== value) {
      triggerHapticFeedback(HapticPatterns.LIGHT)
      onChange(newValue)
    }
  }

  return (
    <div className={`inline-flex bg-zinc-800 rounded-lg p-1 ${className}`}>
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => handleChange(option.id)}
          className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 min-w-[100px] ${
            value === option.id
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
