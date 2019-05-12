import { useCallback, useLayoutEffect, useReducer, useRef } from 'react'
import shallowEqual from './shallowEqual'

type StateListener<T> = (state: T) => void
type StateSelector<T, U> = (state: T) => U
type PartialState<T> = Partial<T> | ((state: T) => Partial<T>)

const reducer = <T>(state: any, newState: T) => newState

export default function create<
  State extends Record<string, any>,
  SetState extends (partialState: PartialState<Record<string, any>>) => void,
  GetState extends () => Record<string, any>
>(createState: (set: SetState, get: GetState) => State) {
  const listeners: Set<StateListener<State>> = new Set()

  const setState = (partialState: PartialState<State>) => {
    state = Object.assign(
      {},
      state,
      typeof partialState === 'function' ? partialState(state) : partialState
    )
    listeners.forEach(listener => listener(state))
  }

  const getState = () => state

  const subscribe = (listener: StateListener<State>) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }

  const destroy = () => {
    listeners.clear()
    state = {} as State
  }

  function useStore(): State
  function useStore<U>(
    selector: StateSelector<State, U>,
    dependencies?: ReadonlyArray<any>
  ): U
  function useStore<U>(
    selector?: StateSelector<State, U>,
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

  let state = createState(setState as SetState, getState as GetState)
  const api = { destroy, getState, setState, subscribe }

  return [useStore, api] as [typeof useStore, typeof api]
}
