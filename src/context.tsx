import React, { createContext, useContext, useRef, useEffect } from 'react'
import { EqualityChecker, State, StateCreator, StateSelector } from './vanilla'
import create, { UseStore } from './index'

const ZustandContext = createContext<UseStore<State> | undefined>(undefined)

export const Provider = <TState extends State>({
  createState,
  children,
}: {
  createState: StateCreator<TState>
  children: React.ReactNode
}) => {
  const storeRef = useRef() as React.MutableRefObject<UseStore<TState>>

  let createdFirstTime = false
  if (!storeRef.current) {
    storeRef.current = create(createState)
    createdFirstTime = true
  }

  // handle store property change
  // TODO: decide whether to use useEffect or useIsomorphicLayoutEffect
  useEffect(() => {
    if (!createdFirstTime) {
      storeRef.current = create(createState)
    }
  }, [createState])

  // TODO: I don't like this type assertion
  const Provider = (ZustandContext.Provider as unknown) as React.Provider<
    UseStore<TState>
  >
  return <Provider value={storeRef.current}>{children}</Provider>
}

export const useZustand = <TState extends State, StateSlice>(
  selector: StateSelector<TState, StateSlice>,
  eqlFn: EqualityChecker<StateSlice> = Object.is
) => {
  // ZustandContext value is guaranteed to be stable.
  // TODO: I don't like this type assertion
  const useStore = useContext(ZustandContext) as UseStore<TState> | undefined
  if (!useStore) {
    // TODO: decide.. throw? or console.error() and return Error()?
    throw new Error(
      'Seems like you have not used zustand provider as an ancestor.'
    )
  }
  return useStore(selector, eqlFn)
}
