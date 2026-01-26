'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SegmentedControl } from '@/components/mobile/inputs/SegmentedControl'
import { TodayView } from '@/components/focus/TodayView'
import { BacklogView } from '@/components/focus/BacklogView'

export default function TasksPage() {
  const [activeView, setActiveView] = useState<'today' | 'backlog'>('today')
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
          <h1 className="text-headline-lg font-bold text-white mb-4">Tasks</h1>
          
          {/* Segmented Control */}
          <SegmentedControl
            options={[
              { id: 'today', label: 'Today' },
              { id: 'backlog', label: 'Backlog' },
            ]}
            value={activeView}
            onChange={(value) => setActiveView(value as 'today' | 'backlog')}
            className="w-full"
          />
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6">
        {activeView === 'today' ? <TodayView /> : <BacklogView />}
      </div>
    </div>
  )
}
