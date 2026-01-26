'use client'

import { useRouter, usePathname } from 'next/navigation'

export function CommandCenterNav() {
  const router = useRouter()
  const pathname = usePathname()

  // Only show back button on specific pages (not on Actions main page)
  const showBackButton = pathname !== '/actions' && 
    (pathname === '/tasks' || pathname === '/goals' || 
     pathname.startsWith('/tasks/') || pathname.startsWith('/projects/'))

  if (!showBackButton) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <button
        onClick={() => router.push('/actions')}
        className="w-12 h-12 bg-zinc-900/90 backdrop-blur-sm border border-zinc-700 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors shadow-lg"
        aria-label="Back to Actions"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
