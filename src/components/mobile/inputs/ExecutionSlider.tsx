'use client'

import { ExecutionLevel } from '@/lib/execution-validator'

interface ExecutionSliderProps {
  value: number
  levels: ExecutionLevel[]
  maxValue: number // From validation
  onChange: (value: number) => void
  onAttemptLocked: () => void
  isOverrideEnabled?: boolean // Allow selecting beyond maxValue
}

export function ExecutionSlider({
  value,
  levels,
  maxValue,
  onChange,
  onAttemptLocked,
  isOverrideEnabled = false,
}: ExecutionSliderProps) {
  // Get current level index
  const currentIndex = levels.findIndex((l) => l.value === value)

  const handleLevelClick = (level: ExecutionLevel) => {
    if (level.value > maxValue && !isOverrideEnabled) {
      onAttemptLocked()
      return
    }
    onChange(level.value)
  }

  return (
    <div className="space-y-4">
      {/* Slider Container */}
      <div className="relative h-20 w-full">
        {/* Gradient Track */}
        <div className="absolute top-8 w-full h-3 bg-gradient-to-r from-red-600 via-yellow-500 via-green-400 to-purple-500 rounded-full" />

        {/* Clickable Snap Point Indicators */}
        {levels.map((level, i) => (
          <button
            key={level.value}
            onClick={() => handleLevelClick(level)}
            className="absolute top-7 z-10"
            style={{ left: `${(i / (levels.length - 1)) * 100}%`, transform: 'translateX(-50%)' }}
            disabled={level.value > maxValue && !isOverrideEnabled}
          >
            <div
              className={`w-5 h-5 rounded-full border-2 transition-all cursor-pointer ${
                level.value > maxValue && !isOverrideEnabled
                  ? 'bg-red-500/20 border-red-500 cursor-not-allowed'
                  : i === currentIndex
                    ? 'bg-white border-white scale-110 shadow-lg'
                    : 'bg-zinc-800 border-zinc-600 hover:scale-105 hover:bg-zinc-700'
              }`}
            />
          </button>
        ))}
      </div>

      {/* Level Labels */}
      <div className="flex justify-between items-start px-1">
        {levels.map((level, i) => (
          <button
            key={level.value}
            onClick={() => handleLevelClick(level)}
            disabled={level.value > maxValue && !isOverrideEnabled}
            className={`flex flex-col items-center gap-1 transition-all ${
              i === currentIndex ? 'scale-110' : 'opacity-40 scale-90'
            } ${level.value > maxValue && !isOverrideEnabled ? 'opacity-20 cursor-not-allowed' : 'hover:opacity-100 cursor-pointer'}`}
          >
            <div className="text-xl">{level.emoji}</div>
            <div
              className={`text-[10px] font-medium ${
                i === currentIndex ? level.color : 'text-zinc-500'
              }`}
            >
              {level.label}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
