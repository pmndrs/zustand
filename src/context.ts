import * as React from 'react'
import { useStore } from './react'
import { Store, UnknownState } from './vanilla'

// ============================================================================
// Types

type CreateContext = <S extends Store<UnknownState>>() => {
  Provider: Provider<S>
  useStore: UseStore<S>
  useStoreRef: UseStoreRef<S>
}

type Provider<S> = (props: {
  createStore: () => S
  children?: React.ReactNode
}) => React.ReactElement

type UseStore<S> = <U = State<S>>(
  selector?: (state: State<S>) => U,
  equals?: (a: U, b: U) => boolean
) => U

type UseStoreRef<S> = () => S

type State<S> = S extends { getState: () => infer T } ? T : never

// ============================================================================
// Implementation

type T = { __isState: true }
type CreateContextImpl = () => {
  Provider: Provider<Store<T>>
  useStoreRef: UseStoreRef<Store<T>>
  useStore: UseStore<Store<T>>
}

const createContextImpl: CreateContextImpl = () => {
  const StoreContext = React.createContext<Store<T> | undefined>(undefined)

  const Provider: ReturnType<CreateContextImpl>['Provider'] = ({
    createStore,
    children,
  }) =>
    React.createElement(StoreContext.Provider, {
      value: useConstant(createStore),
      children,
    })

  const useStoreRef: ReturnType<CreateContextImpl>['useStoreRef'] = () => {
    const store = React.useContext(StoreContext)
    if (!store) {
      throw new Error(
        'Seems like you have not used zustand provider as an ancestor.'
      )
    }
    return store
  }

  const useBoundStore: ReturnType<CreateContextImpl>['useStore'] = (...a) =>
    useStore(useStoreRef(), ...a)

  return {
    Provider,
    useStoreRef,
    useStore: useBoundStore,
  }
}
const createContext = createContextImpl as CreateContext

// ============================================================================
// Utilities

const useConstant = <T>(create: () => T) => {
  const ref = React.useRef<T | undefined>()
  if (!ref.current) {
    ref.current = create()
  }
  return ref.current
}

// ============================================================================
// Exports

export default createContext
