import React, { createContext, useContext, useRef } from 'react'
import create, { UseStore } from './index'
import { EqualityChecker, State, StateCreator, StateSelector } from './vanilla'

function createZustand<TState extends State>(initialState?: TState) {
  const ZustandContext = createContext<UseStore<TState> | undefined>(undefined)

  const Provider = ({
    createState,
    children,
  }: {
    createState: StateCreator<TState>
    children: React.ReactNode
  }) => {
    const storeRef = useRef() as React.MutableRefObject<UseStore<TState>>

    if (!storeRef.current) {
      storeRef.current = create(createState)
    }

    return React.createElement(
      ZustandContext.Provider,
      { value: storeRef.current },
      children
    )
  }

  const useZustand = <StateSlice>(
    selector: StateSelector<TState, StateSlice>,
    eqlFn: EqualityChecker<StateSlice> = Object.is
  ) => {
    // ZustandContext value is guaranteed to be stable.
    const useStore = useContext(ZustandContext)
    if (!useStore) {
      throw new Error(
        'Seems like you have not used zustand provider as an ancestor.'
      )
    }
    return useStore(selector, eqlFn)
  }

  return {
    Provider,
    useZustand,
  }
}

export default createZustand

export const { Provider, useZustand } = createZustand({})
