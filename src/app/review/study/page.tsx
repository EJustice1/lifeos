'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { MobileCard } from '@/components/mobile/cards/MobileCard'
import { PrimaryButton } from '@/components/mobile/buttons/PrimaryButton'
import { triggerHapticFeedback, HapticPatterns } from '@/lib/utils/haptic-feedback'
import { RatingWidget, type RatingOption } from '@/components/widgets'

const STUDY_FAILURE_TAGS = [
  'Brain Fog',
  'Social Distraction',
  'Phone',
  'Poor Planning',
  'Boredom',
]

const EFFORT_LEVELS: RatingOption[] = [
  { value: 1, label: 'Minimal', description: 'Passive consumption, no deep work', color: 'text-red-400' },
  { value: 2, label: 'Light', description: 'Some active engagement, easily distracted', color: 'text-orange-400' },
  { value: 3, label: 'Moderate', description: 'Focused work with occasional breaks', color: 'text-yellow-400' },
  { value: 4, label: 'High', description: 'Deep focus, minimal distractions', color: 'text-emerald-400', recommended: true },
  { value: 5, label: 'Maximum', description: 'Peak flow state, completely immersed', color: 'text-green-400' },
]

const FOCUS_LEVELS: RatingOption[] = [
  { value: 1, label: 'Scattered', description: 'Constant interruptions', color: 'text-red-400' },
  { value: 2, label: 'Fragmented', description: 'Frequent context switching', color: 'text-orange-400' },
  { value: 3, label: 'Decent', description: 'Maintained attention most of the time', color: 'text-yellow-400' },
  { value: 4, label: 'Sharp', description: 'Clear thinking, good comprehension', color: 'text-emerald-400', recommended: true },
  { value: 5, label: 'Crystal', description: 'Peak mental clarity, exceptional retention', color: 'text-green-400' },
]

// Fire icon for effort
const FireIcon = () => (
  <svg className="w-10 h-10 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
  </svg>
)

const FireFilledIcon = () => (
  <svg className="w-10 h-10 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" d="M12.963 2.286a.75.75 0 00-1.071-.136 9.742 9.742 0 00-3.539 6.177A7.547 7.547 0 016.648 6.61a.75.75 0 00-1.152-.082A9 9 0 1015.68 4.534a7.46 7.46 0 01-2.717-2.248zM15.75 14.25a3.75 3.75 0 11-7.313-1.172c.628.465 1.35.81 2.133 1a5.99 5.99 0 011.925-3.545 3.75 3.75 0 013.255 3.717z" clipRule="evenodd" />
  </svg>
)

// Brain icon for focus
const BrainIcon = () => (
  <svg className="w-10 h-10 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
)

const BrainFilledIcon = () => (
  <svg className="w-10 h-10 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" d="M12 2.25a.75.75 0 01.75.75v.756a49.106 49.106 0 019.152 1 .75.75 0 01-.152 1.485h-1.918l2.474 10.124a.75.75 0 01-.375.84A6.723 6.723 0 0118.75 18a6.723 6.723 0 01-3.181-.795.75.75 0 01-.375-.84l2.474-10.124H12.75v13.28c1.293.076 2.534.343 3.697.776a.75.75 0 01-.262 1.453h-8.37a.75.75 0 01-.262-1.453c1.162-.433 2.404-.7 3.697-.775V6.24H6.332l2.474 10.124a.75.75 0 01-.375.84A6.723 6.723 0 015.25 18a6.723 6.723 0 01-3.181-.795.75.75 0 01-.375-.84L4.168 6.241H2.25a.75.75 0 01-.152-1.485 49.105 49.105 0 019.152-1V3a.75.75 0 01.75-.75z" clipRule="evenodd" />
  </svg>
)

function StudyReviewContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('sessionId')

  // Default to recommended values (4 stars)
  const [effortRating, setEffortRating] = useState<number>(4)
  const [focusRating, setFocusRating] = useState<number>(4)
  const [notes, setNotes] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const showFailureTags = (effortRating > 0 && effortRating <= 2) || (focusRating > 0 && focusRating <= 2)
  const canSave = effortRating > 0 && focusRating > 0

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
        .from('study_sessions')
        .update({
          effort_rating: effortRating,
          focus_rating: focusRating,
          failure_tags: selectedTags,
          notes: notes.trim() || null,
        })
        .eq('id', sessionId)

      if (error) throw error

      triggerHapticFeedback(HapticPatterns.SUCCESS)
      router.push('/m/study')
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
          <PrimaryButton onClick={() => router.push('/m/study')}>
            Return to Study
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
          <h1 className="text-2xl font-bold text-white">Study Session Review</h1>
          <button
            onClick={() => router.push('/m/study')}
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
        {/* Effort Rating */}
        <RatingWidget
          title="Effort Level"
          titleColor="text-orange-400"
          numRatings={5}
          icon={<FireIcon />}
          iconFilled={<FireFilledIcon />}
          options={EFFORT_LEVELS}
          value={effortRating}
          onChange={setEffortRating}
          description="How much effort did you put into this session?"
        />

        {/* Focus Quality */}
        <RatingWidget
          title="Focus Quality"
          titleColor="text-blue-400"
          numRatings={5}
          icon={<BrainIcon />}
          iconFilled={<BrainFilledIcon />}
          options={FOCUS_LEVELS}
          value={focusRating}
          onChange={setFocusRating}
          description="How was your mental clarity and focus?"
        />

        {/* Notes */}
        <div>
          <label className="block text-lg font-bold text-white mb-2">
            Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional thoughts about this session..."
            rows={4}
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
          />
        </div>

        {/* Failure Tags (shown only if ratings are low) */}
        {showFailureTags && (
          <MobileCard title="What Went Wrong?">
            <p className="text-sm text-zinc-400 mb-4">Select any factors that impacted your session</p>
            <div className="flex flex-wrap gap-2">
              {STUDY_FAILURE_TAGS.map((tag) => (
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

export default function StudyReviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    }>
      <StudyReviewContent />
    </Suspense>
  )
}
