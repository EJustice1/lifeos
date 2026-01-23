'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import {
  saveSessionMetadata,
  loadSessionMetadata,
  clearAllSessionData,
  saveSessionData,
  loadSessionData,
  validateSessionAge,
  type SessionMetadata,
} from '@/lib/utils/session-storage'

/**
 * Session status states following a state machine pattern
 */
export type SessionStatus = 'idle' | 'starting' | 'active' | 'ending' | 'recovering'

/**
 * Base session data interface that all session types must implement
 */
export interface BaseSessionData {
  id: string
  startedAt: string
}

/**
 * Options for configuring the unified session hook
 */
export interface UseUnifiedSessionOptions<TSession extends BaseSessionData, TStartData> {
  /** Session type identifier */
  type: 'workout' | 'study'
  
  /** Check database for active session */
  checkActiveSession: () => Promise<TSession | null>
  
  /** Server action to start a new session */
  onStart: (data: TStartData) => Promise<TSession>
  
  /** Server action to end the session */
  onEnd: (id: string, endedAt: string) => Promise<void>
  
  /** Optional: Server action to delete an empty/invalid session */
  onDelete?: (id: string) => Promise<void>
  
  /** Transform DB session to local session format */
  transformFromDb: (dbSession: any) => TSession
  
  /** Extract metadata for localStorage */
  getMetadata: (session: TSession) => Partial<SessionMetadata>
  
  /** Determine if session should be saved (e.g., has data) */
  shouldSaveSession?: (session: TSession) => boolean
}

/**
 * Return type for the unified session hook
 */
export interface UseUnifiedSessionReturn<TSession extends BaseSessionData, TStartData> {
  /** Current session data, null if no active session */
  session: TSession | null
  
  /** Current status of the session state machine */
  status: SessionStatus
  
  /** Error if any operation failed */
  error: Error | null
  
  /** Start a new session */
  startSession: (data: TStartData) => Promise<void>
  
  /** End the current session */
  endSession: () => Promise<{ saved: boolean }>
  
  /** Update the session data (for incremental changes) */
  updateSession: (updater: (prev: TSession) => TSession) => void
  
  /** Get the current session duration in seconds */
  getSessionDuration: () => number
  
  /** Restore session from database (for page load recovery) */
  restoreFromDatabase: (dbSession: any) => void
  
  /** Check if there's an active session */
  isActive: boolean
  
  /** Force sync with database (useful after potential race conditions) */
  syncWithDatabase: () => Promise<void>
}

/**
 * Backup state for atomic operations with rollback capability
 */
interface StateBackup<TSession> {
  session: TSession | null
  localStorage: {
    metadata: SessionMetadata | null
    data: any
  }
}

/**
 * Unified session hook that provides consistent session management
 * with a state machine approach and atomic operations to prevent race conditions.
 * 
 * The key insight is that we clear local state FIRST before the DB operation,
 * then rollback if the DB operation fails. This prevents the race condition where
 * the DB is updated but local state isn't cleared yet.
 */
