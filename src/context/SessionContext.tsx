'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
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
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

const SESSION_KEY = 'lifeos_active_session' // Keep for backward compatibility
const MAX_SESSION_AGE_HOURS = 24

export function SessionProvider({ children }: { children: ReactNode }) {
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null)

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