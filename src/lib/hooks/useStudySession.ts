'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from '@/context/SessionContext'
import {
  startStudySession as startStudySessionAction,
  endStudySession as endStudySessionAction,
  deleteStudySession as deleteStudySessionAction,
} from '@/lib/actions/study'

export interface StudySessionData {
  sessionId: string
  bucketId: string
  elapsedSeconds: number
  notes: string
  startedAt: string
}

export interface UseStudySessionReturn {
  activeSession: StudySessionData | null
  startSession: (bucketId: string) => Promise<void>
  updateTimer: (seconds: number) => void
  updateNotes: (notes: string) => void
  endSession: (notes?: string) => Promise<{ saved: boolean }>
  isSessionActive: boolean
  getSessionDuration: () => number
}

export function useStudySession(): UseStudySessionReturn {
  const {
    activeSession,
    startSession: startContextSession,
    endSession: endContextSession,
    updateSessionData,
    getSessionDuration,
  } = useSession()

  const [localActiveSession, setLocalActiveSession] = useState<StudySessionData | null>(null)
  const updateTimerDebounceRef = useRef<NodeJS.Timeout | null>(null)

  // Sync with SessionContext on mount and when activeSession changes
  useEffect(() => {
    if (activeSession?.type === 'study' && activeSession.sessionId) {
      const studyData: StudySessionData = {
        sessionId: activeSession.sessionId,
        bucketId: activeSession.bucketId || '',
        elapsedSeconds: activeSession.sessionData?.elapsedSeconds || 0,
        notes: activeSession.sessionData?.notes || '',
        startedAt: activeSession.startedAt,
      }
      setLocalActiveSession(studyData)
    } else {
      setLocalActiveSession(null)
    }
  }, [activeSession])

  const startSession = useCallback(
    async (bucketId: string) => {
      try {
        // Create study session in database
        const session = await startStudySessionAction(bucketId)

        // Initialize session data
        const initialData: StudySessionData = {
          sessionId: session.id,
          bucketId,
          elapsedSeconds: 0,
          notes: '',
          startedAt: new Date().toISOString(),
        }

        // Start session in context with initial data
        startContextSession('study', {
          bucketId,
          sessionId: session.id,
          sessionData: initialData,
        })

        setLocalActiveSession(initialData)
      } catch (error) {
        console.error('Failed to start study session:', error)
        throw error
      }
    },
    [startContextSession]
  )

  const updateTimer = useCallback(
    (seconds: number) => {
      if (!localActiveSession) return

      const updatedSession: StudySessionData = {
        ...localActiveSession,
        elapsedSeconds: seconds,
      }

      // Update local state immediately
      setLocalActiveSession(updatedSession)

      // Debounce localStorage updates (every 5 seconds)
      if (updateTimerDebounceRef.current) {
        clearTimeout(updateTimerDebounceRef.current)
      }

      updateTimerDebounceRef.current = setTimeout(() => {
        updateSessionData(updatedSession)
      }, 5000)
    },
    [localActiveSession, updateSessionData]
  )

  const updateNotes = useCallback(
    (notes: string) => {
      if (!localActiveSession) return

      const updatedSession: StudySessionData = {
        ...localActiveSession,
        notes,
      }

      setLocalActiveSession(updatedSession)
      updateSessionData(updatedSession)
    },
    [localActiveSession, updateSessionData]
  )

  const endSession = useCallback(
    async (notes?: string): Promise<{ saved: boolean }> => {
      if (!localActiveSession) {
        throw new Error('No active session')
      }

      // Calculate actual elapsed time from start time (don't rely on debounced elapsedSeconds)
      const actualElapsedSeconds = Math.floor(
        (Date.now() - new Date(localActiveSession.startedAt).getTime()) / 1000
      )

      // Flush any pending timer updates
      if (updateTimerDebounceRef.current) {
        clearTimeout(updateTimerDebounceRef.current)
        updateTimerDebounceRef.current = null
      }

      // Capture exact end time on client (before network delay)
      const endedAt = new Date().toISOString()

      // Don't save if less than 1 minute (60 seconds) - delete the session entry
      if (actualElapsedSeconds < 60) {
        try {
          // First mark session as ended (so it's not detected as active anymore)
          // Then delete it from database
          await endStudySessionAction(localActiveSession.sessionId, notes, endedAt)
          await deleteStudySessionAction(localActiveSession.sessionId)
        } catch (error) {
          console.error('Failed to end/delete short study session:', error)
          // Continue anyway to clear local state
        }
        
        // Clear session (no banner)
        endContextSession()
        setLocalActiveSession(null)
        return { saved: false } // Indicate no data was saved
      }

      try {
        // End session in database with client timestamp
        await endStudySessionAction(localActiveSession.sessionId, notes, endedAt)

        // Clear session
        endContextSession()
        setLocalActiveSession(null)

        return { saved: true } // Indicate data was saved successfully
      } catch (error) {
        console.error('Failed to end study session:', error)
        throw error
      }
    },
    [localActiveSession, endContextSession]
  )

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (updateTimerDebounceRef.current) {
        clearTimeout(updateTimerDebounceRef.current)
      }
    }
  }, [])

  return {
    activeSession: localActiveSession,
    startSession,
    updateTimer,
    updateNotes,
    endSession,
    isSessionActive: localActiveSession !== null,
    getSessionDuration,
  }
}
