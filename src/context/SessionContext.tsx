'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react'
import {
  saveSessionMetadata,
  loadSessionMetadata,
  validateSessionAge,
  clearSessionMetadata,
  saveSessionData,
  loadSessionData,
  clearSessionData,
  clearAllSessionData,
  type SessionMetadata,
} from '@/lib/utils/session-storage'

interface ActiveSession {
  type: 'study' | 'workout'
  startedAt: string
  bucketId?: string
  workoutType?: string
  workoutId?: string      // DB record ID for gym
  sessionId?: string      // DB record ID for study
  sessionData?: any       // Module-specific data (sets, timer state, etc.)
}

/**
 * Backup structure for atomic operations with rollback
 */
export interface SessionBackup {
  session: ActiveSession | null
  localStorage: {
    metadata: SessionMetadata | null
    workoutData: any
    studyData: any
  }
}

interface SessionContextType {
  activeSession: ActiveSession | null
  startSession: (
    type: 'study' | 'workout',
    options?: {
      bucketId?: string
      workoutType?: string
      workoutId?: string
      sessionId?: string
      sessionData?: any
    }
  ) => void
  endSession: () => void
  getSessionDuration: () => number
  clearExpiredSessions: () => void
  updateSessionData: (data: any) => void
  recoverActiveSession: () => ActiveSession | null
  
  // New atomic operation methods
  /** Create a backup of current session state for rollback */
  createBackup: () => SessionBackup
  /** Restore session state from a backup */
  restoreFromBackup: (backup: SessionBackup) => void
  /** Clear session state immediately (for atomic operations, skips localStorage sync) */
  clearSessionImmediate: () => void
  /** Set session directly (for recovery/restore operations) */
  setSessionDirect: (session: ActiveSession | null) => void
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

const SESSION_KEY = 'lifeos_active_session' // Keep for backward compatibility
const MAX_SESSION_AGE_HOURS = 24

export function SessionProvider({ children }: { children: ReactNode }) {
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null)
  
  // Ref to skip localStorage sync during atomic operations
  const skipLocalStorageSync = useRef(false)

  // Load session from localStorage on initial render using new storage utilities
  useEffect(() => {
    const metadata = loadSessionMetadata()
    if (!metadata) return

    try {
      const validation = validateSessionAge(metadata.startedAt)

      if (validation.isValid) {
        // Load session data if exists
        const sessionData = loadSessionData(metadata.type)

        const session: ActiveSession = {
          ...metadata,
          sessionData,
        }
        setActiveSession(session)
      } else {
        // Clear expired session
        clearAllSessionData()
      }
    } catch (error) {
      console.error('Failed to recover session:', error)
      clearAllSessionData()
    }
  }, [])

