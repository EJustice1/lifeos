'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PrimaryButton } from '@/components/mobile/buttons/PrimaryButton'
import { triggerHapticFeedback, HapticPatterns } from '@/lib/utils/haptic-feedback'
import { RatingWidget } from '@/components/widgets'
import type { SessionReviewConfig } from '@/lib/config/review-configs'

interface SessionReviewFormProps {
  config: SessionReviewConfig
}

function SessionReviewContent({ config }: SessionReviewFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('sessionId')

  // Default to recommended values (4 stars)
  const [rating1, setRating1] = useState<number>(4)
  const [rating2, setRating2] = useState<number>(4)
  const [notes, setNotes] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const showFailureTags = (rating1 > 0 && rating1 <= 2) || (rating2 > 0 && rating2 <= 2)
  const canSave = rating1 > 0 && rating2 > 0

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
        .from(config.tableName)
        .update({
          [config.field1Name]: rating1,
          [config.field2Name]: rating2,
          failure_tags: selectedTags,
          notes: notes.trim() || null,
        })
        .eq('id', sessionId)

      if (error) throw error

      triggerHapticFeedback(HapticPatterns.SUCCESS)
      router.push(config.returnPath)
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
          <PrimaryButton onClick={() => router.push(config.returnPath)}>
            Return
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
          <h1 className="text-headline-md font-bold text-white">{config.pageTitle}</h1>
          <button
            onClick={() => router.push(config.returnPath)}
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
        {/* First Rating */}
        <RatingWidget
          title={config.rating1Title}
          titleColor={config.rating1Color}
          numRatings={5}
          icon={config.rating1Icon}
          iconFilled={config.rating1IconFilled}
          options={config.rating1Options}
          value={rating1}
          onChange={setRating1}
          description={config.rating1Description}
        />

        {/* Second Rating */}
        <RatingWidget
          title={config.rating2Title}
          titleColor={config.rating2Color}
          numRatings={5}
          icon={config.rating2Icon}
          iconFilled={config.rating2IconFilled}
          options={config.rating2Options}
          value={rating2}
          onChange={setRating2}
          description={config.rating2Description}
        />

        {/* Notes */}
        <div>
          <label className="block text-title-md font-bold text-white mb-2">
            Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={config.notesPlaceholder}
            rows={4}
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
          />
        </div>

        {/* Failure Tags (shown only if ratings are low) */}
        {showFailureTags && (
          <div>
            <h3 className="text-title-lg font-semibold mb-4 text-white">What Went Wrong?</h3>
            <p className="text-body-sm text-zinc-400 mb-4">Select any factors that impacted your session</p>
            <div className="flex flex-wrap gap-2">
              {config.failureTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-4 py-2 rounded-lg text-body-sm font-medium transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-red-500 text-white'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
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

export function SessionReviewForm({ config }: SessionReviewFormProps) {
  return <SessionReviewContent config={config} />
}
