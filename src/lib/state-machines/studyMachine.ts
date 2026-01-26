import type { StateConfig } from './types'

// Study session states
export type StudyState = 
  | 'idle'           // No active session
  | 'selecting'      // Selecting bucket/subject
  | 'timing'         // Timer running
  | 'entering_manual'// Entering manual session data
  | 'stopping'       // Ending session
  | 'reviewing'      // Reviewing completed session
  | 'saving'         // Saving review data
  | 'complete'       // Session complete

// Study session events
export type StudyEvent =
  | 'SELECT_BUCKET'
  | 'START_TIMER'
  | 'ENTER_MANUAL'
  | 'STOP_TIMER'
  | 'CANCEL'
  | 'SUBMIT_MANUAL'
  | 'START_REVIEW'
  | 'SAVE_REVIEW'
  | 'SKIP_REVIEW'
  | 'SUCCESS'
  | 'ERROR'
  | 'RESET'

export interface StudyContext {
  bucketId?: string
  sessionId?: string
  duration?: number
  notes?: string
  effortRating?: number
  focusRating?: number
  failureTags?: string[]
  error?: string
}

export const studyConfig: Record<StudyState, {
  on: Partial<Record<StudyEvent, StudyState>>
  entry?: (context: StudyContext) => void | Promise<void>
  exit?: (context: StudyContext) => void | Promise<void>
}> = {
  idle: {
    on: {
      SELECT_BUCKET: 'selecting',
    },
  },
  selecting: {
    on: {
      START_TIMER: 'timing',
      ENTER_MANUAL: 'entering_manual',
      CANCEL: 'idle',
    },
  },
  timing: {
    on: {
      STOP_TIMER: 'stopping',
      CANCEL: 'idle',
    },
    entry: (context) => {
      console.log('Timer started for bucket:', context.bucketId)
    },
  },
  entering_manual: {
    on: {
      SUBMIT_MANUAL: 'stopping',
      CANCEL: 'idle',
    },
  },
  stopping: {
    on: {
      START_REVIEW: 'reviewing',
      SKIP_REVIEW: 'complete',
      ERROR: 'idle',
    },
    entry: async (context) => {
      // Session end logic handled by server actions
      console.log('Ending session:', context.sessionId)
    },
  },
  reviewing: {
    on: {
      SAVE_REVIEW: 'saving',
      SKIP_REVIEW: 'complete',
      CANCEL: 'idle',
    },
  },
  saving: {
    on: {
      SUCCESS: 'complete',
      ERROR: 'reviewing',
    },
    entry: async (context) => {
      console.log('Saving review:', {
        sessionId: context.sessionId,
        effort: context.effortRating,
        focus: context.focusRating,
      })
    },
  },
  complete: {
    on: {
      RESET: 'idle',
    },
    entry: (context) => {
      console.log('Study session complete')
    },
  },
}
