import {
  ReactNode,
  createElement,
  createContext as reactCreateContext,
  useContext,
  useMemo,
  useRef,
} from 'react'
import { EqualityChecker, UseBoundStore } from 'zustand'
import { State, StateSelector } from './vanilla'

export interface UseContextStore<T extends State> {
  (): T
  <U>(selector: StateSelector<T, U>, equalityFn?: EqualityChecker<U>): U
}

function createContext<TState extends State>() {
  const ZustandContext = reactCreateContext<UseBoundStore<TState> | undefined>(
    undefined
  )

  const Provider = ({
    initialStore,
    createStore,
    children,
  }: {
    /**
     * @deprecated
     */
    initialStore?: UseBoundStore<TState>
    createStore: () => UseBoundStore<TState>
    children: ReactNode
  }) => {
    const storeRef = useRef<UseBoundStore<TState>>()

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

  const useStore: UseContextStore<TState> = <StateSlice>(
    selector?: StateSelector<TState, StateSlice>,
    equalityFn = Object.is
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
