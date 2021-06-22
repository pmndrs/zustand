import {
  ReactNode,
  createElement,
  createContext as reactCreateContext,
  useContext,
  useMemo,
  useRef,
} from 'react'
import { UseStore } from 'zustand'
import { EqualityChecker, State, StateSelector } from './vanilla'

function createContext<TState extends State>() {
  const ZustandContext = reactCreateContext<UseStore<TState> | undefined>(
    undefined
  )

  const Provider = ({
    // @ts-expect-error deprecated
    initialStore,
    createStore,
    children,
  }: {
    createStore: () => UseStore<TState>
    children: ReactNode
  }) => {
    const storeRef = useRef<UseStore<TState>>()

    if (!storeRef.current) {
      if (initialStore) {
        console.warn(
          'Provider initialStore is deprecated and will be removed in the next version.'
        )
        if (!createStore) {
          createStore = () => initialStore
        }
      }
      storeRef.current = createStore()
    }

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
    return useMemo(
      () => ({
        getState: useProviderStore.getState,
        setState: useProviderStore.setState,
        subscribe: useProviderStore.subscribe,
        destroy: useProviderStore.destroy,
      }),
      [useProviderStore]
    )
  }

  return {
    Provider,
    useStore,
    useStoreApi,
  }
}

export default createContext