  // Handle cross-tab communication via storage events
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // Listen for changes to session metadata key
      if (e.key === SESSION_KEY || e.key?.startsWith('lifeos_session_')) {
        if (e.newValue) {
          try {
            const metadata = loadSessionMetadata()
            if (!metadata) return

            const validation = validateSessionAge(metadata.startedAt)
            if (validation.isValid) {
              const sessionData = loadSessionData(metadata.type)
              const session: ActiveSession = {
                ...metadata,
                sessionData,
              }
              setActiveSession(session)
            } else {
              clearAllSessionData()
              setActiveSession(null)
            }
          } catch (error) {
            console.error('Failed to parse session from storage event:', error)
          }
        } else {
          setActiveSession(null)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Auto-save active session to localStorage when it changes
  useEffect(() => {
    // Skip sync if we're in the middle of an atomic operation
    if (skipLocalStorageSync.current) {
      skipLocalStorageSync.current = false
      return
    }
    
    if (activeSession) {
      // Save metadata
      const metadata: SessionMetadata = {
        type: activeSession.type,
        startedAt: activeSession.startedAt,
        bucketId: activeSession.bucketId,
        workoutType: activeSession.workoutType,
        workoutId: activeSession.workoutId,
        sessionId: activeSession.sessionId,
      }
      saveSessionMetadata(metadata)

      // Save session data if exists
      if (activeSession.sessionData) {
        saveSessionData(activeSession.type, activeSession.sessionData)
      }
    } else {
      clearAllSessionData()
    }
  }, [activeSession])

  const startSession = (
    type: 'study' | 'workout',
    options: {
      bucketId?: string
      workoutType?: string
      workoutId?: string
      sessionId?: string
      sessionData?: any
    } = {}
  ) => {
    const now = new Date().toISOString()
    const newSession: ActiveSession = {
      type,
      startedAt: now,
      ...options,
    }
    setActiveSession(newSession)
  }

  const endSession = () => {
    setActiveSession(null)
    // Cleanup is handled by the useEffect hook above
  }

  const updateSessionData = (data: any) => {
    if (!activeSession) return

    const updatedSession: ActiveSession = {
      ...activeSession,
      sessionData: data,
    }
    setActiveSession(updatedSession)
  }

  const recoverActiveSession = (): ActiveSession | null => {
    try {
      const metadata = loadSessionMetadata()
      if (!metadata) return null

      const validation = validateSessionAge(metadata.startedAt)
      if (!validation.isValid) {
        clearAllSessionData()
        return null
      }

      const sessionData = loadSessionData(metadata.type)
      return {
        ...metadata,
        sessionData,
      }
    } catch (error) {
      console.error('Failed to recover active session:', error)
      clearAllSessionData()
      return null
    }
  }

  // Calculate current session duration based on start time
  const getSessionDuration = () => {
    if (activeSession) {
      return Math.floor((Date.now() - new Date(activeSession.startedAt).getTime()) / 1000)
    }
    return 0
  }

  const clearExpiredSessions = () => {
    const metadata = loadSessionMetadata()
    if (metadata) {
      try {
        const validation = validateSessionAge(metadata.startedAt)

        if (validation.isExpired) {
          clearAllSessionData()
          setActiveSession(null)
        }
      } catch (error) {
        console.error('Failed to check session expiration:', error)
        clearAllSessionData()
        setActiveSession(null)
      }
    }
  }

  /**
   * Create a backup of current session state for atomic operations
   * This captures both React state and localStorage for rollback capability
   */
  const createBackup = useCallback((): SessionBackup => {
    return {
      session: activeSession,
      localStorage: {
        metadata: loadSessionMetadata(),
        workoutData: loadSessionData('workout'),
        studyData: loadSessionData('study'),
      },
    }
  }, [activeSession])

  /**
   * Restore session state from a backup (rollback)
   * Used when an atomic operation fails and we need to revert
   */
  const restoreFromBackup = useCallback((backup: SessionBackup) => {
    // Restore localStorage first
    if (backup.localStorage.metadata) {
      saveSessionMetadata(backup.localStorage.metadata)
      if (backup.localStorage.workoutData) {
        saveSessionData('workout', backup.localStorage.workoutData)
      }
      if (backup.localStorage.studyData) {
        saveSessionData('study', backup.localStorage.studyData)
      }
    } else {
      clearAllSessionData()
    }
    
    // Skip the auto-sync effect for this state change (we already restored localStorage)
    skipLocalStorageSync.current = true
    setActiveSession(backup.session)
  }, [])

  /**
   * Clear session state immediately without triggering localStorage sync
   * Used for the first step of atomic end operations
   */
  const clearSessionImmediate = useCallback(() => {
    // Clear localStorage directly
    clearAllSessionData()
    
    // Skip the auto-sync effect (we already cleared localStorage)
    skipLocalStorageSync.current = true
    setActiveSession(null)
  }, [])

  /**
   * Set session directly, useful for recovery/restore operations
   */
  const setSessionDirect = useCallback((session: ActiveSession | null) => {
    setActiveSession(session)
  }, [])

  return (
    <SessionContext.Provider
      value={{
        activeSession,
        startSession,
        endSession,
        getSessionDuration,
        clearExpiredSessions,
        updateSessionData,
        recoverActiveSession,
        createBackup,
        restoreFromBackup,
        clearSessionImmediate,
        setSessionDirect,
      }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  const context = useContext(SessionContext)
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider')
  }
  return context
}