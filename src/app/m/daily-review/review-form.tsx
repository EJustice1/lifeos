'use client'

import { useState, useTransition } from 'react'
import { submitDailyReview } from '@/lib/actions/daily-review'
import { MobileCard } from '@/components/mobile/cards/MobileCard'
import { PrimaryButton } from '@/components/mobile/buttons/PrimaryButton'
import { MobileSlider } from '@/components/mobile/inputs/MobileSlider'
import { useToast } from '@/components/mobile/feedback/ToastProvider'

const AVAILABLE_TAGS = ['Tired', 'Motivated', 'Social', 'Focused', 'Stressed', 'Creative', 'Anxious', 'Calm']

interface Review {
  mood: number
  energy: number
  perceived_success: number
  wins: string | null
  improvements: string | null
  tags: string[]
}

export function ReviewForm({ existingReview }: { existingReview: Review | null }) {
  const [isPending, startTransition] = useTransition()
  const [mood, setMood] = useState(existingReview?.mood ?? 7)
  const [energy, setEnergy] = useState(existingReview?.energy ?? 6)
  const [success, setSuccess] = useState(existingReview?.perceived_success ?? 7)
  const [wins, setWins] = useState(existingReview?.wins ?? '')
  const [improvements, setImprovements] = useState(existingReview?.improvements ?? '')
  const [tags, setTags] = useState<string[]>(existingReview?.tags ?? [])
  const [submitted, setSubmitted] = useState(false)

  function toggleTag(tag: string) {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const { showToast } = useToast()

  async function handleSubmit() {
    startTransition(async () => {
      try {
        await submitDailyReview(
          mood,
          energy,
          success,
          wins || undefined,
          improvements || undefined,
          tags
        )
        showToast('Review saved successfully!', 'success')
      } catch (error) {
        showToast('Failed to save review', 'error')
      }
    })
  }

  return (
    <div className="space-y-4">
      <MobileCard title="Mood">
        <MobileSlider
          label="Mood"
          min={1}
          max={10}
          value={mood}
          onChange={setMood}
          showValue
        />
        <div className="flex justify-between text-xs text-zinc-500 mt-1">
          <span>Low</span>
          <span>High</span>
        </div>
      </MobileCard>

      <MobileCard title="Energy">
        <MobileSlider
          label="Energy"
          min={1}
          max={10}
          value={energy}
          onChange={setEnergy}
          showValue
        />
        <div className="flex justify-between text-xs text-zinc-500 mt-1">
          <span>Drained</span>
          <span>Energized</span>
        </div>
      </MobileCard>

      <MobileCard title="Perceived Success">
        <MobileSlider
          label="Perceived Success"
          min={1}
          max={10}
          value={success}
          onChange={setSuccess}
          showValue
        />
        <div className="flex justify-between text-xs text-zinc-500 mt-1">
          <span>Unproductive</span>
          <span>Crushed it</span>
        </div>
      </MobileCard>

      <MobileCard title="Tags">
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                tags.includes(tag)
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-800 hover:bg-zinc-700'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </MobileCard>

      <MobileCard title="Wins">
        <textarea
          value={wins}
          onChange={(e) => setWins(e.target.value)}
          placeholder="What went well today?"
          rows={2}
          className="w-full bg-zinc-800 rounded-lg p-3 resize-none"
        />
      </MobileCard>

      <MobileCard title="Improvements">
        <textarea
          value={improvements}
          onChange={(e) => setImprovements(e.target.value)}
          placeholder="What could be better?"
          rows={2}
          className="w-full bg-zinc-800 rounded-lg p-3 resize-none"
        />
      </MobileCard>

      <PrimaryButton
        variant="primary"
        size="lg"
        onClick={handleSubmit}
        disabled={isPending}
        loading={isPending}
      >
        {isPending ? 'Saving...' : existingReview ? 'Update Review' : 'Complete Review'}
      </PrimaryButton>
    </div>
  )
}
