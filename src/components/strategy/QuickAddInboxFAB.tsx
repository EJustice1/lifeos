'use client'

import { useState } from 'react'
import { createTask } from '@/lib/actions/tasks'
import { triggerHapticFeedback, HapticPatterns } from '@/lib/utils/haptic-feedback'

interface QuickAddInboxFABProps {
  onTaskCreated?: () => void
}

export function QuickAddInboxFAB({ onTaskCreated }: QuickAddInboxFABProps) {
  const [showInput, setShowInput] = useState(false)
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim()) return
    
    try {
      setLoading(true)
      await createTask({
        title: title.trim(),
        status: 'inbox',
      })
      triggerHapticFeedback(HapticPatterns.SUCCESS)
      setTitle('')
      setShowInput(false)
      onTaskCreated?.()
    } catch (error) {
      console.error('Failed to create task:', error)
      triggerHapticFeedback(HapticPatterns.FAILURE)
    } finally {
      setLoading(false)
    }
  }

  if (showInput) {
    return (
      <div className="fixed bottom-20 right-4 left-4 md:left-auto md:w-96 z-50">
        <form onSubmit={handleSubmit} className="bg-zinc-800 rounded-lg border border-zinc-700 shadow-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="flex-1 bg-zinc-900 text-white px-3 py-2 rounded border border-zinc-700 focus:border-emerald-500 focus:outline-none"
              autoFocus
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => {
                setShowInput(false)
                setTitle('')
              }}
              className="p-2 text-zinc-400 hover:text-white"
              disabled={loading}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!title.trim() || loading}
              className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 disabled:opacity-50 text-white rounded font-medium transition-colors"
            >
              {loading ? 'Adding...' : 'Add to Inbox'}
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowInput(true)}
      className="fixed bottom-20 right-4 z-50 w-14 h-14 bg-emerald-600 hover:bg-emerald-700 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110"
      aria-label="Quick add to inbox"
    >
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    </button>
  )
}
