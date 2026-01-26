'use client'

import { useState } from 'react'
import { useTasks } from '@/contexts/TaskContext'
import { useToast } from '@/components/mobile/feedback/ToastProvider'

export function QuickAddFAB() {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [creating, setCreating] = useState(false)
  const { createTask } = useTasks()
  const { showToast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) return

    setCreating(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      await createTask({
        title: title.trim(),
        status: 'today',
        scheduled_date: today,
      })

      showToast('Task created!', 'success')
      setTitle('')
      setIsOpen(false)
    } catch (error) {
      console.error('Failed to create task:', error)
      showToast('Failed to create task', 'error')
    } finally {
      setCreating(false)
    }
  }

  return (
    <>
      {/* FAB Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-emerald-600 rounded-full shadow-lg hover:bg-emerald-700 transition-colors flex items-center justify-center z-40"
        aria-label="Add task"
      >
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-zinc-900 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-headline-md font-bold text-white mb-4">Quick Add Task</h2>

            <form onSubmit={handleSubmit}>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs to be done?"
                autoFocus
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-3 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!title.trim() || creating}
                  className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Creating...' : 'Add Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
