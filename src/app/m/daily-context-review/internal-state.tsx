'use client'

import { useDailyReview } from './DailyReviewContext'
import { MobileCard } from '@/components/mobile/cards/MobileCard'

export default function InternalStateStep() {
  const { formData, setFormData } = useDailyReview()

  const UNFOCUSED_TAGS = [
    'Poor Sleep',
    'Phone Distraction',
    'Social Anxiety',
    'Unexpected Errands',
    'Brain Fog',
    'Lack of Planning',
    'Low Motivation',
    'External Stress',
  ]

  const toggleUnfocusedTag = (tag: string) => {
    setFormData({
      unfocusedFactors: formData.unfocusedFactors.includes(tag)
        ? formData.unfocusedFactors.filter(t => t !== tag)
        : [...formData.unfocusedFactors, tag],
    })
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-center mb-6">Internal State</h1>

      <MobileCard title="Unfocused Factors">
        <p className="text-zinc-400 text-sm mb-4">
          What caused you to lose focus today?
        </p>
        <div className="flex flex-wrap gap-2">
          {UNFOCUSED_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleUnfocusedTag(tag)}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                formData.unfocusedFactors.includes(tag)
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-800 hover:bg-zinc-700'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </MobileCard>

    </div>
  )
}