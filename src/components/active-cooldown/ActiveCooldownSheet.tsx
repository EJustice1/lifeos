'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { triggerHapticFeedback, HapticPatterns } from '@/lib/utils/haptic-feedback'

interface ActiveCooldownSheetProps {
  sessionId: string
  sessionType: 'study' | 'workout'
  onClose: () => void
  onSave?: () => void
}

const STUDY_FAILURE_TAGS = [
  'Brain Fog',
  'Social Distraction',
  'Phone',
  'Poor Planning',
  'Boredom',
]

const GYM_FAILURE_TAGS = [
  'Low Energy',
  'Bad Sleep',
  'Injury/Pain',
  'Short on Time',
]

export function ActiveCooldownSheet({
  sessionId,
  sessionType,
  onClose,
  onSave,
}: ActiveCooldownSheetProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [expanded, setExpanded] = useState(false)
  
  // Ratings
  const [rating1, setRating1] = useState<number>(0) // Effort/Intensity
  const [rating2, setRating2] = useState<number>(0) // Focus/Feeling
  
  // Failure tags (only shown if ratings are low)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  
  // Loading state
  const [saving, setSaving] = useState(false)

  const failureTags = sessionType === 'study' ? STUDY_FAILURE_TAGS : GYM_FAILURE_TAGS
  const rating1Label = sessionType === 'study' ? 'Effort' : 'Intensity (RPE)'
  const rating2Label = sessionType === 'study' ? 'Focus Quality' : 'Feeling'

  // Auto-expand if either rating is low
  useEffect(() => {
    if ((rating1 > 0 && rating1 <= 2) || (rating2 > 0 && rating2 <= 2)) {
      setExpanded(true)
    } else {
      setExpanded(false)
      setSelectedTags([])
    }
  }, [rating1, rating2])

  const canSave = rating1 > 0 && rating2 > 0

  const handleSave = async () => {
    if (!canSave) return

    try {
      setSaving(true)
      triggerHapticFeedback(HapticPatterns.MEDIUM)

      const supabase = createClient()
      const tableName = sessionType === 'study' ? 'study_sessions' : 'workouts'
      const columnNames = sessionType === 'study' 
        ? { rating1: 'effort_rating', rating2: 'focus_rating' }
        : { rating1: 'effort_rating', rating2: 'feeling_rating' }

      const { error } = await supabase
        .from(tableName)
        .update({
          [columnNames.rating1]: rating1,
          [columnNames.rating2]: rating2,
          failure_tags: selectedTags,
        })
        .eq('id', sessionId)

      if (error) throw error

      triggerHapticFeedback(HapticPatterns.SUCCESS)
      onSave?.()
      handleClose()
    } catch (error) {
      console.error('Failed to save feedback:', error)
      triggerHapticFeedback(HapticPatterns.FAILURE)
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setTimeout(onClose, 300) // Wait for animation
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleClose}
      />

      {/* Bottom Sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 rounded-t-2xl z-50 transition-transform duration-300 ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: expanded ? '80vh' : '60vh' }}
      >
        <div className="flex flex-col h-full">
          {/* Handle */}
          <div className="flex justify-center py-2">
            <div className="w-12 h-1.5 bg-zinc-700 rounded-full" />
          </div>

          {/* Header */}
          <div className="px-4 py-3 border-b border-zinc-800">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                {sessionType === 'study' ? 'Study Session Feedback' : 'Workout Feedback'}
              </h2>
              <button
                onClick={handleClose}
                className="p-2 text-zinc-400 hover:text-white"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
            {/* Rating 1 */}
            <div>
              <label className="block text-sm font-medium text-white mb-3">
                {rating1Label}
              </label>
              <div className="flex gap-2 justify-center">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => {
                      setRating1(star)
                      triggerHapticFeedback(HapticPatterns.LIGHT)
                    }}
                    className="p-2 transition-transform hover:scale-110 active:scale-95"
                  >
                    <svg
                      className={`w-10 h-10 ${
                        star <= rating1 ? 'text-yellow-400' : 'text-zinc-700'
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>

            {/* Rating 2 */}
            <div>
              <label className="block text-sm font-medium text-white mb-3">
                {rating2Label}
              </label>
              <div className="flex gap-2 justify-center">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => {
                      setRating2(star)
                      triggerHapticFeedback(HapticPatterns.LIGHT)
                    }}
                    className="p-2 transition-transform hover:scale-110 active:scale-95"
                  >
                    <svg
                      className={`w-10 h-10 ${
                        star <= rating2 ? 'text-yellow-400' : 'text-zinc-700'
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>

            {/* Failure Tags (Progressive Disclosure) */}
            {expanded && (
              <div className="animate-in slide-in-from-bottom-4 duration-300">
                <label className="block text-sm font-medium text-white mb-3">
                  What affected your performance?
                </label>
                <div className="flex flex-wrap gap-2">
                  {failureTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        selectedTags.includes(tag)
                          ? 'bg-red-600 text-white'
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

          {/* Footer */}
          <div className="px-4 py-4 border-t border-zinc-800 pb-safe">
            <button
              onClick={handleSave}
              disabled={!canSave || saving}
              className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 disabled:opacity-50 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Saving...
                </>
              ) : (
                'Save Feedback'
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
