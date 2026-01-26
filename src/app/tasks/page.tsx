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
    <div className="min-h-screen bg-zinc-950">
      {/* Mobile-optimized header */}
      <div className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur-sm">
        {/* Segmented Control - full width */}
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

      {/* Content - no padding, components handle it */}
      {activeView === 'today' ? <TodayView /> : <BacklogView />}
    </div>
  )
}