export function useUnifiedSession<TSession extends BaseSessionData, TStartData = any>(
  options: UseUnifiedSessionOptions<TSession, TStartData>
): UseUnifiedSessionReturn<TSession, TStartData> {
  const {
    type,
    checkActiveSession,
    onStart,
    onEnd,
    onDelete,
    transformFromDb,
    getMetadata,
    shouldSaveSession = () => true,
  } = options

  const [session, setSession] = useState<TSession | null>(null)
  const [status, setStatus] = useState<SessionStatus>('idle')
  const [error, setError] = useState<Error | null>(null)
  
  // Ref to track if we've done initial recovery
  const hasRecovered = useRef(false)
  // Ref to prevent concurrent operations
  const operationInProgress = useRef(false)

  /**
   * Create a backup of current state for rollback
   */
  const createBackup = useCallback((): StateBackup<TSession> => {
    return {
      session,
      localStorage: {
        metadata: loadSessionMetadata(),
        data: loadSessionData(type),
      },
    }
  }, [session, type])

  /**
   * Restore state from backup (rollback)
   */
  const restoreFromBackup = useCallback((backup: StateBackup<TSession>) => {
    setSession(backup.session)
    
    if (backup.localStorage.metadata) {
      saveSessionMetadata(backup.localStorage.metadata)
      if (backup.localStorage.data) {
        saveSessionData(type, backup.localStorage.data)
      }
    }
  }, [type])

  /**
   * Clear all local state (session + localStorage)
   */
  const clearLocalState = useCallback(() => {
    setSession(null)
    clearAllSessionData()
  }, [])

  /**
   * Save session to localStorage
   */
  const persistToLocalStorage = useCallback((sessionData: TSession) => {
    const metadata: SessionMetadata = {
      type,
      startedAt: sessionData.startedAt,
      ...getMetadata(sessionData),
    }
    saveSessionMetadata(metadata)
    saveSessionData(type, sessionData)
  }, [type, getMetadata])

  /**
   * Recover session on mount - check localStorage and validate against DB
   */
  useEffect(() => {
    if (hasRecovered.current) return
    hasRecovered.current = true

    const recoverSession = async () => {
      setStatus('recovering')
      
      try {
        const metadata = loadSessionMetadata()
        
        // Check if we have a localStorage session of our type
        if (metadata && metadata.type === type) {
          const validation = validateSessionAge(metadata.startedAt)
          
          if (!validation.isValid || validation.isExpired) {
            // Stale session - clear it
            clearAllSessionData()
            setStatus('idle')
            return
          }

          // Validate against database
          const dbSession = await checkActiveSession()
          
          if (dbSession) {
            // DB has active session - use it as source of truth
            const transformed = transformFromDb(dbSession)
            setSession(transformed)
            persistToLocalStorage(transformed)
            setStatus('active')
          } else {
            // DB has no active session but localStorage does - localStorage is stale
            clearAllSessionData()
            setStatus('idle')
          }
        } else if (!metadata) {
          // No localStorage session - check DB in case session exists there
          const dbSession = await checkActiveSession()
          
          if (dbSession) {
            // DB has session but localStorage doesn't - restore it
            const transformed = transformFromDb(dbSession)
            setSession(transformed)
            persistToLocalStorage(transformed)
            setStatus('active')
          } else {
            setStatus('idle')
          }
        } else {
          // localStorage has a different session type - leave it alone
          setStatus('idle')
        }
      } catch (err) {
        console.error('Session recovery failed:', err)
        setError(err instanceof Error ? err : new Error('Session recovery failed'))
        setStatus('idle')
      }
    }

    recoverSession()
  }, [type, checkActiveSession, transformFromDb, persistToLocalStorage])

  /**
   * Start a new session
   * 
   * IMPORTANT: The server-side action (onStart) should handle ending any existing
   * active sessions before creating a new one to enforce single active session.
   */
  const startSession = useCallback(async (data: TStartData): Promise<void> => {
    if (operationInProgress.current) {
      throw new Error('Operation already in progress')
    }
    
    if (session) {
      throw new Error('Session already active in local state')
    }

    operationInProgress.current = true
    setStatus('starting')
    setError(null)

    try {
      // CRITICAL: onStart should check for and end any existing active sessions
      // in the database before creating a new one
      const newSession = await onStart(data)
      
      // Transform to local format
      const transformed = transformFromDb(newSession)
      
      // Update local state
      setSession(transformed)
      persistToLocalStorage(transformed)
      setStatus('active')
    } catch (err) {
      console.error('Failed to start session:', err)
      setError(err instanceof Error ? err : new Error('Failed to start session'))
      setStatus('idle')
      throw err
    } finally {
      operationInProgress.current = false
    }
  }, [session, onStart, transformFromDb, persistToLocalStorage])

  /**
   * End the current session with atomic state management
   * 
   * Key insight: We clear local state FIRST, then update DB.
   * If DB fails, we rollback local state.
   * This prevents the race condition where DB succeeds but local state
   * isn't cleared, causing a stale session to be detected.
   * 
   * IMPORTANT: This always ends the session, even if the operation is called
   * multiple times or if the session is already being ended.
   */
  const endSession = useCallback(async (): Promise<{ saved: boolean }> => {
    if (operationInProgress.current) {
      console.warn('End session operation already in progress, queuing...')
      // Wait a bit and try again (simple retry logic)
      await new Promise(resolve => setTimeout(resolve, 100))
      if (operationInProgress.current) {
        throw new Error('Operation already in progress')
      }
    }
    
    if (!session) {
      console.warn('No active session to end')
      return { saved: false }
    }

    operationInProgress.current = true
    setStatus('ending')
    setError(null)

    // Capture end time before any async operations
    const endedAt = new Date().toISOString()
    
    // Check if session should be saved
    const shouldSave = shouldSaveSession(session)
    
    // Create backup for potential rollback
    const backup = createBackup()
    
    // ATOMIC STEP 1: Clear local state first (optimistic)
    clearLocalState()

    try {
      if (shouldSave) {
        // ATOMIC STEP 2: Update database
        await onEnd(session.id, endedAt)
      } else {
        // Session shouldn't be saved - end it then delete it
        await onEnd(session.id, endedAt)
        if (onDelete) {
          await onDelete(session.id)
        }
      }
      
      // Success - local state already cleared
      setStatus('idle')
      return { saved: shouldSave }
    } catch (err) {
      // ATOMIC STEP 3: Rollback on failure ONLY if it's not a "session already ended" error
      const errorMessage = err instanceof Error ? err.message : String(err)
      
      if (errorMessage.includes('not found') || errorMessage.includes('already ended')) {
        // Session was already ended or doesn't exist - this is fine, clear local state
        console.warn('Session was already ended or not found:', errorMessage)
        setStatus('idle')
        return { saved: false }
      }
      
      // Real error - rollback
      console.error('Failed to end session, rolling back:', err)
      restoreFromBackup(backup)
      setError(err instanceof Error ? err : new Error('Failed to end session'))
      setStatus('active')
      throw err
    } finally {
      operationInProgress.current = false
    }
  }, [session, shouldSaveSession, createBackup, clearLocalState, onEnd, onDelete, restoreFromBackup])

  /**
   * Update session data (for incremental changes like logging sets)
   */
  const updateSession = useCallback((updater: (prev: TSession) => TSession) => {
    if (!session) return
    
    const updated = updater(session)
    setSession(updated)
    persistToLocalStorage(updated)
  }, [session, persistToLocalStorage])

  /**
   * Get current session duration in seconds
   */
  const getSessionDuration = useCallback((): number => {
    if (!session) return 0
    return Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000)
  }, [session])

  /**
   * Restore session from database data (for external recovery like page props)
   */
  const restoreFromDatabase = useCallback((dbSession: any) => {
    if (!dbSession || session) return
    
    const transformed = transformFromDb(dbSession)
    setSession(transformed)
    persistToLocalStorage(transformed)
    setStatus('active')
  }, [session, transformFromDb, persistToLocalStorage])

  /**
   * Force sync with database - useful after potential race conditions
   */
  const syncWithDatabase = useCallback(async (): Promise<void> => {
    if (operationInProgress.current) return
    
    try {
      const dbSession = await checkActiveSession()
      
      if (dbSession) {
        const transformed = transformFromDb(dbSession)
        setSession(transformed)
        persistToLocalStorage(transformed)
        setStatus('active')
      } else {
        clearLocalState()
        setStatus('idle')
      }
    } catch (err) {
      console.error('Failed to sync with database:', err)
      setError(err instanceof Error ? err : new Error('Failed to sync with database'))
    }
  }, [checkActiveSession, transformFromDb, persistToLocalStorage, clearLocalState])

  return {
    session,
    status,
    error,
    startSession,
    endSession,
    updateSession,
    getSessionDuration,
    restoreFromDatabase,
    isActive: session !== null && status === 'active',
    syncWithDatabase,
  }
}
