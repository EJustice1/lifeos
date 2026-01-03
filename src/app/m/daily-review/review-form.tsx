'use client'

import { useState, useTransition } from 'react'
import { submitDailyReview } from '@/lib/actions/daily-review'

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

  async function handleSubmit() {
    startTransition(async () => {
      await submitDailyReview(
        mood,
        energy,
        success,
        wins || undefined,
        improvements || undefined,
        tags
      )
      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 2000)
    })
  }

  return (
    <section className="space-y-4">
      {/* Mood slider */}
      <div className="bg-zinc-900 rounded-xl p-4">
        <div className="flex justify-between mb-2">
          <label className="text-sm text-zinc-400">Mood</label>
          <span className="text-lg font-bold">{mood}</span>
        </div>
        <input
          type="range"
          min="1"
          max="10"
          value={mood}
          onChange={(e) => setMood(Number(e.target.value))}
          className="w-full accent-emerald-500"
        />
        <div className="flex justify-between text-xs text-zinc-500 mt-1">
          <span>Low</span>
          <span>High</span>
        </div>
      </div>

      {/* Energy slider */}
      <div className="bg-zinc-900 rounded-xl p-4">
        <div className="flex justify-between mb-2">
          <label className="text-sm text-zinc-400">Energy</label>
          <span className="text-lg font-bold">{energy}</span>
        </div>
        <input
          type="range"
          min="1"
          max="10"
          value={energy}
          onChange={(e) => setEnergy(Number(e.target.value))}
          className="w-full accent-blue-500"
        />
        <div className="flex justify-between text-xs text-zinc-500 mt-1">
          <span>Drained</span>
          <span>Energized</span>
        </div>
      </div>

      {/* Perceived success slider */}
      <div className="bg-zinc-900 rounded-xl p-4">
        <div className="flex justify-between mb-2">
          <label className="text-sm text-zinc-400">Perceived Success</label>
          <span className="text-lg font-bold">{success}</span>
        </div>
        <input
          type="range"
          min="1"
          max="10"
          value={success}
          onChange={(e) => setSuccess(Number(e.target.value))}
          className="w-full accent-purple-500"
        />
        <div className="flex justify-between text-xs text-zinc-500 mt-1">
          <span>Unproductive</span>
          <span>Crushed it</span>
        </div>
      </div>

      {/* Quick tags */}
      <div className="bg-zinc-900 rounded-xl p-4">
        <label className="text-sm text-zinc-400 block mb-3">Tags</label>
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
      </div>

      {/* Wins */}
      <div className="bg-zinc-900 rounded-xl p-4">
        <label className="text-sm text-zinc-400 block mb-2">Wins</label>
        <textarea
          value={wins}
          onChange={(e) => setWins(e.target.value)}
          placeholder="What went well today?"
          rows={2}
          className="w-full bg-zinc-800 rounded-lg p-3 resize-none"
        />
      </div>

      {/* Improvements */}
      <div className="bg-zinc-900 rounded-xl p-4">
        <label className="text-sm text-zinc-400 block mb-2">Improvements</label>
        <textarea
          value={improvements}
          onChange={(e) => setImprovements(e.target.value)}
          placeholder="What could be better?"
          rows={2}
          className="w-full bg-zinc-800 rounded-lg p-3 resize-none"
        />
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={isPending}
        className={`w-full rounded-xl p-4 text-lg font-semibold transition-colors ${
          submitted
            ? 'bg-emerald-500'
            : 'bg-emerald-600 hover:bg-emerald-500'
        } disabled:opacity-50`}
      >
        {isPending ? 'Saving...' : submitted ? 'Saved!' : existingReview ? 'Update Review' : 'Complete Review'}
      </button>
    </section>
  )
}
