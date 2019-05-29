import { useCallback, useLayoutEffect, useReducer, useRef } from 'react'
import shallowEqual from './shallowEqual'

export type StateListener<T> = (state: T) => void
export type StateSelector<T, U> = (state: T) => U
export type PartialState<T> = Partial<T> | ((state: T) => Partial<T>)

export type State = Record<string, any>
export type SetState<T> = (partialState: PartialState<T>) => void
export type GetState<T> = () => T

export type UseStore<T> = {
  (): T
  <U>(selector: StateSelector<T, U>, dependencies?: ReadonlyArray<any>): U
}

export interface StoreApi<T> {
  getState: GetState<T>
  setState: SetState<T>
  subscribe: (listener: StateListener<T>) => () => void
  destroy: () => void
}

const reducer = <T>(state: any, newState: T) => newState

export default function create<
  TState extends State,
  TSetState extends SetState<TState> = SetState<TState>,
  TGetState extends GetState<TState> = GetState<TState>
>(
  createState: (set: TSetState, get: TGetState) => TState
): [UseStore<TState>, StoreApi<TState>] {
  const listeners: Set<StateListener<TState>> = new Set()

  const setState = (partialState: PartialState<TState>) => {
    state = Object.assign(
      {},
      state,
      typeof partialState === 'function' ? partialState(state) : partialState
    )
    listeners.forEach(listener => listener(state))
  }

  const getState = () => state

  const subscribe = (listener: StateListener<TState>) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }

  const destroy = () => {
    listeners.clear()
    state = {} as TState
  }

  function useStore(): TState
  function useStore<U>(
    selector: StateSelector<TState, U>,
    dependencies?: ReadonlyArray<any>
  ): U
  function useStore<U>(
    selector?: StateSelector<TState, U>,
    dependencies?: ReadonlyArray<any>
  ) {
    // State selector gets entire state if no selector was passed in
    const stateSelector = typeof selector === 'function' ? selector : getState
    const selectState = useCallback(
      stateSelector,
      dependencies as ReadonlyArray<any>
    )
    const selectStateRef = useRef(selectState)
    let [stateSlice, dispatch] = useReducer(reducer, state, selectState)

    // Call new selector if it has changed
    if (selectState !== selectStateRef.current) stateSlice = selectState(state)

    // Store in ref to enable updating without rerunning subscribe/unsubscribe
    const stateSliceRef = useRef(stateSlice)

    // Update refs only after view has been updated
    useLayoutEffect(() => {
      selectStateRef.current = selectState
      stateSliceRef.current = stateSlice
    }, [selectState, stateSlice])

    // Subscribe/unsubscribe to the store only on mount/unmount
    useLayoutEffect(() => {
      return subscribe(() => {
        // Use the last selector passed to useStore to get current state slice
        const selectedSlice = selectStateRef.current(state)
        // Shallow compare previous state slice with current and rerender only if changed
        if (!shallowEqual(stateSliceRef.current, selectedSlice))
          dispatch(selectedSlice)
      })
    }, [])

    return stateSlice
  }

  let state = createState(setState as TSetState, getState as TGetState)
  const api = { destroy, getState, setState, subscribe }

  return [useStore, api] as [typeof useStore, typeof api]
}
