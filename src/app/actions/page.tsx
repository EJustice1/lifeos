'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { triggerHapticFeedback, HapticPatterns } from '@/lib/utils/haptic-feedback'
import type { ReactNode } from 'react'

interface ActionCard {
  id: string
  label: string
  description: string
  icon: ReactNode
  action: () => void
  color: string
  bgColor: string
  hoverColor: string
}

export default function ActionsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
      } else {
        setIsAuthenticated(true)
      }
      setLoading(false)
    }
    checkAuth()
  }, [router])

  const actions: ActionCard[] = [
    {
      id: 'tasks',
      label: 'Tasks',
      description: 'View your tasks',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      hoverColor: 'hover:bg-blue-500/20',
      icon: (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
      ),
      action: () => {
        triggerHapticFeedback(HapticPatterns.LIGHT)
        router.push('/tasks')
      },
    },
    {
      id: 'goals',
      label: 'Goals',
      description: 'View life goals',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      hoverColor: 'hover:bg-purple-500/20',
      icon: (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
          />
        </svg>
      ),
      action: () => {
        triggerHapticFeedback(HapticPatterns.LIGHT)
        router.push('/goals')
      },
    },
    {
      id: 'workout',
      label: 'Start Workout',
      description: 'Begin gym session',
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      hoverColor: 'hover:bg-red-500/20',
      icon: (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
      action: () => {
        triggerHapticFeedback(HapticPatterns.MEDIUM)
        router.push('/m/gym?autostart=true')
      },
    },
    {
      id: 'study',
      label: 'Start Study',
      description: 'Begin study session',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      hoverColor: 'hover:bg-blue-500/20',
      icon: (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      ),
      action: () => {
        triggerHapticFeedback(HapticPatterns.MEDIUM)
        router.push('/m/study?autostart=true')
      },
    },
    {
      id: 'add-task',
      label: 'Add Task',
      description: 'Create new task',
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      hoverColor: 'hover:bg-emerald-500/20',
      icon: (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
      ),
      action: () => {
        triggerHapticFeedback(HapticPatterns.LIGHT)
        router.push('/tasks/new')
      },
    },
    {
      id: 'add-project',
      label: 'Add Project',
      description: 'Create new project',
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      hoverColor: 'hover:bg-cyan-500/20',
      icon: (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      ),
      action: () => {
        triggerHapticFeedback(HapticPatterns.LIGHT)
        router.push('/projects/new')
      },
    },
    {
      id: 'daily-review',
      label: 'Daily Review',
      description: 'Complete reflection',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      hoverColor: 'hover:bg-purple-500/20',
      icon: (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      action: () => {
        triggerHapticFeedback(HapticPatterns.MEDIUM)
        router.push('/m/daily-context-review')
      },
    },
    {
      id: 'settings',
      label: 'Settings',
      description: 'App preferences',
      color: 'text-zinc-400',
      bgColor: 'bg-zinc-500/10',
      hoverColor: 'hover:bg-zinc-500/20',
      icon: (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
      action: () => {
        triggerHapticFeedback(HapticPatterns.LIGHT)
        router.push('/m/settings')
      },
    },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-zinc-950 pb-24">
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-40">
        <div className="px-4 py-4">
          <h1 className="text-3xl font-bold text-white mb-1">Actions</h1>
          <p className="text-sm text-zinc-400">Quick access to all functions</p>
        </div>
      </div>

      {/* Action Grid */}
      <div className="px-4 py-6">
        <div className="grid grid-cols-2 gap-4">
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={action.action}
              className={`p-6 rounded-xl ${action.bgColor} ${action.hoverColor} border border-zinc-800 transition-all duration-200 hover:scale-105 active:scale-95 flex flex-col items-center gap-3`}
            >
              <div className={`${action.color} flex justify-center`}>{action.icon}</div>
              <div className="text-center">
                <div className="text-white font-semibold text-base mb-1">{action.label}</div>
                <div className="text-zinc-400 text-xs">{action.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

    </div>
  )
}
