'use client'

import { useRouter } from 'next/navigation'
import type { Task } from '@/types/database'
import { triggerHapticFeedback, HapticPatterns } from '@/lib/utils/haptic-feedback'

interface DomainLaunchModalProps {
  task: Task
  domain: 'gym' | 'study'
  onClose: () => void
}

export function DomainLaunchModal({ task, domain, onClose }: DomainLaunchModalProps) {
  const router = useRouter()

  const handleLaunch = () => {
    triggerHapticFeedback(HapticPatterns.MEDIUM)
    const targetPath = domain === 'gym' ? '/m/gym' : '/m/study'
    router.push(`${targetPath}?autostart=true&taskId=${task.id}`)
    onClose()
  }

  const domainIcon = domain === 'gym' ? '💪' : '📚'
  const domainLabel = domain === 'gym' ? 'Workout' : 'Study'
  const domainColor = domain === 'gym' ? 'red' : 'blue'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 rounded-2xl w-[90%] max-w-md p-6 shadow-2xl border border-zinc-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl bg-${domainColor}-500/10 flex items-center justify-center text-2xl`}>
              {domainIcon}
            </div>
            <div>
              <h2 className="text-title-lg font-bold text-white">Start {domainLabel}</h2>
              <p className="text-body-sm text-zinc-400">Begin session for this task</p>
            </div>
          </div>
        </div>

        {/* Task Info */}
        <div className="mb-6 p-4 bg-zinc-800 rounded-lg border border-zinc-700">
          <p className="text-body-sm text-zinc-400 mb-1">Task:</p>
          <p className="text-white font-medium">{task.title}</p>
          {task.description && (
            <p className="text-body-sm text-zinc-500 mt-2">{task.description}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleLaunch}
            className={`flex-1 px-4 py-3 bg-${domainColor}-600 text-white rounded-lg hover:bg-${domainColor}-700 transition-colors font-medium`}
          >
            Start Session
          </button>
        </div>
      </div>
    </div>
  )
}
