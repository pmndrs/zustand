import {
  ReactNode,
  createElement,
  createContext as reactCreateContext,
  useContext,
  useMemo,
  useRef,
} from 'react'
import {
  EqualityChecker,
  State,
  StateSelector,
  StoreApi,
  useStore,
} from 'zustand'

export interface UseContextStore<T extends State> {
  (): T
  <U>(selector: StateSelector<T, U>, equalityFn?: EqualityChecker<U>): U
}

function createContext<TState extends State>() {
  const ZustandContext = reactCreateContext<StoreApi<TState> | undefined>(
    undefined
  )

  const Provider = ({
    createStore,
    children,
  }: {
    createStore: () => StoreApi<TState>
    children: ReactNode
  }) => {
    const storeRef = useRef<StoreApi<TState>>()

    if (!storeRef.current) {
      storeRef.current = createStore()
    }

    return createElement(
      ZustandContext.Provider,
      { value: storeRef.current },
      children
    )
  }

  const useBoundStore: UseContextStore<TState> = <StateSlice>(
    selector?: StateSelector<TState, StateSlice>,
    equalityFn = Object.is
  ) => {
    const store = useContext(ZustandContext)
    if (!store) {
      throw new Error(
        'Seems like you have not used zustand provider as an ancestor.'
      )
    }
    return useStore(
      store,
      selector as StateSelector<TState, StateSlice>,
      equalityFn
    )
  }

  const useStoreApi = () => {
    const store = useContext(ZustandContext)
    if (!store) {
      throw new Error(
        'Seems like you have not used zustand provider as an ancestor.'
      )
    }
    return useMemo(
      () => ({
        getState: store.getState,
        setState: store.setState,
        subscribe: store.subscribe,
        destroy: store.destroy,
      }),
      [store]
    )
  }

  return {
    Provider,
    useStore: useBoundStore,
    useStoreApi,
  }
}

export default createContext
