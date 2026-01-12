"use client";

import { getTodayReview } from '@/lib/actions/daily-review'
import { ReviewForm } from './review-form'
import { AppSidebar } from '@/components/mobile/layout/AppSidebar'
import { useState, useEffect } from 'react'

export default function DailyReviewPage() {
  const [activeSection, setActiveSection] = useState('review')
  const [existingReview, setExistingReview] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReview = async () => {
      try {
        const review = await getTodayReview()
        setExistingReview(review)
      } catch (error) {
        console.error('Failed to fetch daily review:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchReview()
  }, [])

  const sidebarItems = [
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      label: 'Review',
      onClick: () => setActiveSection('review'),
      isActive: activeSection === 'review'
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
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      label: 'Insights',
      onClick: () => setActiveSection('insights'),
      isActive: activeSection === 'insights'
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      label: 'Mood',
      onClick: () => setActiveSection('mood'),
      isActive: activeSection === 'mood'
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
        title="Daily Review"
        accentColor="var(--mobile-purple)"
      />

      <div className="pt-16 pb-8 px-4">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--mobile-purple)]"></div>
          </div>
        ) : (
          <>
            {activeSection === 'review' && <ReviewForm existingReview={existingReview} />}
            {activeSection === 'history' && <div>Review History (Coming Soon)</div>}
            {activeSection === 'insights' && <div>Insights & Trends (Coming Soon)</div>}
            {activeSection === 'mood' && <div>Mood Tracking (Coming Soon)</div>}
            {activeSection === 'profile' && <div>Profile Settings (Coming Soon)</div>}
          </>
        )}
      </div>
    </>
  )
}
