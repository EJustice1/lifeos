'use client'

import { useState } from 'react'
import { useDailyReview } from './DailyReviewContext'

export default function KnowledgeBaseStep() {
  const { formData, setFormData } = useDailyReview()
  const [showLesson, setShowLesson] = useState(!!formData.lessonLearned)

  const handleToggleLesson = () => {
    setShowLesson(!showLesson)
    if (!showLesson) {
      setFormData({ lessonLearned: '' })
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-headline-md font-bold text-center mb-6">Knowledge Base</h1>

      <div>
        <h3 className="text-title-lg font-semibold mb-4 text-white">Lesson Learned</h3>
        <div className="flex items-center mb-4">
          <span className="text-zinc-300 mr-3">Did you learn a specific lesson today?</span>
          <button
            onClick={handleToggleLesson}
            className={`relative w-12 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              showLesson ? 'bg-blue-600' : 'bg-zinc-600'
            }`}
          >
            <span
              className={`absolute left-0.5 top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                showLesson ? 'translate-x-6' : 'translate-x-0'
              }`}
            ></span>
          </button>
        </div>

        {showLesson && (
          <textarea
            value={formData.lessonLearned || ''}
            onChange={(e) => setFormData({ lessonLearned: e.target.value })}
            placeholder="I realized that when I..."
            rows={3}
            className="w-full bg-zinc-800 rounded-lg p-3 resize-none mb-3"
          />
        )}
      </div>

      <div>
        <h3 className="text-title-lg font-semibold mb-4 text-white">Daily Highlights</h3>
        <textarea
          value={formData.highlights || ''}
          onChange={(e) => setFormData({ highlights: e.target.value })}
          placeholder="Key events, achievements, or notes from today..."
          rows={4}
          className="w-full bg-zinc-800 rounded-lg p-3 resize-none"
        />
        <p className="text-label-sm text-zinc-500 mt-2">Optional: Add any important events or accomplishments from today</p>
      </div>
    </div>
  )
}