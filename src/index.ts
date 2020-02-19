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
export type SetState<T extends State> = (partial: PartialState<T>) => void
export type GetState<T extends State> = () => T
export interface Subscriber<T extends State, U> {
  callback: () => void
  currentSlice: U
  equalityFn: EqualityChecker<U>
  errored: boolean
  index: number
  listener: StateListener<U>
  selector: StateSelector<T, U>
}
export type Subscribe<T extends State> = <U>(
  subscriber: Subscriber<T, U>
) => void
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
  let subscribers: Subscriber<TState, any>[] = []
  let subscriberCount = 0

  const setState: SetState<TState> = partial => {
    const partialState =
      typeof partial === 'function' ? partial(state) : partial
    if (partialState !== state) {
      state = Object.assign({}, state, partialState)
      subscribers.forEach(subscriber => subscriber.callback())
    }
  }

  const getState: GetState<TState> = () => state

  const getSubscriber = <StateSlice>(
    listener: StateListener<StateSlice>,
    selector: StateSelector<TState, StateSlice> = getState,
    equalityFn: EqualityChecker<StateSlice> = Object.is
  ): Subscriber<TState, StateSlice> => ({
    callback: () => {},
    currentSlice: selector(state),
    equalityFn,
    errored: false,
    index: subscriberCount++,
    listener,
    selector,
  })

  const subscribe: Subscribe<TState> = <StateSlice>(
    subscriber: Subscriber<TState, StateSlice>
  ) => {
    subscriber.callback = () => {
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
    // subscriber.index is set during the render phase in order to store the
    // subscibers in a top-down order. The subscribers array will become a
    // sparse array when an index is skipped (due to an interrupted render) or
    // a component unmounts and the subscriber is deleted. It's converted back
    // to a dense array when a subscriber unsubscribes.
    subscribers[subscriber.index] = subscriber
  }

  const makeUnsubscribeFn = <StateSlice>(
    subscriber: Subscriber<TState, StateSlice>
  ) => () => {
    // Reset subscriberCount because we will be removing holes from the
    // subscribers array and changing the length which should be the same as
    // subscriberCount.
    subscriberCount = 0
    // Create a dense array by removing holes from the subscribers array.
    // Holes are not iterated by Array.prototype.filter.
    subscribers = subscribers.filter(s => {
      if (s !== subscriber) {
        s.index = subscriberCount++
        return true
      }
    })
  }

  const apiSubscribe: ApiSubscribe<TState> = <StateSlice>(
    listener: StateListener<StateSlice>,
    selector?: StateSelector<TState, StateSlice>,
    equalityFn?: EqualityChecker<StateSlice>
  ) => {
    const subscriber = getSubscriber(listener, selector, equalityFn)
    subscribe(subscriber)
    return makeUnsubscribeFn(subscriber)
  }

  const destroy: Destroy = () => (subscribers = [])

  const useStore: UseStore<TState> = <StateSlice>(
    selector: StateSelector<TState, StateSlice> = getState,
    equalityFn: EqualityChecker<StateSlice> = Object.is
  ) => {
    const forceUpdate: StateListener<StateSlice> = useReducer(c => c + 1, 0)[1]
    const subscriberRef = useRef<Subscriber<TState, StateSlice>>()

    if (!subscriberRef.current) {
      subscriberRef.current = getSubscriber(forceUpdate, selector, equalityFn)
      subscribe(subscriberRef.current)
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

    useIsoLayoutEffect(() => makeUnsubscribeFn(subscriber), [])

    return hasNewStateSlice
      ? (newStateSlice as StateSlice)
      : subscriber.currentSlice
  }

  const api = { setState, getState, subscribe: apiSubscribe, destroy }
  state = createState(setState, getState, api)

  return [useStore, api]
}

export { create }
