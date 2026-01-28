'use client'

import { useCallback, useRef, useEffect } from 'react'
import { useUnifiedSession, type BaseSessionData } from './useUnifiedSession'
import {
  startStudySession as startStudySessionAction,
  endStudySession as endStudySessionAction,
  deleteStudySession as deleteStudySessionAction,
  getActiveStudySession,
} from '@/lib/actions/study'

export interface StudySessionData extends BaseSessionData {
  sessionId: string
  projectId: string
  elapsedSeconds: number
  notes: string
  startedAt: string
}

export interface UseStudySessionReturn {
  activeSession: StudySessionData | null
  startSession: (projectId: string) => Promise<void>
  updateTimer: (seconds: number) => void
  updateNotes: (notes: string) => void
  endSession: (notes?: string) => Promise<{ saved: boolean }>
  isSessionActive: boolean
  getSessionDuration: () => number
  /** Session status for UI feedback */
  status: 'idle' | 'starting' | 'active' | 'ending' | 'recovering'
  /** Sync with database (useful after potential stale state) */
  syncWithDatabase: () => Promise<void>
}

// Minimum session duration to save (60 seconds = 1 minute)
const MIN_SESSION_DURATION_SECONDS = 60

/**
 * Transform database study session to local session format
 */
function transformDbSession(dbSession: any): StudySessionData {
  return {
    id: dbSession.id,
    sessionId: dbSession.id,
    projectId: dbSession.project_id,
    elapsedSeconds: 0, // Will be calculated from startedAt
    notes: dbSession.notes || '',
    startedAt: dbSession.started_at,
  }
}

export function useStudySession(): UseStudySessionReturn {
  const updateTimerDebounceRef = useRef<NodeJS.Timeout | null>(null)
  const notesRef = useRef<string>('')

  const {
    session: activeSession,
    status,
    startSession: unifiedStartSession,
    endSession: unifiedEndSession,
    updateSession,
    getSessionDuration,
    isActive,
    syncWithDatabase,
  } = useUnifiedSession<StudySessionData, string>({
    type: 'study',
    
    // Check database for active study session
    checkActiveSession: async () => {
      const dbSession = await getActiveStudySession()
      return dbSession
    },
    
    // Start a new study session in the database
    onStart: async (projectId: string) => {
      const session = await startStudySessionAction(projectId)
      return session
    },
    
    // End study session in database
    onEnd: async (sessionId: string, endedAt: string) => {
      await endStudySessionAction(sessionId, notesRef.current || undefined, endedAt)
    },
    
    // Delete short study session
    onDelete: async (sessionId: string) => {
      await deleteStudySessionAction(sessionId)
    },
    
    // Transform DB format to local format
    transformFromDb: transformDbSession,
    
    // Extract metadata for localStorage
    getMetadata: (session) => ({
      sessionId: session.sessionId,
      projectId: session.projectId,
    }),
    
    // Only save if session is at least 1 minute long
    shouldSaveSession: (session) => {
      const durationSeconds = Math.floor(
        (Date.now() - new Date(session.startedAt).getTime()) / 1000
      )
      return durationSeconds >= MIN_SESSION_DURATION_SECONDS
    },
  })

  // Keep notesRef in sync with session notes
  useEffect(() => {
    if (activeSession) {
      notesRef.current = activeSession.notes || ''
    }
  }, [activeSession?.notes])

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (updateTimerDebounceRef.current) {
        clearTimeout(updateTimerDebounceRef.current)
      }
    }
  }, [])

  /**
   * Start a new study session
   */
  const startSession = useCallback(async (projectId: string) => {
    await unifiedStartSession(projectId)
  }, [unifiedStartSession])

  /**
   * Update the timer (debounced localStorage updates)
   */
  const updateTimer = useCallback(
    (seconds: number) => {
      if (!activeSession) return

      // Update local state immediately
      updateSession((prev) => ({
        ...prev,
        elapsedSeconds: seconds,
      }))

      // Debounce localStorage updates (every 5 seconds)
      if (updateTimerDebounceRef.current) {
        clearTimeout(updateTimerDebounceRef.current)
      }

      updateTimerDebounceRef.current = setTimeout(() => {
        // The updateSession call above already handles persistence
      }, 5000)
    },
    [activeSession, updateSession]
  )

  /**
   * Update session notes
   */
  const updateNotes = useCallback(
    (notes: string) => {
      if (!activeSession) return

      notesRef.current = notes
      updateSession((prev) => ({
        ...prev,
        notes,
      }))
    },
    [activeSession, updateSession]
  )

  /**
   * End the current study session
   * Uses atomic operations from useUnifiedSession to prevent race conditions
   */
  const endSession = useCallback(
    async (notes?: string): Promise<{ saved: boolean }> => {
      // Flush any pending timer updates
      if (updateTimerDebounceRef.current) {
        clearTimeout(updateTimerDebounceRef.current)
        updateTimerDebounceRef.current = null
      }

      // Update notes ref if provided
      if (notes !== undefined) {
        notesRef.current = notes
      }

      return unifiedEndSession()
    },
    [unifiedEndSession]
  )

  return {
    activeSession,
    startSession,
    updateTimer,
    updateNotes,
    endSession,
    isSessionActive: isActive,
    getSessionDuration,
    status,
    syncWithDatabase,
  }
}
