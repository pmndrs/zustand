import type { StateCreator, StoreMutatorIdentifier } from '../vanilla.ts'

type History = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
>(
  initializer: StateCreator<
    T,
    [...Mps, ['zustand/history', never]],
    Mcs
  >,
  options?: {
    maxHistorySize?: number
    includeActions?: boolean
  }
) => StateCreator<T, Mps, [['zustand/history', never], ...Mcs]>

type Write<T, U> = Omit<T, keyof U> & U

type WithHistorySubscribe<S> = S extends { getState: () => infer T }
  ? Write<S, StoreHistory<T>>
  : never

declare module '../vanilla' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface StoreMutators<S, A> {
    ['zustand/history']: WithHistorySubscribe<S>
  }
}

type HistoryEntry<T> = {
  state: T
  timestamp: number
  action?: string
}

type StoreHistory<T> = {
  history: {
    past: HistoryEntry<T>[]
    present: T
    future: HistoryEntry<T>[]
    canUndo: boolean
    canRedo: boolean
    undo: () => void
    redo: () => void
    clearHistory: () => void
    getHistory: () => {
      past: HistoryEntry<T>[]
      present: T
      future: HistoryEntry<T>[]
    }
  }
}

type HistoryImpl = <T extends object>(
  storeInitializer: StateCreator<T, [], []>,
  options?: {
    maxHistorySize?: number
    includeActions?: boolean
  }
) => StateCreator<T, [], []>

const historyImpl: HistoryImpl = (fn, options = {}) => (set, get, api) => {
  const { maxHistorySize = 50, includeActions = false } = options
  
  let past: HistoryEntry<ReturnType<typeof fn>>[] = []
  let future: HistoryEntry<ReturnType<typeof fn>>[] = []
  let isUndoing = false
  let isRedoing = false

  const createHistoryEntry = (state: ReturnType<typeof fn>, action?: string): HistoryEntry<ReturnType<typeof fn>> => {
    // Extract only the original state properties, excluding the history object
    const { history: _, ...stateWithoutHistory } = state as any
    return {
      state: JSON.parse(JSON.stringify(stateWithoutHistory)), // Deep clone without history
      timestamp: Date.now(),
      ...(includeActions && action ? { action } : {}),
    }
  }

  const addToHistory = (state: ReturnType<typeof fn>, action?: string) => {
    if (isUndoing || isRedoing) return

    const entry = createHistoryEntry(state, action)
    past.push(entry)

    // Limit history size
    if (past.length > maxHistorySize) {
      past = past.slice(-maxHistorySize)
    }

    // Clear future when new action is performed
    future = []
  }

  const undo = () => {
    if (past.length <= 1) return

    isUndoing = true
    const current = past.pop()!
    future.unshift(current)
    
    const previousState = past[past.length - 1].state
    set(previousState, true)
    isUndoing = false
  }

  const redo = () => {
    if (future.length === 0) return

    isRedoing = true
    const next = future.shift()!
    past.push(next)
    
    set(next.state, true)
    isRedoing = false
  }

  const clearHistory = () => {
    const currentState = api.getState()
    const { history: _, ...stateWithoutHistory } = currentState as any
    past = [createHistoryEntry(stateWithoutHistory as ReturnType<typeof fn>)]
    future = []
  }

  const getHistory = () => ({
    past: [...past],
    present: api.getState(),
    future: [...future],
  })

  // Create a custom set function that tracks history
  const setWithHistory = (partial: any, replace?: boolean) => {
    set(partial, replace)
    
    if (!isUndoing && !isRedoing) {
      const newState = api.getState()
      addToHistory(newState)
    }
  }

  const initialState = fn(setWithHistory, get, api)
  
  // Add initial state to history
  past.push(createHistoryEntry(initialState))

  // Create history object
  const historyObject = {
    get past() { return [...past] },
    get present() { return api.getState() },
    get future() { return [...future] },
    get canUndo() { return past.length > 1 },
    get canRedo() { return future.length > 0 },
    undo,
    redo,
    clearHistory,
    getHistory,
  }

  // Add history methods to the store
  const storeWithHistory = {
    ...initialState,
    history: historyObject,
  }

  // Override the API's getState to always return the store with history
  const originalGetState = api.getState
  api.getState = () => storeWithHistory

  return storeWithHistory
}

export const history = historyImpl as unknown as History
