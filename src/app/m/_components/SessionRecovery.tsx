'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useSession } from '@/context/SessionContext'
import { validateSessionAge } from '@/lib/utils/session-storage'
import { endWorkout } from '@/lib/actions/gym'
import { endStudySession } from '@/lib/actions/study'

export function SessionRecovery() {
  const router = useRouter()
  const pathname = usePathname()
  const { recoverActiveSession, activeSession, endSession } = useSession()
  const [isRecovering, setIsRecovering] = useState(true)
  const [showExpiredDialog, setShowExpiredDialog] = useState(false)
  const [expiredSession, setExpiredSession] = useState<any>(null)

  useEffect(() => {
    // Only run recovery once on mount
    if (!isRecovering) return

    const performRecovery = async () => {
      try {
        const session = recoverActiveSession()

        if (!session) {
          setIsRecovering(false)
          return
        }

        const validation = validateSessionAge(session.startedAt)

        // Session is valid and fresh (< 24 hours)
        if (validation.isValid && !validation.isExpired) {
          // Only auto-navigate if we're on a matching route
          const isOnGymRoute = pathname === '/m/gym'
          const isOnStudyRoute = pathname === '/m/study'
          const isGymSession = session.type === 'workout'
          const isStudySession = session.type === 'study'

          // Navigate only if route matches session type
          if (isGymSession && !isOnGymRoute) {
            // User is not on gym route, don't auto-navigate
            setIsRecovering(false)
            return
          } else if (isStudySession && !isOnStudyRoute) {
            // User is not on study route, don't auto-navigate
            setIsRecovering(false)
            return
          }

          // If we're already on the matching route, session will auto-populate via hooks
          setIsRecovering(false)
          return
        }

        // Session is expired (> 24 hours)
        if (validation.isExpired) {
          // Only show expired dialog if we're on the matching route
          const isOnGymRoute = pathname === '/m/gym'
          const isOnStudyRoute = pathname === '/m/study'
          const isGymSession = session.type === 'workout'
          const isStudySession = session.type === 'study'

          if ((isGymSession && isOnGymRoute) || (isStudySession && isOnStudyRoute)) {
            setExpiredSession(session)
            setShowExpiredDialog(true)
          }
          setIsRecovering(false)
          return
        }
      } catch (error) {
        console.error('Session recovery error:', error)
        setIsRecovering(false)
      }
    }

    // Small delay to avoid flash
    const timer = setTimeout(performRecovery, 100)
    return () => clearTimeout(timer)
  }, [pathname]) // Re-run when pathname changes

  // Handle expired session confirmation
  const handleContinueExpiredSession = () => {
    if (!expiredSession) return

    // Just close the dialog - we're already on the right route
    // The session will auto-populate via the hooks
    setShowExpiredDialog(false)
    setExpiredSession(null)
  }

  const handleEndExpiredSession = async () => {
    if (!expiredSession) return

    try {
      // End the session in the database
      if (expiredSession.type === 'workout' && expiredSession.workoutId) {
        await endWorkout(expiredSession.workoutId)
      } else if (expiredSession.type === 'study' && expiredSession.sessionId) {
        await endStudySession(expiredSession.sessionId)
      }

      // Clear local storage
      endSession()

      setShowExpiredDialog(false)
      setExpiredSession(null)
    } catch (error) {
      console.error('Failed to end expired session:', error)
      // Clear local storage anyway
      endSession()
      setShowExpiredDialog(false)
      setExpiredSession(null)
    }
  }

  // Show loading overlay during recovery
  if (isRecovering && activeSession) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-zinc-900 rounded-xl p-6 max-w-sm">
          <p className="text-white text-center">Recovering session...</p>
        </div>
      </div>
    )
  }

  // Show expired session dialog
  if (showExpiredDialog && expiredSession) {
    const sessionType = expiredSession.type === 'workout' ? 'workout' : 'study session'
    const sessionInfo =
      expiredSession.type === 'workout'
        ? expiredSession.workoutType || 'General'
        : expiredSession.bucketId || 'Unknown'

    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-zinc-900 rounded-xl p-6 max-w-md w-full">
          <h3 className="text-xl font-bold text-white mb-3">Expired Session Found</h3>
          <p className="text-zinc-300 mb-4">
            You have an active {sessionType} that's older than 24 hours ({sessionInfo}). Would you
            like to continue or end it?
          </p>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleEndExpiredSession}
              className="bg-zinc-800 hover:bg-zinc-700 rounded-xl p-4 font-semibold text-white transition-colors"
            >
              End Session
            </button>
            <button
              onClick={handleContinueExpiredSession}
              className="bg-emerald-600 hover:bg-emerald-500 rounded-xl p-4 font-semibold text-white transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    )
  }

  // No UI needed when not recovering or showing dialog
  return null
}
