import { useEffect, useLayoutEffect, useReducer, useRef } from 'react'

export type State = Record<string | number | symbol, any>
export type PartialState<T extends State> =
  | Partial<T>
  | ((state: T) => Partial<T>)
  | ((state: T) => void) // for immer https://github.com/react-spring/zustand/pull/99
export type StateSelector<T extends State, U> = (state: T) => U
export type EqualityChecker<T> = (state: T, newState: any) => boolean

export type StateListener<T> = (state: T | null, error?: Error) => void
export type Subscribe<T extends State> = <U>(
  listener: StateListener<U>,
  selector?: StateSelector<T, U>,
  equalityFn?: EqualityChecker<U>
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
  /*
  setState: SetState<T>
  getState: GetState<T>
  subscribe: Subscribe<T>
  destroy: Destroy
  useStore: UseStore<T> // This allows namespace pattern
  */
}

// For server-side rendering: https://github.com/react-spring/zustand/pull/34
const useIsoLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect

export default function create<TState extends State>(
  createState: StateCreator<TState>
): [UseStore<TState>, StoreApi<TState>] {
  let state: TState
  let listeners: Set<() => void> = new Set()

  const setState: SetState<TState> = (partial, replace) => {
    const nextState = typeof partial === 'function' ? partial(state) : partial

    if (nextState !== state) {
      if (replace) {
        state = nextState as TState
      } else {
        state = Object.assign({}, state, nextState)
      }
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

  const useStore: UseStore<TState> = <StateSlice>(
    selector: StateSelector<TState, StateSlice> = getState,
    equalityFn: EqualityChecker<StateSlice> = Object.is
  ) => {
    const forceUpdate: React.Dispatch<unknown> = useReducer(c => c + 1, 0)[1]
    const subscriberRef = useRef<{
      currentSlice: StateSlice
      equalityFn: EqualityChecker<StateSlice>
      errored: boolean
      listener: StateListener<StateSlice>
      selector: StateSelector<TState, StateSlice>
      unsubscribe: () => void
    }>()

    if (!subscriberRef.current) {
      subscriberRef.current = {
        currentSlice: selector(state),
        equalityFn,
        errored: false,
        listener: () => {},
        selector,
        unsubscribe: () => {},
      }
      const subscriber = subscriberRef.current
      subscriberRef.current.listener = (
        nextSlice: StateSlice | null,
        error?: Error
      ) => {
        if (error) {
          subscriber.errored = true
        } else {
          subscriber.currentSlice = nextSlice as StateSlice
        }
        forceUpdate(undefined)
      }
      subscriberRef.current.unsubscribe = subscribe(
        subscriber.listener,
        subscriber.selector,
        subscriber.equalityFn
      )
    }

    const subscriber = subscriberRef.current
    let newStateSlice: StateSlice | undefined
    let hasNewStateSlice = false

    // The selector or equalityFn need to be called during the render phase if
    // they change. We also want legitimate errors to be visible so we re-run
    // them if they errored in the subscriber.
    if (
      subscriber.selector !== selector ||
      subscriber.equalityFn !== equalityFn ||
      subscriber.errored
    ) {
      // Using local variables to avoid mutations in the render phase.
      newStateSlice = selector(state)
      hasNewStateSlice = !equalityFn(subscriber.currentSlice, newStateSlice)
    }

    // Syncing changes in useEffect.
    useIsoLayoutEffect(() => {
      if (hasNewStateSlice) {
        subscriber.currentSlice = newStateSlice as StateSlice
      }
      subscriber.errored = false
      if (
        subscriber.selector !== selector ||
        subscriber.equalityFn !== equalityFn
      ) {
        subscriber.unsubscribe()
        subscriber.selector = selector
        subscriber.equalityFn = equalityFn
        subscriber.unsubscribe = subscribe(
          subscriber.listener,
          subscriber.selector,
          subscriber.equalityFn
        )
      }
    })

    useIsoLayoutEffect(() => subscriber.unsubscribe, [])

    return hasNewStateSlice
      ? (newStateSlice as StateSlice)
      : subscriber.currentSlice
  }

  const api = { setState, getState, subscribe, destroy }
  state = createState(setState, getState, api)

  return [useStore, api]
}

export { create }
