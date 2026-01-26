'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import type { StateMachine, StateConfig } from './types'

export function useMachine<TState extends string, TEvent extends string, TContext = any>(
  config: StateConfig<TState, TEvent>,
  initialState: TState,
  initialContext: TContext
): StateMachine<TState, TEvent, TContext> {
  const [state, setState] = useState<TState>(initialState)
  const [context, setContext] = useState<TContext>(initialContext)
  const prevStateRef = useRef<TState>(initialState)

  // Run entry/exit effects when state changes
  useEffect(() => {
    const prevState = prevStateRef.current
    const currentState = state

    if (prevState !== currentState) {
      // Run exit effect for previous state
      const prevConfig = config[prevState]
      if (prevConfig?.exit) {
        prevConfig.exit()
      }

      // Run entry effect for current state
      const currentConfig = config[currentState]
      if (currentConfig?.entry) {
        currentConfig.entry()
      }

      prevStateRef.current = currentState
    }
  }, [state, config])

  const can = useCallback(
    (event: TEvent): boolean => {
      const currentConfig = config[state]
      return currentConfig?.on?.[event] !== undefined
    },
    [state, config]
  )

  const transition = useCallback(
    (event: TEvent) => {
      const currentConfig = config[state]
      const nextState = currentConfig?.on?.[event]

      if (nextState) {
        setState(nextState as TState)
      } else {
        console.warn(`No transition from state "${state}" for event "${event}"`)
      }
    },
    [state, config]
  )

  return {
    state,
    context,
    transition,
    can,
  }
}
