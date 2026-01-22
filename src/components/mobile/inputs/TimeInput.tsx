'use client'

interface TimeInputProps {
  label: string
  value: number // Minutes
  onChange: (minutes: number) => void
  min?: number
  max?: number
  step?: number
}

export function TimeInput({
  label,
  value,
  onChange,
  min = 0,
  max = 1440,
  step = 15,
}: TimeInputProps) {
  const hours = Math.floor(value / 60)
  const minutes = value % 60

  const formatTime = (mins: number): string => {
    const h = Math.floor(mins / 60)
    const m = mins % 60
    if (h === 0) return `${m}m`
    if (m === 0) return `${h}h`
    return `${h}h ${m}m`
  }

  const handleIncrement = () => {
    const newValue = Math.min(max, value + step)
    onChange(newValue)
  }

  const handleDecrement = () => {
    const newValue = Math.max(min, value - step)
    onChange(newValue)
  }

  const handleHourChange = (newHours: number) => {
    const totalMinutes = Math.max(min, Math.min(max, newHours * 60 + minutes))
    onChange(totalMinutes)
  }

  const handleMinuteChange = (newMinutes: number) => {
    const totalMinutes = Math.max(min, Math.min(max, hours * 60 + newMinutes))
    onChange(totalMinutes)
  }

  return (
    <div className="space-y-2">
      {/* Label */}
      <div className="flex items-center justify-between">
        <label className="text-sm text-zinc-300">{label}</label>
        <span className="text-sm font-semibold text-purple-400">{formatTime(value)}</span>
      </div>

      {/* Time Picker */}
      <div className="flex items-center gap-2">
        {/* Decrement Button */}
        <button
          onClick={handleDecrement}
          disabled={value <= min}
          className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700 hover:border-purple-500 disabled:opacity-30 disabled:hover:border-zinc-700 transition-colors flex items-center justify-center text-lg font-bold"
          aria-label={`Decrease ${label} by ${step} minutes`}
        >
          −
        </button>

        {/* Hours Input */}
        <div className="flex-1 flex items-center gap-1">
          <input
            type="number"
            value={hours}
            onChange={(e) => handleHourChange(parseInt(e.target.value) || 0)}
            className="w-full h-10 px-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-center focus:outline-none focus:border-purple-500 transition-colors"
            min="0"
            max={Math.floor(max / 60)}
            aria-label={`${label} hours`}
          />
          <span className="text-xs text-zinc-500">h</span>
        </div>

        {/* Minutes Input */}
        <div className="flex-1 flex items-center gap-1">
          <input
            type="number"
            value={minutes}
            onChange={(e) => handleMinuteChange(parseInt(e.target.value) || 0)}
            className="w-full h-10 px-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-center focus:outline-none focus:border-purple-500 transition-colors"
            min="0"
            max="59"
            step={step}
            aria-label={`${label} minutes`}
          />
          <span className="text-xs text-zinc-500">m</span>
        </div>

        {/* Increment Button */}
        <button
          onClick={handleIncrement}
          disabled={value >= max}
          className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700 hover:border-purple-500 disabled:opacity-30 disabled:hover:border-zinc-700 transition-colors flex items-center justify-center text-lg font-bold"
          aria-label={`Increase ${label} by ${step} minutes`}
        >
          +
        </button>
      </div>
    </div>
  )
}
