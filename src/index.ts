import React from 'react'
import shallowEqual from './shallowEqual'

type StateListener<T> = (state: T) => void
type StateSelector<T, U> = (state: T) => U
type PartialState<T> = Partial<T> | ((state: T) => Partial<T>)

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
  function useStore<U>(selector: StateSelector<State, U>): U
  function useStore<U>(selector?: StateSelector<State, U>) {
    // Gets entire state if no selector was passed in
    const selectState = typeof selector === 'function' ? selector : getState
    // Using functional initial b/c selected itself could be a function
    const [stateSlice, setStateSlice] = React.useState(() => selectState(state))
    // Prevent useEffect from needing to run when values change by storing them in a ref object
    const refs = React.useRef({ stateSlice, selectState }).current

    if (refs.stateSlice !== stateSlice) refs.stateSlice = stateSlice
    if (refs.selectState !== selectState) refs.selectState = selectState

    React.useEffect(() => {
      return subscribe(() => {
        // Get fresh selected state
        const selected = refs.selectState(state)
        if (!shallowEqual(refs.stateSlice, selected))
          // Refresh local slice, functional initial b/c selected itself could be a function
          setStateSlice(() => selected)
      })
    }, [])

    // Returning the selected state slice
    return stateSlice
  }

  let state = createState(setState as SetState, getState as GetState)
  const api = { destroy, getState, setState, subscribe }
  const result: [typeof useStore, typeof api] = [useStore, api]

  return result
}
