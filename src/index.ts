import {
  useCallback,
  useMemo,
  // @ts-ignore
  unstable_createMutableSource as createMutableSource,
  // @ts-ignore
  unstable_useMutableSource as useMutableSource,
} from 'react'

export type State = Record<string | number | symbol, any>
export type PartialState<T extends State> =
  | Partial<T>
  | ((state: T) => Partial<T>)
export type StateSelector<T extends State, U> = (state: T) => U
export type EqualityChecker<T> = (state: T, newState: any) => boolean

export type StateListener<T> = (state: T | null, error?: Error) => void
export type Subscribe<T extends State> = <U>(
  listener: StateListener<U>,
  selector?: StateSelector<T, U>,
  equalityFn?: EqualityChecker<U>
) => () => void
export type SetState<T extends State> = (partial: PartialState<T>) => void
export type GetState<T extends State> = () => T
export type Destroy = () => void
export interface StoreApi<T extends State> {
  setState: SetState<T>
  getState: GetState<T>
  subscribe: Subscribe<T>
  destroy: Destroy
}
export type StateCreator<T extends State> = (
  set: SetState<T>,
  get: GetState<T>,
  api: StoreApi<T>
) => T

export interface UseStore<T extends State> {
  (): T
  <U>(selector: StateSelector<T, U>, equalityFn?: EqualityChecker<U>): U
}

export default function create<TState extends State>(
  createState: StateCreator<TState>
): [UseStore<TState>, StoreApi<TState>] {
  let state: TState
  let listeners: Set<() => void> = new Set()

  const setState: SetState<TState> = partial => {
    const partialState =
      typeof partial === 'function' ? partial(state) : partial
    if (partialState !== state) {
      state = Object.assign({}, state, partialState)
      listeners.forEach(listener => listener())
    }
  }

  const getState: GetState<TState> = () => state

  const subscribe: Subscribe<TState> = <StateSlice>(
    listener: StateListener<StateSlice>,
    selector: StateSelector<TState, StateSlice> = getState,
    equalityFn: EqualityChecker<StateSlice> = Object.is
  ) => {
    let currentSlice: StateSlice = selector(state)
    function listenerToAdd() {
      // Selector or equality function could throw but we don't want to stop
      // the listener from being called.
      // https://github.com/react-spring/zustand/pull/37
      try {
        const newStateSlice = selector(state)
        if (!equalityFn(currentSlice, newStateSlice)) {
          listener((currentSlice = newStateSlice))
        }
      } catch (error) {
        listener(null, error)
      }
    }
    listeners.add(listenerToAdd)
    const unsubscribe = () => {
      listeners.delete(listenerToAdd)
    }
    return unsubscribe
  }

  const destroy: Destroy = () => listeners.clear()

  // The first param can be anything stable
  const source = createMutableSource(getState, () => state)

  const FUNCTION_SYNBOL = Symbol()
  const functionMap = new WeakMap<Function, { [FUNCTION_SYNBOL]: Function }>()

  const useStore: UseStore<TState> = <StateSlice>(
    selector: StateSelector<TState, StateSlice> = getState,
    equalityFn: EqualityChecker<StateSlice> = Object.is
  ) => {
    // cache to avoid double invoking selector
    const cachedSlices = useMemo(() => new WeakMap<TState, StateSlice>(), [
      selector,
      equalityFn,
    ])
    const sub = useCallback(
      (_, callback) => {
        const listener = (nextSlice: StateSlice | null, error?: Error) => {
          if (!error) {
            cachedSlices.set(state, nextSlice as StateSlice)
          }
          callback()
        }
        return subscribe(listener, selector, equalityFn)
      },
      [selector, equalityFn]
    )
    const getSnapshot = useCallback(() => {
      const slice = cachedSlices.has(state)
        ? (cachedSlices.get(state) as StateSlice)
        : selector(state)
      // https://github.com/facebook/react/issues/18823
      if (typeof slice === 'function') {
        if (functionMap.has(slice)) {
          return functionMap.get(slice)
        }
        const wrappedFunction = { [FUNCTION_SYNBOL]: slice }
        functionMap.set(slice, wrappedFunction)
        return wrappedFunction
      }
      return slice
    }, [selector])
    const snapshot = useMutableSource(source, getSnapshot, sub)
    if (
      snapshot &&
      (snapshot as { [FUNCTION_SYNBOL]: unknown })[FUNCTION_SYNBOL]
    ) {
      return snapshot[FUNCTION_SYNBOL]
    }
    return snapshot
  }

  const api = { setState, getState, subscribe, destroy }
  state = createState(setState, getState, api)

  return [useStore, api]
}

export { create }
