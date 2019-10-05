import { useEffect, useLayoutEffect, useReducer, useRef } from 'react'

export type State = Record<string | number | symbol, any>
export type StateListener<T> = (state: T) => void
export type StateSelector<T extends State, U> = (state: T) => U
export type PartialState<T extends State> =
  | Partial<T>
  | ((state: T) => Partial<T>)
export type EqualityChecker<T> = (state: T, newState: any) => boolean
export interface SubscribeOptions<T extends State, U> {
  selector?: StateSelector<T, U>
  equalityFn?: EqualityChecker<U>
  currentSlice?: U
  subscribeError?: Error
  listenerIndex?: string
}
export type StateCreator<T extends State> = (
  set: SetState<T>,
  get: GetState<T>,
  api: StoreApi<T>
) => T
export type SetState<T extends State> = (partial: PartialState<T>) => void
export type GetState<T extends State> = () => T
export type Subscribe<T extends State> = <U>(
  listener: StateListener<U | void>,
  options?: SubscribeOptions<T, U>
) => () => void
export type Destroy = () => void
export interface UseStore<T extends State> {
  (): T
  <U>(selector: StateSelector<T, U>, equalityFn?: EqualityChecker<U>): U
}
export interface StoreApi<T extends State> {
  setState: SetState<T>
  getState: GetState<T>
  subscribe: Subscribe<T>
  destroy: Destroy
}

// For using symbols as indexers: https://github.com/Microsoft/TypeScript/issues/24587
const getOwnPropertySymbols = (Object.getOwnPropertySymbols as unknown) as (
  o: any
) => string[]
const forceUpdateReducer = (state: number) => state + 1
// For server-side rendering: https://github.com/react-spring/zustand/pull/34
const useIsoLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect

export default function create<TState extends State>(
  createState: StateCreator<TState>
): [UseStore<TState>, StoreApi<TState>] {
  let state: TState
  let listeners: Record<string, StateListener<void> | null> = {}

  const setState: SetState<TState> = partial => {
    const partialState =
      typeof partial === 'function' ? partial(state) : partial
    if (partialState !== state) {
      state = Object.assign({}, state, partialState)
      // listeners is an object to ensure enumeration order.
      // Parent component's listeners must be called before their children's.
      // https://github.com/react-spring/zustand/issues/64
      getOwnPropertySymbols(listeners).forEach(listenerIndex => {
        const listener = listeners[listenerIndex]
        if (listener) listener()
      })
    }
  }

  const getState: GetState<TState> = () => state

  const subscribe: Subscribe<TState> = <StateSlice>(
    listener: StateListener<StateSlice | void>,
    options: SubscribeOptions<TState, StateSlice> = {}
  ) => {
    if (!('currentSlice' in options)) {
      options.currentSlice = (options.selector || getState)(state)
    }
    // options.listenerIndex is not mutable to ensure the correct listener is removed on cleanup.
    const { listenerIndex = (Symbol() as unknown) as string } = options
    const listenerFn = () => {
      // Destructure in the listener to get current values. We rely on this
      // because options is mutated in useStore.
      const { selector = getState, equalityFn = Object.is } = options
      // Selector or equality function could throw but we don't want to stop
      // the listener from being called.
      // https://github.com/react-spring/zustand/pull/37
      try {
        const newStateSlice = selector(state)
        if (!equalityFn(options.currentSlice as StateSlice, newStateSlice)) {
          listener((options.currentSlice = newStateSlice))
        }
      } catch (error) {
        options.subscribeError = error
        listener()
      }
    }
    listeners[listenerIndex] = listenerFn
    return () => void delete listeners[listenerIndex]
  }

  const destroy: Destroy = () => (listeners = {})

  const useStore = <StateSlice>(
    selector: StateSelector<TState, StateSlice> = getState,
    equalityFn: EqualityChecker<StateSlice> = Object.is
  ) => {
    if (Array.isArray(equalityFn)) {
      equalityFn = Object.is
      console.warn(
        'Zustand: the 2nd arg for dependencies was deprecated in 1.0. Please remove it! See: https://github.com/react-spring/zustand#selecting-multiple-state-slices'
      )
    }

    const isInitial = useRef(true)
    const options = useRef(
      // isInitial prevents the selector from being called every render.
      isInitial.current && {
        selector,
        equalityFn,
        currentSlice: ((isInitial.current = false), selector(state)),
        listenerIndex: (Symbol() as unknown) as string,
      }
    ).current as SubscribeOptions<TState, StateSlice>

    // Update state slice if selector has changed or subscriber errored.
    if (selector !== options.selector || options.subscribeError) {
      const newStateSlice = selector(state)
      if (!equalityFn(options.currentSlice as StateSlice, newStateSlice)) {
        options.currentSlice = newStateSlice
      }
    }

    // An object's keys are enumerated by insertion order.
    // Insert a key for the listener during the component's render phase.
    // This ensures the listeners are ordered based on the render order (parent to child).
    // If we did not do this, the listeners would be inserted in useEffect.
    // useEffect call order seems to be reversed (child effects are called before the parent's).
    const listenerIndex = options.listenerIndex as string
    if (!(listenerIndex in listeners)) {
      listeners[listenerIndex] = null
    }

    useIsoLayoutEffect(() => {
      options.selector = selector
      options.equalityFn = equalityFn
      options.subscribeError = undefined
    })

    const forceUpdate = useReducer(forceUpdateReducer, 1)[1]
    useIsoLayoutEffect(() => subscribe(forceUpdate, options), [])

    return options.currentSlice
  }

  const api = { setState, getState, subscribe, destroy }
  state = createState(setState, getState, api)

  return [useStore, api]
}

export { create }
