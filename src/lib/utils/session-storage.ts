/**
 * Session Storage Utility
 * Provides localStorage wrappers for session management with validation and error handling
 */

const SESSION_METADATA_KEY = 'lifeos_active_session'
const SESSION_DATA_PREFIX = 'lifeos_session_data_'
const MAX_SESSION_AGE_HOURS = 24

export interface SessionMetadata {
  type: 'study' | 'workout'
  startedAt: string
  bucketId?: string
  workoutType?: string
  workoutId?: string
  sessionId?: string
}

export interface SessionValidation {
  isValid: boolean
  isExpired: boolean
  ageHours: number
}

/**
 * Save session metadata to localStorage
 */
export function saveSessionMetadata(metadata: SessionMetadata): void {
  try {
    localStorage.setItem(SESSION_METADATA_KEY, JSON.stringify(metadata))
  } catch (error) {
    console.error('Failed to save session metadata:', error)
    throw new Error('Failed to save session metadata')
  }
}

/**
 * Load session metadata from localStorage with validation
 */
export function loadSessionMetadata(): SessionMetadata | null {
  try {
    const data = localStorage.getItem(SESSION_METADATA_KEY)
    if (!data) return null

    const metadata = JSON.parse(data) as SessionMetadata
    return metadata
  } catch (error) {
    console.error('Failed to load session metadata:', error)
    // Clear corrupted data
    clearSessionMetadata()
    return null
  }
}

/**
 * Validate session age and expiration
 */
export function validateSessionAge(startedAt: string): SessionValidation {
  const ageMs = Date.now() - new Date(startedAt).getTime()
  const ageHours = ageMs / (1000 * 60 * 60)
  const isExpired = ageHours > MAX_SESSION_AGE_HOURS
  const isValid = ageHours >= 0 && ageHours <= MAX_SESSION_AGE_HOURS

  return {
    isValid,
    isExpired,
    ageHours,
  }
}

/**
 * Clear session metadata from localStorage
 */
export function clearSessionMetadata(): void {
  try {
    localStorage.removeItem(SESSION_METADATA_KEY)
  } catch (error) {
    console.error('Failed to clear session metadata:', error)
  }
}

/**
 * Save module-specific session data to localStorage
 */
export function saveSessionData<T>(type: 'study' | 'workout', data: T): void {
  try {
    const key = `${SESSION_DATA_PREFIX}${type}`
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.error(`Failed to save ${type} session data:`, error)
    // Check if quota exceeded
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn('localStorage quota exceeded. Session data may be too large.')
    }
    throw new Error(`Failed to save ${type} session data`)
  }
}

/**
 * Load module-specific session data from localStorage
 */
export function loadSessionData<T>(type: 'study' | 'workout'): T | null {
  try {
    const key = `${SESSION_DATA_PREFIX}${type}`
    const data = localStorage.getItem(key)
    if (!data) return null

    return JSON.parse(data) as T
  } catch (error) {
    console.error(`Failed to load ${type} session data:`, error)
    // Clear corrupted data
    clearSessionData(type)
    return null
  }
}

/**
 * Clear module-specific session data from localStorage
 */
export function clearSessionData(type: 'study' | 'workout'): void {
  try {
    const key = `${SESSION_DATA_PREFIX}${type}`
    localStorage.removeItem(key)
  } catch (error) {
    console.error(`Failed to clear ${type} session data:`, error)
  }
}

/**
 * Clear all session-related data (metadata + all module data)
 */
export function clearAllSessionData(): void {
  clearSessionMetadata()
  clearSessionData('workout')
  clearSessionData('study')
}

/**
 * Get the size of session data in localStorage (for debugging)
 */
export function getSessionDataSize(): { metadata: number; workout: number; study: number; total: number } {
  const getItemSize = (key: string): number => {
    const item = localStorage.getItem(key)
    return item ? new Blob([item]).size : 0
  }

  const metadata = getItemSize(SESSION_METADATA_KEY)
  const workout = getItemSize(`${SESSION_DATA_PREFIX}workout`)
  const study = getItemSize(`${SESSION_DATA_PREFIX}study`)

  return {
    metadata,
    workout,
    study,
    total: metadata + workout + study,
  }
}
