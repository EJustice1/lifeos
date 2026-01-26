'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { MobileCard } from '@/components/mobile/cards/MobileCard'
import { PrimaryButton } from '@/components/mobile/buttons/PrimaryButton'
import { triggerHapticFeedback, HapticPatterns } from '@/lib/utils/haptic-feedback'
import { RatingWidget, type RatingOption } from '@/components/widgets'

const GYM_FAILURE_TAGS = [
  'Low Energy',
  'Bad Sleep',
  'Injury/Pain',
  'Short on Time',
]

const INTENSITY_LEVELS: RatingOption[] = [
  { value: 1, label: 'Very Light', description: 'Barely challenging', color: 'text-red-400' },
  { value: 2, label: 'Light', description: 'Could do much more', color: 'text-orange-400' },
  { value: 3, label: 'Moderate', description: 'Challenging but manageable', color: 'text-yellow-400' },
  { value: 4, label: 'Hard', description: 'Near limit, difficult to complete', color: 'text-emerald-400', recommended: true },
  { value: 5, label: 'Maximum', description: 'All-out effort, at absolute limit', color: 'text-green-400' },
]

const FEELING_LEVELS: RatingOption[] = [
  { value: 1, label: 'Terrible', description: 'Felt awful, no energy', color: 'text-red-400' },
  { value: 2, label: 'Poor', description: 'Low energy, struggled through', color: 'text-orange-400' },
  { value: 3, label: 'Okay', description: 'Average, nothing special', color: 'text-yellow-400' },
  { value: 4, label: 'Good', description: 'Felt strong, energized', color: 'text-emerald-400', recommended: true },
  { value: 5, label: 'Excellent', description: 'Peak condition, felt amazing', color: 'text-green-400' },
]

// Dumbbell icon for intensity
const DumbbellIcon = () => (
  <svg className="w-10 h-10 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10V3a1 1 0 011-1h1a1 1 0 011 1v7M8 10V3a1 1 0 00-1-1H6a1 1 0 00-1 1v7M8 14v7a1 1 0 001 1h1a1 1 0 001-1v-7M14 14v7a1 1 0 01-1 1h-1a1 1 0 01-1-1v-7M8 10h8M8 14h8" />
  </svg>
)

const DumbbellFilledIcon = () => (
  <svg className="w-10 h-10 text-red-500" fill="currentColor" viewBox="0 0 24 24">
    <path d="M14 10V3a1 1 0 011-1h1a1 1 0 011 1v7M8 10V3a1 1 0 00-1-1H6a1 1 0 00-1 1v7M8 14v7a1 1 0 001 1h1a1 1 0 001-1v-7M14 14v7a1 1 0 01-1 1h-1a1 1 0 01-1-1v-7M8 10h8M8 14h8" />
  </svg>
)

// Heart icon for feeling
const HeartIcon = () => (
  <svg className="w-10 h-10 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
)

const HeartFilledIcon = () => (
  <svg className="w-10 h-10 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
    <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
  </svg>
)

function GymReviewContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('sessionId')

  // Default to recommended values (4 stars)
  const [intensityRating, setIntensityRating] = useState<number>(4)
  const [feelingRating, setFeelingRating] = useState<number>(4)
  const [notes, setNotes] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const showFailureTags = (intensityRating > 0 && intensityRating <= 2) || (feelingRating > 0 && feelingRating <= 2)
  const canSave = intensityRating > 0 && feelingRating > 0

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const handleSave = async () => {
    if (!canSave || !sessionId) return

    try {
      setSaving(true)
      triggerHapticFeedback(HapticPatterns.MEDIUM)

      const supabase = createClient()
      const { error } = await supabase
        .from('workouts')
        .update({
          effort_rating: intensityRating,
          feeling_rating: feelingRating,
          failure_tags: selectedTags,
          notes: notes.trim() || null,
        })
        .eq('id', sessionId)

      if (error) throw error

      triggerHapticFeedback(HapticPatterns.SUCCESS)
      router.push('/m/gym')
    } catch (error) {
      console.error('Failed to save feedback:', error)
      triggerHapticFeedback(HapticPatterns.FAILURE)
      alert('Failed to save review. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-400 mb-4">No session ID provided</p>
          <PrimaryButton onClick={() => router.push('/m/gym')}>
            Return to Gym
          </PrimaryButton>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 pb-24">
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-2xl font-bold text-white">Workout Review</h1>
          <button
            onClick={() => router.push('/m/gym')}
            className="p-2 text-zinc-400 hover:text-white"
            aria-label="Back"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-8">
        {/* Intensity Rating (RPE) */}
        <RatingWidget
          title="Intensity (RPE)"
          titleColor="text-red-400"
          numRatings={5}
          icon={<DumbbellIcon />}
          iconFilled={<DumbbellFilledIcon />}
          options={INTENSITY_LEVELS}
          value={intensityRating}
          onChange={setIntensityRating}
          description="How hard was this workout?"
        />

        {/* Feeling Rating */}
        <RatingWidget
          title="How You Felt"
          titleColor="text-emerald-400"
          numRatings={5}
          icon={<HeartIcon />}
          iconFilled={<HeartFilledIcon />}
          options={FEELING_LEVELS}
          value={feelingRating}
          onChange={setFeelingRating}
          description="How did you feel during the workout?"
        />

        {/* Notes */}
        <div>
          <label className="block text-lg font-bold text-white mb-2">
            Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional thoughts about this workout..."
            rows={4}
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
          />
        </div>

        {/* Failure Tags (shown only if ratings are low) */}
        {showFailureTags && (
          <MobileCard title="What Went Wrong?">
            <p className="text-sm text-zinc-400 mb-4">Select any factors that impacted your workout</p>
            <div className="flex flex-wrap gap-2">
              {GYM_FAILURE_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-red-500 text-white'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </MobileCard>
        )}
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 p-4">
        <PrimaryButton
          variant="primary"
          size="lg"
          onClick={handleSave}
          disabled={!canSave || saving}
          className="w-full"
        >
          {saving ? 'Saving...' : 'Complete Review'}
        </PrimaryButton>
      </div>
    </div>
  )
}

export default function GymReviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    }>
      <GymReviewContent />
    </Suspense>
  )
}
