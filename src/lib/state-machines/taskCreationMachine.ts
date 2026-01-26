import type { StateConfig } from './types'

export type TaskCreationState = 'idle' | 'editing' | 'validating' | 'saving' | 'success' | 'error'
export type TaskCreationEvent = 'EDIT' | 'SUBMIT' | 'SUCCESS' | 'ERROR' | 'RESET'

export const taskCreationConfig: StateConfig<TaskCreationState, TaskCreationEvent> = {
  idle: {
    on: { EDIT: 'editing' }
  },
  editing: {
    on: {
      SUBMIT: 'validating',
      RESET: 'idle'
    }
  },
  validating: {
    on: {
      SUCCESS: 'saving',
      ERROR: 'error'
    }
  },
  saving: {
    on: {
      SUCCESS: 'success',
      ERROR: 'error'
    }
  },
  success: {
    on: { RESET: 'idle' }
  },
  error: {
    on: {
      EDIT: 'editing',
      RESET: 'idle'
    }
  }
}
