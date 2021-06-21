import {
  ReactNode,
  createElement,
  createContext as reactCreateContext,
  useContext,
  useRef,
} from 'react'
import { UseStore } from 'zustand'
import { EqualityChecker, State, StateSelector } from './vanilla'

function createContext<TState extends State>() {
  const ZustandContext = reactCreateContext<UseStore<TState> | undefined>(
    undefined
  )

  const Provider = ({
    initialStore,
    children,
  }: {
    initialStore: UseStore<TState>
    children: ReactNode
  }) => {
    // Put store (hook) in ref to make it stable
    const storeRef = useRef(initialStore)
    return createElement(
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
      selector as StateSelector<TState, StateSlice>,
      equalityFn
    )
  }

  const useStoreApi = () => {
    // ZustandContext value is guaranteed to be stable.
    const useProviderStore = useContext(ZustandContext)
    if (!useProviderStore) {
      throw new Error(
        'Seems like you have not used zustand provider as an ancestor.'
      )
    }
    return {
      getState: useProviderStore.getState,
      setState: useProviderStore.setState,
      subscribe: useProviderStore.subscribe,
      destroy: useProviderStore.destroy,
    }
  }

  return {
    Provider,
    useStore,
    useStoreApi,
  }
}

export default createContext
