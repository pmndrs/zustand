import createStore, { Store, UnknownState, StoreInitializer, StoreMutatorIdentifier, Mutate } from './vanilla'
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/shim/with-selector'
import { useDebugValue } from 'react'

// ============================================================================
// Types

type UseStore =
  <S extends Store<UnknownState>, U = State<S>>
    ( store: S
    , selector?: (state: State<S>) => U
    , equals?: (a: U, b: U) => boolean
    ) =>
      U

type Create =
  { <S extends Store<UnknownState>>
      (store: S):
        UseBoundStore<S>

  , <T extends UnknownState, Mos extends [StoreMutatorIdentifier, unknown][] = []>
      (initializer: StoreInitializer<T, [], Mos>):
        UseBoundStore<Mutate<Store<T>, Mos>>
  }
      
type UseBoundStore<S> =
  & ( <U = State<S>>
        ( selector: (state: State<S>) => U
        , equals?: (a: U, b: U) => boolean
        ) =>
          U
    )
  & S

type State<S> =
  S extends { getState: () => infer T } ? T : never


// ============================================================================
// Implementation

const useStore: UseStore = (store, selector, equals) => {
  type S = typeof store;
  const selected = useSyncExternalStoreWithSelector(
    store.subscribe,
    store.getState as () => State<S>,
    null,
    selector as Exclude<typeof selector, undefined>,
    // TODO: fix `@types/useSyncExternalStoreWithSelector`, should not  require selector
    equals
  )
  useDebugValue(selected)

  return selected
}

const create: Create = (...[storeOrInitializer]: Parameters2<Create>) => {
  const store =
    typeof storeOrInitializer === "function"
      ? createStore(storeOrInitializer)
      : storeOrInitializer

  return Object.assign(
    ((selector, equals) => useStore(store, selector, equals)) as UseBoundStore<Store<UnknownState>>,
    store
  )
}


// ============================================================================
// Utilities

type Parameters2<T extends (...a: never[]) => unknown> =
  T extends {
    (...a: infer A1): unknown 
    (...a: infer A2): unknown 
  }
    ? A1 | A2
    : never

// ============================================================================
// Exports

export default create
export { useStore };