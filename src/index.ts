import { useEffect, useLayoutEffect, useReducer, useRef } from 'react'
import shallowEqual from './shallowEqual'
import { redux, devtools } from './middleware'

export type State = Record<string | number | symbol, any>
export type StateListener<T extends State, U = T> = (state: U) => void
export type StateSelector<T extends State, U> = (state: T) => U
export type PartialState<T extends State> =
  | Partial<T>
  | ((state: T) => Partial<T>)
export type SetState<T extends State> = (partial: PartialState<T>) => void
export type GetState<T extends State> = () => T

export interface Subscribe<T> {
  (listener: StateListener<T>): () => void
  <U>(selector: StateSelector<T, U>, listener: StateListener<T, U>): () => void
  <U>(
    selector: StateSelector<T, U>,
    listener: StateListener<T, U>,
    equalityFn: Function | undefined
  ): () => void
}
export interface UseStore<T> {
  (): T
  <U>(selector: StateSelector<T, U>, equalityFn?: Function): U
}
export interface StoreApi<T> {
  getState: GetState<T>
  setState: SetState<T>
  subscribe: Subscribe<T>
  destroy: () => void
}

const reducer = <T>(state: any, newState: T) => newState
const useIsoLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect

export default function create<TState extends State>(
  createState: keyof TState extends never
    ? (set: any, get: any, api: any) => TState
    : (set: SetState<TState>, get: GetState<TState>, api: any) => TState
): [UseStore<TState>, StoreApi<TState>] {
  const listeners: Set<StateListener<TState>> = new Set()

  const setState: SetState<TState> = partial => {
    const partialState =
      typeof partial === 'function' ? partial(state) : partial
    if (partialState !== state) {
      state = Object.assign({}, state, partialState)
      listeners.forEach(listener => listener(state))
    }
  }

  const getState: GetState<TState> = () => state

  // Optional selector param goes first so we can infer its return type and use
  // it for listener
  const subscribe: Subscribe<TState> = <TStateSlice>(
    selectorOrListener:
      | StateListener<TState>
      | StateSelector<TState, TStateSlice>,
    listenerOrUndef?: StateListener<TState, TStateSlice>,
    equalityFn?: Function
  ) => {
    let listener = selectorOrListener
    // Existance of second param means a selector was passed in
    if (listenerOrUndef) {
      // We know selector is not type StateListener so it must be StateSelector
      const selector = selectorOrListener as StateSelector<TState, TStateSlice>
      let stateSlice = selector(state)
      listener = () => {
        try {
          const sel = selector(state)
          const old = stateSlice
          // Update local state slice
          stateSlice = sel
          // Test for changes
          const equal = equalityFn ? equalityFn(old, sel) : old === sel
          // Call listeners if state has changed
          if (!equal) listenerOrUndef(stateSlice)
        } catch {}
      }
    }
    listeners.add(listener)
    return () => void listeners.delete(listener)
  }

  const destroy: StoreApi<TState>['destroy'] = () => {
    listeners.clear()
  }

  const useStore: UseStore<TState> = <TStateSlice>(
    selector?: StateSelector<TState, TStateSlice>,
    equalityFn?: Function
  ): TState | TStateSlice => {
    const selRef = useRef(selector)
    let [stateSlice, dispatch] = useReducer(
      reducer,
      state,
      // Optional third argument but required to not be 'undefined'
      selector as StateSelector<TState, TStateSlice>
    )

    // Need to manually get state slice if selector has changed with no deps or
    // deps exist and have changed
    if (selector && selector !== selRef.current) stateSlice = selector(state)

    // Update refs synchronously after view has been updated
    useIsoLayoutEffect(() => void (selRef.current = selector), [selector])

    // Subscribe to the store
    useIsoLayoutEffect(() => {
      return selector
        ? subscribe(
            // Truthy check because it might be possible to set selRef to
            // undefined and call this subscriber before it resubscribes
            () => (selRef.current ? selRef.current(state) : state),
            dispatch,
            equalityFn
          )
        : subscribe(dispatch)
      // Only resubscribe to the store when changing selector from function to
      // undefined or undefined to function
    }, [!selector])

    return stateSlice
  }

  let api = { destroy, getState, setState, subscribe }
  let state = createState(setState, getState, api)

  return [useStore, api]
}

export { shallowEqual, redux, devtools }
