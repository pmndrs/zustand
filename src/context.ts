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

export type UseContextStore<S> = <U = ExtractState<S>>(
  selector?: (state: ExtractState<S>) => U,
  equals?: (a: U, b: U) => boolean
) => U

type ExtractState<S> = S extends { getState: () => infer T } ? T : never

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

  const useBoundStore: UseContextStore<S> = <StateSlice>(
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
  }

  const useStoreApi = (): S => {
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
        } as S),
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
