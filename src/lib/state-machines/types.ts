export type StateMachine<TState extends string, TEvent extends string, TContext = any> = {
  state: TState
  context: TContext
  transition: (event: TEvent) => void
  can: (event: TEvent) => boolean
}

export type StateConfig<TState extends string, TEvent extends string> = {
  [K in TState]: {
    on: Partial<Record<TEvent, TState>>
    entry?: () => void
    exit?: () => void
  }
}
