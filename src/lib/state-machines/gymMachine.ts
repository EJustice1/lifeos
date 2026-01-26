import type { StateConfig } from './types'

export type GymState = 'idle' | 'selecting_type' | 'active' | 'logging' | 'ending' | 'reviewing'
export type GymEvent = 'SELECT_TYPE' | 'START' | 'LOG_SET' | 'END' | 'REVIEW' | 'COMPLETE' | 'CANCEL'

export const gymConfig: StateConfig<GymState, GymEvent> = {
  idle: {
    on: { SELECT_TYPE: 'selecting_type' }
  },
  selecting_type: {
    on: {
      START: 'active',
      CANCEL: 'idle'
    }
  },
  active: {
    on: {
      LOG_SET: 'logging',
      END: 'ending',
      CANCEL: 'idle'
    }
  },
  logging: {
    on: {
      COMPLETE: 'active',
      END: 'ending'
    }
  },
  ending: {
    on: {
      REVIEW: 'reviewing',
      CANCEL: 'active'
    }
  },
  reviewing: {
    on: {
      COMPLETE: 'idle'
    }
  }
}
