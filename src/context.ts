import React, {
  createContext as reactCreateContext,
  useContext,
  useRef,
} from 'react'
import { UseStore } from 'zustand'
import { EqualityChecker, State, StateSelector } from './vanilla'

function createContext<TState extends State>(initialState?: TState) {
  const ZustandContext = reactCreateContext<UseStore<TState> | undefined>(
    undefined
  )

  const Provider = ({
    initialStore,
    children,
  }: {
    initialStore: UseStore<TState>
    children: React.ReactNode
  }) => {
    const storeRef = useRef<UseStore<TState>>()

    if (!storeRef.current) {
      storeRef.current = initialStore
    }

    return React.createElement(
      ZustandContext.Provider,
      { value: storeRef.current },
      children
    )
  }

  const useStore = <StateSlice>(
    selector?: StateSelector<TState, StateSlice>,
    equalityFn: EqualityChecker<StateSlice> = Object.is
  ) => {
    // ZustandContext value is guaranteed to be stable.
    const useProviderStore = useContext(ZustandContext)
    if (!useProviderStore) {
      throw new Error(
        'Seems like you have not used zustand provider as an ancestor.'
      )
    }
    return useProviderStore(
      // FIXME: this type assertion seems unnecessary, as useStore does accept undefined.
      // Need to fix useStore()'s types
      selector as StateSelector<TState, StateSlice>,
      equalityFn
    )
  }

  return {
    Provider,
    useStore,
  }
}

export default createContext
