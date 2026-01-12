"use client";

import { getBuckets, getTodaySessions } from '@/lib/actions/study'
import { CareerTracker } from './career-tracker'
import { AppSidebar } from '@/components/mobile/layout/AppSidebar'
import { useState, useEffect } from 'react'

export default function StudyPage() {
  const [activeSection, setActiveSection] = useState('tracker')
  const [buckets, setBuckets] = useState<any[]>([])
  const [todaySessions, setTodaySessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bucketsData, sessionsData] = await Promise.all([
          getBuckets(),
          getTodaySessions(),
        ])
        setBuckets([...bucketsData])
        setTodaySessions([...sessionsData])
      } catch (error) {
        console.error('Failed to fetch study data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const sidebarItems = [
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v11.494m-9-5.747h18" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17l3 3 3-3" />
        </svg>
      ),
      label: 'Tracker',
      onClick: () => setActiveSection('tracker'),
      isActive: activeSection === 'tracker'
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      label: 'History',
      onClick: () => setActiveSection('history'),
      isActive: activeSection === 'history'
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      label: 'Resources',
      onClick: () => setActiveSection('resources'),
      isActive: activeSection === 'resources'
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: 'Goals',
      onClick: () => setActiveSection('goals'),
      isActive: activeSection === 'goals'
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      label: 'Profile',
      onClick: () => setActiveSection('profile'),
      isActive: activeSection === 'profile'
    }
  ]

  return (
    <>
      <AppSidebar
        items={sidebarItems}
        title="Study"
        accentColor="var(--mobile-secondary)"
      />

      <div className="pt-16 pb-8 px-4">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--mobile-secondary)]"></div>
          </div>
        ) : (
          <>
            {activeSection === 'tracker' && <CareerTracker buckets={buckets} todaySessions={todaySessions} />}
            {activeSection === 'history' && <div>Study History (Coming Soon)</div>}
            {activeSection === 'resources' && <div>Resource Library (Coming Soon)</div>}
            {activeSection === 'goals' && <div>Goals & Milestones (Coming Soon)</div>}
            {activeSection === 'profile' && <div>Profile Settings (Coming Soon)</div>}
          </>
        )}
      </div>
    </>
  )
}
