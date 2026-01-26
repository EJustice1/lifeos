'use client'

import { useState } from 'react'
import { useDailyReview } from './DailyReviewContext'

export default function ScreentimeStep() {
  const { formData, setFormData } = useDailyReview()
  const [hours, setHours] = useState(Math.floor((formData.screenTimeMinutes || 0) / 60))
  const [minutes, setMinutes] = useState((formData.screenTimeMinutes || 0) % 60)

  const handleHoursChange = (value: string) => {
    const h = parseInt(value) || 0
    setHours(h)
    setFormData({ screenTimeMinutes: h * 60 + minutes })
  }

  const handleMinutesChange = (value: string) => {
    const m = parseInt(value) || 0
    setMinutes(m)
    setFormData({ screenTimeMinutes: hours * 60 + m })
  }

  const totalMinutes = hours * 60 + minutes
  const screenTimeStatus = 
    totalMinutes === 0 ? { color: 'text-zinc-400', label: 'No screentime recorded' } :
    totalMinutes < 120 ? { color: 'text-emerald-400', label: 'Minimal screentime' } :
    totalMinutes < 240 ? { color: 'text-yellow-400', label: 'Moderate screentime' } :
    totalMinutes < 360 ? { color: 'text-orange-400', label: 'High screentime' } :
    { color: 'text-red-400', label: 'Very high screentime' }

  return (
    <div className="space-y-6">
      <h1 className="text-headline-md font-bold text-center mb-6">Screentime</h1>

      {/* Screentime Input */}
      <div>
        <h3 className="text-title-lg font-semibold mb-4 text-white">Total Screentime Today</h3>
        <p className="text-body-sm text-zinc-400 mb-4">
          How much time did you spend on screens today?
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-body-sm font-medium text-zinc-300 mb-2">
              Hours
            </label>
            <input
              type="number"
              min="0"
              max="24"
              value={hours}
              onChange={(e) => handleHoursChange(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-center text-headline-md font-mono focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-body-sm font-medium text-zinc-300 mb-2">
              Minutes
            </label>
            <input
              type="number"
              min="0"
              max="59"
              value={minutes}
              onChange={(e) => handleMinutesChange(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-center text-headline-md font-mono focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>

        {/* Status Indicator */}
        {totalMinutes > 0 && (
          <div className="mt-4 p-3 bg-zinc-800 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Total:</span>
              <span className={`text-title-md font-semibold ${screenTimeStatus.color}`}>
                {hours}h {minutes}m
              </span>
            </div>
            <p className={`text-body-sm mt-1 ${screenTimeStatus.color}`}>
              {screenTimeStatus.label}
            </p>
          </div>
        )}
      </div>

      {/* Quick Presets */}
      <div>
        <h3 className="text-title-lg font-semibold mb-4 text-white">Quick Presets</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: '1 hour', minutes: 60 },
            { label: '2 hours', minutes: 120 },
            { label: '3 hours', minutes: 180 },
            { label: '4 hours', minutes: 240 },
            { label: '6 hours', minutes: 360 },
            { label: '8 hours', minutes: 480 },
          ].map((preset) => (
            <button
              key={preset.minutes}
              onClick={() => {
                const h = Math.floor(preset.minutes / 60)
                const m = preset.minutes % 60
                setHours(h)
                setMinutes(m)
                setFormData({ screenTimeMinutes: preset.minutes })
              }}
              className={`py-2 px-4 rounded-lg font-medium transition-colors ${
                totalMinutes === preset.minutes
                  ? 'bg-emerald-600 text-white'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
