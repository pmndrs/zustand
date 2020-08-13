import { useEffect, useLayoutEffect, useReducer, useRef } from 'react'

export type State = Record<string | number | symbol, any>
export type PartialState<T extends State> =
  | Partial<T>
  | ((state: T) => Partial<T>)
export type StateCreator<T extends State> = (
  set: SetState<T>,
  get: GetState<T>,
  api: StoreApi<T>
) => T
export type StateSelector<T extends State, U> = (state: T) => U
export type StateListener<T> = (state: T | null, error?: Error) => void
export type SetState<T extends State> = (
  next: PartialState<T>,
  replace?: boolean
) => void
export type GetState<T extends State> = () => T
export interface Subscriber<T extends State, U> {
  currentSlice: U
  equalityFn: EqualityChecker<U>
  errored: boolean
  listener: StateListener<U>
  selector: StateSelector<T, U>
  unsubscribe: () => void
}
export type Subscribe<T extends State> = <U>(
  subscriber: Subscriber<T, U>
) => () => void
export type ApiSubscribe<T extends State> = <U>(
  listener: StateListener<U>,
  selector?: StateSelector<T, U>,
  equalityFn?: EqualityChecker<U>
) => () => void
export type EqualityChecker<T> = (state: T, newState: any) => boolean
export type Destroy = () => void
export interface UseStore<T extends State> {
  (): T
  <U>(selector: StateSelector<T, U>, equalityFn?: EqualityChecker<U>): U
}
export interface StoreApi<T extends State> {
  setState: SetState<T>
  getState: GetState<T>
  subscribe: ApiSubscribe<T>
  destroy: Destroy
}

// For server-side rendering: https://github.com/react-spring/zustand/pull/34
const useIsoLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect

export default function create<TState extends State>(
  createState: StateCreator<TState>
): [UseStore<TState>, StoreApi<TState>] {
  let state: TState
  let listeners: Set<() => void> = new Set()

  const setState: SetState<TState> = (next, replace) => {
    const nextState = typeof next === 'function' ? next(state) : next

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

  const getSubscriber = <StateSlice>(
    listener: StateListener<StateSlice>,
    selector: StateSelector<TState, StateSlice> = getState,
    equalityFn: EqualityChecker<StateSlice> = Object.is
  ): Subscriber<TState, StateSlice> => ({
    currentSlice: selector(state),
    equalityFn,
    errored: false,
    listener,
    selector,
    unsubscribe: () => {},
  })

  const subscribe: Subscribe<TState> = <StateSlice>(
    subscriber: Subscriber<TState, StateSlice>
  ) => {
    function listener() {
      // Selector or equality function could throw but we don't want to stop
      // the listener from being called.
      // https://github.com/react-spring/zustand/pull/37
      try {
        const newStateSlice = subscriber.selector(state)
        if (!subscriber.equalityFn(subscriber.currentSlice, newStateSlice)) {
          subscriber.listener((subscriber.currentSlice = newStateSlice))
        }
      } catch (error) {
        subscriber.errored = true
        subscriber.listener(null, error)
      }
    }

    listeners.add(listener)

    return () => {
      listeners.delete(listener)
    }
  }

  const apiSubscribe: ApiSubscribe<TState> = <StateSlice>(
    listener: StateListener<StateSlice>,
    selector?: StateSelector<TState, StateSlice>,
    equalityFn?: EqualityChecker<StateSlice>
  ) => subscribe(getSubscriber(listener, selector, equalityFn))

  const destroy: Destroy = () => listeners.clear()

  const useStore: UseStore<TState> = <StateSlice>(
    selector: StateSelector<TState, StateSlice> = getState,
    equalityFn: EqualityChecker<StateSlice> = Object.is
  ) => {
    const forceUpdate: StateListener<StateSlice> = useReducer(c => c + 1, 0)[1]
    const subscriberRef = useRef<Subscriber<TState, StateSlice>>()

    if (!subscriberRef.current) {
      subscriberRef.current = getSubscriber(forceUpdate, selector, equalityFn)
      subscriberRef.current.unsubscribe = subscribe(subscriberRef.current)
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
      subscriber.selector = selector
      subscriber.equalityFn = equalityFn
      subscriber.errored = false
    })

    useIsoLayoutEffect(() => subscriber.unsubscribe, [])

    return hasNewStateSlice
      ? (newStateSlice as StateSlice)
      : subscriber.currentSlice
  }

  const api = { setState, getState, subscribe: apiSubscribe, destroy }
  state = createState(setState, getState, api)

  return [useStore, api]
}

export { create }
