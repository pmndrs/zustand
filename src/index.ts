import { useEffect, useLayoutEffect, useReducer, useRef } from 'react'

export type State = Record<string | number | symbol, any>
export type PartialState<T extends State> =
  | Partial<T>
  | ((state: T) => Partial<T>)
  | ((state: T) => void) // for immer https://github.com/react-spring/zustand/pull/99
export type StateSelector<T extends State, U> = (state: T) => U
export type EqualityChecker<T> = (state: T, newState: any) => boolean

export type StateListener<T> = (state: T) => void
export type Subscribe<T extends State> = (
  listener: StateListener<T>
) => () => void
export type SetState<T extends State> = (
  partial: PartialState<T>,
  replace?: boolean
) => void
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
  setState: SetState<T>
  getState: GetState<T>
  subscribe: Subscribe<T>
  destroy: Destroy
  useStore: UseStore<T> // This allows namespace pattern
}

// For server-side rendering: https://github.com/react-spring/zustand/pull/34
const useIsoLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect

export default function create<TState extends State>(
  createState: StateCreator<TState>
): UseStore<TState> {
  let state: TState
  const listeners: Set<StateListener<TState>> = new Set()

  const setState: SetState<TState> = (partial, replace) => {
    const nextState = typeof partial === 'function' ? partial(state) : partial

    if (nextState !== state) {
      if (replace) {
        state = nextState as TState
      } else {
        state = Object.assign({}, state, nextState)
      }
      listeners.forEach(listener => listener(state))
    }
  }

  const getState: GetState<TState> = () => state

  const subscribe: Subscribe<TState> = (listener: StateListener<TState>) => {
    listeners.add(listener)
    const unsubscribe = () => {
      listeners.delete(listener)
    }
    return unsubscribe
  }

  const destroy: Destroy = () => listeners.clear()

  const useStore: any = <StateSlice>(
    selector: StateSelector<TState, StateSlice> = getState,
    equalityFn: EqualityChecker<StateSlice> = Object.is
  ) => {
    const forceUpdate = useReducer(c => c + 1, 0)[1] as () => void
    const currentSliceRef = useRef<StateSlice>()
    const selectorRef = useRef(selector)
    const equalityFnRef = useRef(equalityFn)
    const erroredRef = useRef(false)

    if (currentSliceRef.current === undefined) {
      currentSliceRef.current = selector(state)
    }

    let newStateSlice: StateSlice | undefined
    let hasNewStateSlice = false

    // The selector or equalityFn need to be called during the render phase if
    // they change. We also want legitimate errors to be visible so we re-run
    // them if they errored in the subscriber.
    if (
      selectorRef.current !== selector ||
      equalityFnRef.current !== equalityFn ||
      erroredRef.current
    ) {
      // Using local variables to avoid mutations in the render phase.
      newStateSlice = selector(state)
      hasNewStateSlice = !equalityFn(
        currentSliceRef.current as StateSlice,
        newStateSlice
      )
    }

    // Syncing changes in useEffect.
    useIsoLayoutEffect(() => {
      if (hasNewStateSlice) {
        currentSliceRef.current = newStateSlice as StateSlice
      }
      selectorRef.current = selector
      equalityFnRef.current = equalityFn
      erroredRef.current = false
    })

    useIsoLayoutEffect(() => {
      const listener = () => {
        try {
          const nextStateSlice = selectorRef.current(state)
          if (
            !equalityFnRef.current(
              currentSliceRef.current as StateSlice,
              nextStateSlice
            )
          ) {
            currentSliceRef.current = nextStateSlice
            forceUpdate()
          }
        } catch (error) {
          erroredRef.current = true
          forceUpdate()
        }
      }
      const unsubscribe = subscribe(listener)
      return unsubscribe
    }, [])

    return hasNewStateSlice
      ? (newStateSlice as StateSlice)
      : currentSliceRef.current
  }

  const api = { setState, getState, subscribe, destroy }
  state = createState(setState, getState, api)

  Object.assign(useStore, api, { useStore })

  // For backward compatibility (No TS types for this)
  useStore[Symbol.iterator] = function*() {
    console.warn('Tuple API is deprecated in v3 and will be removed in v4')
    yield useStore
    yield api
  }

  return useStore
}

export { create }
