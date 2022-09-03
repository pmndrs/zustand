import {
  createElement,
  createContext as reactCreateContext,
  useContext,
  useMemo,
  useRef,
} from 'react'
import type { ReactNode } from 'react'
import { useStore } from 'zustand'
import type { StoreApi } from 'zustand'

type UseContextStore<S extends StoreApi<unknown>> = {
  (): ExtractState<S>
  <U>(
    selector: (state: ExtractState<S>) => U,
    equalityFn?: (a: U, b: U) => boolean
  ): U
}

type ExtractState<S> = S extends { getState: () => infer T } ? T : never

type WithoutCallSignature<T> = { [K in keyof T]: T[K] }

function createContext<S extends StoreApi<unknown>>() {
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

  const useContextStore: UseContextStore<S> = <StateSlice = ExtractState<S>>(
    selector?: (state: ExtractState<S>) => StateSlice,
    equalityFn?: (a: StateSlice, b: StateSlice) => boolean
  ) => {
    const store = useContext(ZustandContext)
    if (!store) {
      throw new Error(
        'Seems like you have not used zustand provider as an ancestor.'
      )
    }
    return useStore(
      store,
      selector as (state: ExtractState<S>) => StateSlice,
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
    return useMemo<WithoutCallSignature<S>>(() => ({ ...store }), [store])
  }

  return {
    Provider,
    useStore: useContextStore,
    useStoreApi,
  }
}

export default createContext
