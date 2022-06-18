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

interface UseContextStore<S extends StoreApi<State>> {
  (): ExtractState<S>
  <U>(
    selector: StateSelector<ExtractState<S>, U>,
    equalityFn?: EqualityChecker<U>
  ): U
}

type ExtractState<S> = S extends { getState: () => infer T } ? T : never

type WithoutCallSignature<T> = { [K in keyof T]: T[K] }

function createContext<S extends StoreApi<State>>() {
  const ZustandContext = reactCreateContext<S | undefined>(undefined)

  const Provider = ({
    createStore,
    children,
  }: {
    createStore: () => S
    children: ReactNode
  }) => {
    const storeRef = useRef<S>()

    if (!storeRef.current) {
      storeRef.current = createStore()
    }

    return createElement(
      ZustandContext.Provider,
      { value: storeRef.current },
      children
    )
  }

  const useBoundStore = (<StateSlice = ExtractState<S>>(
    selector?: StateSelector<ExtractState<S>, StateSlice>,
    equalityFn?: EqualityChecker<StateSlice>
  ) => {
    const store = useContext(ZustandContext)
    if (!store) {
      throw new Error(
        'Seems like you have not used zustand provider as an ancestor.'
      )
    }
    return useStore(
      store,
      selector as StateSelector<ExtractState<S>, StateSlice>,
      equalityFn
    )
  }) as UseContextStore<S>

  const useStoreApi = () => {
    const store = useContext(ZustandContext)
    if (!store) {
      throw new Error(
        'Seems like you have not used zustand provider as an ancestor.'
      )
    }
    return useMemo(
      () =>
        ({
          getState: store.getState,
          setState: store.setState,
          subscribe: store.subscribe,
          destroy: store.destroy,
        } as WithoutCallSignature<S>),
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
