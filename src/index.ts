import { useEffect, useLayoutEffect, useReducer, useRef } from 'react'

export type State = Record<string | number | symbol, any>
export interface StateListener<T> {
  (state: T): void
  (state: null, error: Error): void
}
export type StateSelector<T extends State, U> = (state: T) => U
export type PartialState<T extends State> =
  | Partial<T>
  | ((state: T) => Partial<T>)
export type EqualityChecker<T> = (state: T, newState: any) => boolean
export interface UseStoreSubscribeOptions<T extends State, U> {
  selector: StateSelector<T, U>
  equalityFn: EqualityChecker<U>
  currentSlice: U
  listenerIndex: number
  subscribeError?: Error
}
export type SubscribeOptions<T extends State, U> = Partial<
  UseStoreSubscribeOptions<T, U>
>
export type StateCreator<T extends State> = (
  set: SetState<T>,
  get: GetState<T>,
  api: StoreApi<T>
) => T
export type SetState<T extends State> = (partial: PartialState<T>) => void
export type GetState<T extends State> = () => T
export type Subscribe<T extends State> = <U>(
  listener: StateListener<U>,
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

const forceUpdateReducer = (state: number) => state + 1
// For server-side rendering: https://github.com/react-spring/zustand/pull/34
const useIsoLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect

export default function create<TState extends State>(
  createState: StateCreator<TState>
): [UseStore<TState>, StoreApi<TState>] {
  // All listeners are wrapped in a function with the signature: () => void
  const listeners: (() => void)[] = []
  let state: TState
  let renderCount = 0

  // Returns an int for a component based on render order.
  function useRenderId() {
    const renderIdRef = useRef<number>()
    if (!renderIdRef.current) {
      renderIdRef.current = renderCount++
    }
    return renderIdRef.current
  }

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
    options: SubscribeOptions<TState, StateSlice> = {}
  ) => {
    if (!('currentSlice' in options)) {
      options.currentSlice = (options.selector || getState)(state)
    }
    // subscribe can be called externally without passing in a listenerIndex so
    // we need to assign it a default index.
    const { listenerIndex = renderCount++ } = options
    const listenerWrapper = () => {
      // Access the current values of the options object in listenerWrapper.
      // We rely on this because options is mutated in useStore.
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
        listener(null, error)
      }
    }
    listeners[listenerIndex] = listenerWrapper
    // Intentially using delete because shortening the length of the listeners
    // array would result in listenerIndex not accessing the correct listener.
    // This means listeners should be considered a sparce array.
    return () => delete listeners[listenerIndex]
  }

  const destroy: Destroy = () => (listeners.length = 0)

  const useStore = <StateSlice>(
    selector: StateSelector<TState, StateSlice> = getState,
    equalityFn: EqualityChecker<StateSlice> = Object.is
  ) => {
    const listenerIndex = useRenderId()
    const optionsRef = useRef<UseStoreSubscribeOptions<TState, StateSlice>>()
    if (!optionsRef.current) {
      optionsRef.current = {
        selector,
        equalityFn,
        currentSlice: selector(state),
        listenerIndex,
      }
    }
    const options = optionsRef.current

    // Update state slice if selector has changed or subscriber errored.
    if (selector !== options.selector || options.subscribeError) {
      const newStateSlice = selector(state)
      if (!equalityFn(options.currentSlice, newStateSlice)) {
        options.currentSlice = newStateSlice
      }
    }

    useIsoLayoutEffect(() => {
      options.selector = selector
      options.equalityFn = equalityFn
      options.subscribeError = undefined
    })

    const forceUpdate = useReducer(forceUpdateReducer, 0)[1]
    useIsoLayoutEffect(() => subscribe(forceUpdate, options), [])

    return options.currentSlice
  }

  const api = { setState, getState, subscribe, destroy }
  state = createState(setState, getState, api)

  return [useStore, api]
}

export { create }
