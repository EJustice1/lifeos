'use client'

import { useDailyReview } from './DailyReviewContext'
import { MobileCard } from '@/components/mobile/cards/MobileCard'
import { PrimaryButton } from '@/components/mobile/buttons/PrimaryButton'

export default function InternalState({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
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

      <MobileCard title="Physical Vitality">
        <p className="text-zinc-400 text-sm mb-4">
          Rate your physical energy levels (1-5)
        </p>
        <div className="grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5].map((level) => (
            <button
              key={level}
              onClick={() => setFormData({ physicalVitality: level })}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                level === formData.physicalVitality
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-800 hover:bg-zinc-700'
              }`}
            >
              {level === 1 && 'Exhausted'}
              {level === 2 && 'Low'}
              {level === 3 && 'Neutral'}
              {level === 4 && 'Good'}
              {level === 5 && 'Peak'}
            </button>
          ))}
        </div>
      </MobileCard>

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

      <div className="flex space-x-4 mt-8">
        <PrimaryButton
          variant="secondary"
          size="lg"
          onClick={onBack}
          className="flex-1"
        >
          Back
        </PrimaryButton>
        <PrimaryButton
          variant="primary"
          size="lg"
          onClick={onNext}
          className="flex-1"
        >
          Continue to Knowledge Base
        </PrimaryButton>
      </div>
    </div>
  )
}