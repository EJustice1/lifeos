'use client'

import { useEffect, useState } from 'react'
import { debugReviewDate } from '@/lib/actions/debug-review-date'

export default function DebugReviewPage() {
  const [debug, setDebug] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const data = await debugReviewDate()
      setDebug(data)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <h1 className="text-2xl font-bold mb-6">Daily Review Debug Info</h1>
      
      <div className="space-y-4 font-mono text-sm">
        <div className="bg-zinc-900 p-4 rounded-lg">
          <h2 className="font-bold text-emerald-400 mb-2">Current Time</h2>
          <p>Time: {debug?.currentTime}</p>
          <p>Hour: {debug?.currentHour}</p>
          <p>Minute: {debug?.currentMinute}</p>
        </div>

        <div className="bg-zinc-900 p-4 rounded-lg">
          <h2 className="font-bold text-emerald-400 mb-2">Settings</h2>
          <p>Cutoff Hour: {debug?.cutoffHour}</p>
          <pre className="mt-2 text-xs overflow-auto">
            {JSON.stringify(debug?.settingsRow, null, 2)}
          </pre>
        </div>

        <div className="bg-zinc-900 p-4 rounded-lg">
          <h2 className="font-bold text-emerald-400 mb-2">Dates</h2>
          <p>Calendar Date (today): {debug?.calendarDate}</p>
          <p>Review Date (based on cutoff): {debug?.reviewDate}</p>
        </div>

        <div className="bg-zinc-900 p-4 rounded-lg">
          <h2 className="font-bold text-emerald-400 mb-2">Existing Reviews</h2>
          <p>Review exists for review date ({debug?.reviewDate}): {debug?.reviewExistsForReviewDate ? 'YES' : 'NO'}</p>
          {debug?.reviewDateData && (
            <pre className="mt-2 text-xs overflow-auto">
              {JSON.stringify(debug?.reviewDateData, null, 2)}
            </pre>
          )}
          
          <p className="mt-4">Review exists for calendar date ({debug?.calendarDate}): {debug?.reviewExistsForCalendarDate ? 'YES' : 'NO'}</p>
          {debug?.calendarDateData && (
            <pre className="mt-2 text-xs overflow-auto">
              {JSON.stringify(debug?.calendarDateData, null, 2)}
            </pre>
          )}
        </div>

        <div className="bg-amber-900/20 border border-amber-600/30 p-4 rounded-lg">
          <h2 className="font-bold text-amber-400 mb-2">Expected Behavior</h2>
          <p>If current hour ({debug?.currentHour}) &lt; cutoff hour ({debug?.cutoffHour}):</p>
          <p className="ml-4">→ Review date should be yesterday</p>
          <p className="ml-4">→ Should show yesterday&apos;s data and look for yesterday&apos;s review</p>
          
          <p className="mt-2">If current hour ({debug?.currentHour}) &gt;= cutoff hour ({debug?.cutoffHour}):</p>
          <p className="ml-4">→ Review date should be today</p>
          <p className="ml-4">→ Should show today&apos;s data and look for today&apos;s review</p>
        </div>
      </div>
    </div>
  )
}
