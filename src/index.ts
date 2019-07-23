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
export type UseStore<T extends State> = <U>(
  selector?: StateSelector<T, U>,
  equalityFn?: EqualityChecker<U>
) => U
export interface StoreApi<T extends State> {
  setState: SetState<T>
  getState: GetState<T>
  subscribe: Subscribe<T>
  destroy: Destroy
}

const forceUpdateReducer = (state: boolean) => !state
// For server-side rendering: https://github.com/react-spring/zustand/pull/34
const useIsoLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect

export default function create<TState extends State>(
  createState: StateCreator<TState>
): [UseStore<TState>, StoreApi<TState>] {
  const listeners: Set<StateListener<void>> = new Set()

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
    listener: StateListener<StateSlice | void>,
    options: SubscribeOptions<TState, StateSlice> = {}
  ) => {
    if (!('currentSlice' in options)) {
      options.currentSlice = (options.selector || getState)(state)
    }
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
    listeners.add(listenerFn)
    return () => void listeners.delete(listenerFn)
  }

  const destroy: Destroy = () => listeners.clear()

  const useStore = <StateSlice>(
    selector: StateSelector<TState, StateSlice> = getState,
    equalityFn: EqualityChecker<StateSlice> = Object.is
  ): StateSlice => {
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
      }
    ).current as SubscribeOptions<TState, StateSlice>

    // Update state slice if selector has changed or subscriber errored.
    if (selector !== options.selector || options.subscribeError) {
      const newStateSlice = selector(state)
      if (!equalityFn(options.currentSlice as StateSlice, newStateSlice)) {
        options.currentSlice = newStateSlice
      }
    }

    useIsoLayoutEffect(() => {
      options.selector = selector
      options.equalityFn = equalityFn
      options.subscribeError = undefined
    })

    const forceUpdate = useReducer(forceUpdateReducer, false)[1]
    useIsoLayoutEffect(() => subscribe(forceUpdate, options), [])

    return options.currentSlice as StateSlice
  }

  const api = { setState, getState, subscribe, destroy }
  let state = createState(setState, getState, api)

  return [useStore, api]
}

export { create }
