'use client'

import { useEffect, useState, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { useSession } from '@/context/SessionContext'
import { 
  validateSessionAge, 
  loadSessionMetadata, 
  clearAllSessionData 
} from '@/lib/utils/session-storage'
import { endWorkout, getActiveWorkout } from '@/lib/actions/gym'
import { endStudySession, getActiveStudySession } from '@/lib/actions/study'

type RecoveryState = 
  | 'idle'
  | 'checking'
  | 'valid'
  | 'stale_local'  // localStorage has session but DB doesn't
  | 'missing_local' // DB has session but localStorage doesn't
  | 'expired'
  | 'mismatch'  // localStorage and DB have different sessions

interface RecoveryInfo {
  type: 'workout' | 'study'
  localStorage?: any
  database?: any
}

export function SessionRecovery() {
  const pathname = usePathname()
  const { 
    recoverActiveSession, 
    activeSession, 
    endSession,
    setSessionDirect,
    clearSessionImmediate,
  } = useSession()
  
  const [recoveryState, setRecoveryState] = useState<RecoveryState>('idle')
  const [recoveryInfo, setRecoveryInfo] = useState<RecoveryInfo | null>(null)
  const [showDialog, setShowDialog] = useState(false)

  /**
   * Check database for active session based on type
   */
  const checkDatabaseSession = useCallback(async (type: 'workout' | 'study') => {
    if (type === 'workout') {
      return await getActiveWorkout()
    } else {
      return await getActiveStudySession()
    }
  }, [])

  /**
   * Validate localStorage session against database
   * This is the key function that prevents race conditions by ensuring
   * localStorage and DB are in sync
   */
  const validateAndRecover = useCallback(async () => {
    setRecoveryState('checking')

    try {
      // Get localStorage session
      const localSession = recoverActiveSession()
      const metadata = loadSessionMetadata()

      // Determine which type of session to check based on current route
      const isOnGymRoute = pathname === '/m/gym'
      const isOnStudyRoute = pathname === '/m/study'
      
      // Only check sessions relevant to current route
      const sessionType: 'workout' | 'study' | null = 
        isOnGymRoute ? 'workout' : 
        isOnStudyRoute ? 'study' : 
        null

      if (!sessionType) {
        // Not on a session-related route
        setRecoveryState('idle')
        return
      }

      // Check database for active session of this type
      const dbSession = await checkDatabaseSession(sessionType)

      // Case 1: No localStorage session, no DB session = clean state
      if (!localSession && !dbSession) {
        setRecoveryState('valid')
        return
      }

      // Case 2: localStorage has session of different type than current route
      if (localSession && localSession.type !== sessionType) {
        // Leave it alone - it's for a different module
        setRecoveryState('valid')
        return
      }

      // Case 3: localStorage has session but DB doesn't = stale localStorage
      if (localSession && localSession.type === sessionType && !dbSession) {
        console.warn('Stale localStorage session detected, clearing...')
        setRecoveryInfo({ 
          type: sessionType, 
          localStorage: localSession 
        })
        setRecoveryState('stale_local')
        
        // Auto-clear stale session
        clearAllSessionData()
        clearSessionImmediate()
        setRecoveryState('valid')
        return
      }

      // Case 4: DB has session but localStorage doesn't = restore from DB
      if (!localSession && dbSession) {
        console.log('Restoring session from database...')
        setRecoveryInfo({ 
          type: sessionType, 
          database: dbSession 
        })
        setRecoveryState('missing_local')
        
        // The session hooks will handle restoration via their checkActiveSession
        // Just mark as valid and let the hooks do their work
        setRecoveryState('valid')
        return
      }

      // Case 5: Both have sessions - validate they match
      if (localSession && dbSession) {
        const localId = sessionType === 'workout' 
          ? localSession.workoutId 
          : localSession.sessionId
        
        if (localId === dbSession.id) {
          // Sessions match - check if expired
          const validation = validateSessionAge(localSession.startedAt)
          
          if (validation.isExpired) {
            setRecoveryInfo({ 
              type: sessionType, 
              localStorage: localSession, 
              database: dbSession 
            })
            setRecoveryState('expired')
            setShowDialog(true)
            return
          }
          
          // Valid and matching
          setRecoveryState('valid')
          return
        } else {
          // Sessions don't match - DB is source of truth
          console.warn('Session mismatch detected, using DB as source of truth...')
          setRecoveryInfo({ 
            type: sessionType, 
            localStorage: localSession, 
            database: dbSession 
          })
          
          // Clear localStorage and let hooks restore from DB
          clearAllSessionData()
          clearSessionImmediate()
          setRecoveryState('valid')
          return
        }
      }

      setRecoveryState('valid')
    } catch (error) {
      console.error('Session recovery validation error:', error)
      setRecoveryState('idle')
    }
  }, [pathname, recoverActiveSession, checkDatabaseSession, clearSessionImmediate])

  // Run validation on mount and route changes
  useEffect(() => {
    const isOnSessionRoute = pathname === '/m/gym' || pathname === '/m/study'
    
    if (isOnSessionRoute) {
      // Small delay to avoid flash and let components mount
      const timer = setTimeout(validateAndRecover, 150)
      return () => clearTimeout(timer)
    } else {
      setRecoveryState('idle')
    }
  }, [pathname, validateAndRecover])

  /**
   * Handle continuing an expired session
   */
  const handleContinueExpiredSession = useCallback(() => {
    setShowDialog(false)
    setRecoveryInfo(null)
    setRecoveryState('valid')
  }, [])

  /**
   * Handle ending an expired session
   */
  const handleEndExpiredSession = useCallback(async () => {
    if (!recoveryInfo) return

    try {
      const endedAt = new Date().toISOString()
      
      // End the session in the database
      if (recoveryInfo.type === 'workout' && recoveryInfo.database?.id) {
        await endWorkout(recoveryInfo.database.id, endedAt)
      } else if (recoveryInfo.type === 'study' && recoveryInfo.database?.id) {
        await endStudySession(recoveryInfo.database.id, undefined, endedAt)
      }

      // Clear local storage
      clearAllSessionData()
      endSession()

      setShowDialog(false)
      setRecoveryInfo(null)
      setRecoveryState('valid')
    } catch (error) {
      console.error('Failed to end expired session:', error)
      // Clear local storage anyway
      clearAllSessionData()
      endSession()
      setShowDialog(false)
      setRecoveryInfo(null)
      setRecoveryState('valid')
    }
  }, [recoveryInfo, endSession])

  // Show loading overlay during validation
  if (recoveryState === 'checking') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-zinc-900 rounded-xl p-6 max-w-sm">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-emerald-500 border-t-transparent" />
            <p className="text-white">Validating session...</p>
          </div>
        </div>
      </div>
    )
  }

  // Show expired session dialog
  if (showDialog && recoveryInfo && recoveryState === 'expired') {
    const sessionType = recoveryInfo.type === 'workout' ? 'workout' : 'study session'
    const sessionInfo = recoveryInfo.type === 'workout'
      ? recoveryInfo.database?.type || 'General'
      : 'Study'

    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-zinc-900 rounded-xl p-6 max-w-md w-full">
          <h3 className="text-xl font-bold text-white mb-3">Expired Session Found</h3>
          <p className="text-zinc-300 mb-4">
            You have an active {sessionType} that's older than 24 hours ({sessionInfo}). 
            Would you like to continue or end it?
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

  // No UI needed when not validating or showing dialog
  return null
}
