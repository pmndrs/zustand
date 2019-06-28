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
  // Use TState for createState signature when available.
  // e.g. create<MyState>(set => ...
  createState: keyof TState extends never
    ? StateCreator<State>
    : StateCreator<TState>
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
        console.error(error)
        listener()
      }
    }
    listeners.add(listenerFn)
    return () => void listeners.delete(listenerFn)
  }

  const destroy: Destroy = () => listeners.clear()

  const useStore = <StateSlice>(
    selector: StateSelector<TState, StateSlice> = getState,
    equalityFn?: EqualityChecker<StateSlice>
  ): StateSlice => {
    const isInitial = useRef(true)
    const options = useRef(
      // isInitial prevents the selector from being called every render.
      isInitial.current && {
        selector,
        equalityFn,
        currentSlice: ((isInitial.current = false), selector(state)),
      }
    ).current as SubscribeOptions<TState, StateSlice>

    // Update state slice if selector has changed.
    if (selector !== options.selector) options.currentSlice = selector(state)

    const forceUpdate = useReducer(forceUpdateReducer, false)[1]

    useIsoLayoutEffect(() => {
      options.selector = selector
      options.equalityFn = equalityFn
    }, [selector, equalityFn])

    useIsoLayoutEffect(() => subscribe(forceUpdate, options), [])

    return options.currentSlice as StateSlice
  }

  const api = { setState, getState, subscribe, destroy }
  let state = createState(setState, getState, api)

  return [useStore, api]
}
