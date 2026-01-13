'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface ActiveSession {
  type: 'study' | 'workout'
  startedAt: string
  bucketId?: string
  workoutType?: string
}

interface SessionContextType {
  activeSession: ActiveSession | null
  startSession: (type: 'study' | 'workout', options?: { bucketId?: string; workoutType?: string }) => void
  endSession: () => void
  getSessionDuration: () => number
  clearExpiredSessions: () => void
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

const SESSION_KEY = 'lifeos_active_session'
const MAX_SESSION_AGE_HOURS = 24

export function SessionProvider({ children }: { children: ReactNode }) {
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null)

  // Load session from localStorage on initial render
  useEffect(() => {
    const data = localStorage.getItem(SESSION_KEY)
    if (!data) return

    try {
      const session = JSON.parse(data) as ActiveSession
      const ageHours = (Date.now() - new Date(session.startedAt).getTime()) / (1000 * 60 * 60)

      if (ageHours <= MAX_SESSION_AGE_HOURS) {
        setActiveSession(session)
      } else {
        localStorage.removeItem(SESSION_KEY)
      }
    } catch (error) {
      console.error('Failed to recover session:', error)
      localStorage.removeItem(SESSION_KEY)
    }
  }, [])

  // Handle cross-tab communication via storage events
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === SESSION_KEY) {
        if (e.newValue) {
          try {
            const session = JSON.parse(e.newValue) as ActiveSession
            // Validate the session before applying it
            const ageHours = (Date.now() - new Date(session.startedAt).getTime()) / (1000 * 60 * 60)
            if (ageHours <= MAX_SESSION_AGE_HOURS) {
              setActiveSession(session)
            } else {
              localStorage.removeItem(SESSION_KEY)
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
      localStorage.setItem(SESSION_KEY, JSON.stringify(activeSession))
    } else {
      localStorage.removeItem(SESSION_KEY)
    }
  }, [activeSession])

  const startSession = (type: 'study' | 'workout', options: { bucketId?: string; workoutType?: string } = {}) => {
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
  }

  // Calculate current session duration based on start time
  const getSessionDuration = () => {
    if (activeSession) {
      return Math.floor((Date.now() - new Date(activeSession.startedAt).getTime()) / 1000)
    }
    return 0
  }

  const recoverSession = () => {
    const data = localStorage.getItem(SESSION_KEY)
    if (!data) return

    try {
      const session = JSON.parse(data) as ActiveSession
      const ageHours = (Date.now() - new Date(session.startedAt).getTime()) / (1000 * 60 * 60)

      if (ageHours <= MAX_SESSION_AGE_HOURS) {
        setActiveSession(session)
      } else {
        localStorage.removeItem(SESSION_KEY)
      }
    } catch (error) {
      console.error('Failed to recover session:', error)
      localStorage.removeItem(SESSION_KEY)
    }
  }

  const clearExpiredSessions = () => {
    const data = localStorage.getItem(SESSION_KEY)
    if (data) {
      try {
        const session = JSON.parse(data) as ActiveSession
        const ageHours = (Date.now() - new Date(session.startedAt).getTime()) / (1000 * 60 * 60)

        if (ageHours > MAX_SESSION_AGE_HOURS) {
          localStorage.removeItem(SESSION_KEY)
          setActiveSession(null)
        }
      } catch (error) {
        console.error('Failed to check session expiration:', error)
        localStorage.removeItem(SESSION_KEY)
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
        clearExpiredSessions
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