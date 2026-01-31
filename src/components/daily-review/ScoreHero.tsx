'use client'

import { findExecutionLevel } from '@/lib/execution-validator'

interface ScoreHeroProps {
  score: number
  date: string
}

export function ScoreHero({ score, date }: ScoreHeroProps) {
  const level = findExecutionLevel(score)
  
  // Get gradient colors based on level
  const getGradientColors = () => {
    if (score >= 86) return 'from-purple-600 to-purple-800' // Apex
    if (score >= 71) return 'from-emerald-600 to-emerald-800' // Velocity
    if (score >= 56) return 'from-green-600 to-green-800' // Traction
    if (score >= 46) return 'from-yellow-600 to-yellow-800' // Maintenance
    if (score >= 31) return 'from-orange-600 to-orange-800' // Unfocused
    if (score >= 16) return 'from-red-500 to-red-700' // Decay
    return 'from-red-700 to-red-900' // Sabotage
  }

  return (
    <div className={`relative rounded-xl p-3 bg-gradient-to-br ${getGradientColors()} overflow-hidden`}>
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex items-center justify-between gap-3">
        {/* Score */}
        <div className="flex items-end gap-2">
          <div className="text-[48px] leading-none font-bold text-white">
            {score}
          </div>
          <div className="pb-1">
            <div className="text-white/60 text-label-xs">Score</div>
          </div>
        </div>

        {/* Level Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
          <span className="text-lg">{level.emoji}</span>
          <div>
            <div className="text-white font-semibold text-body-sm">{level.label}</div>
            <div className="text-white/70 text-label-xs">{level.description}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
