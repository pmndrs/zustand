import {
  ReactNode,
  createElement,
  createContext as reactCreateContext,
  useContext,
  useMemo,
  useRef,
} from 'react'
import { EqualityChecker, State, StateSelector, UseBoundStore } from 'zustand'

/**
 * @deprecated Use `typeof MyContext.useStore` instead.
 */
export type UseContextStore<T extends State> = {
  (): T
  <U>(selector: StateSelector<T, U>, equalityFn?: EqualityChecker<U>): U
}

function createContext<
  TState extends State,
  TUseBoundStore extends UseBoundStore<TState> = UseBoundStore<TState>
>() {
  const ZustandContext = reactCreateContext<TUseBoundStore | undefined>(
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
    initialStore?: TUseBoundStore
    createStore: () => TUseBoundStore
    children: ReactNode
  }) => {
    const storeRef = useRef<TUseBoundStore>()

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

  const useStoreApi = (): {
    getState: TUseBoundStore['getState']
    setState: TUseBoundStore['setState']
    subscribe: TUseBoundStore['subscribe']
    destroy: TUseBoundStore['destroy']
  } => {
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
