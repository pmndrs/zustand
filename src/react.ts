import { useDebugValue } from 'react'
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/shim/with-selector'
import createStore, { Store, UnknownState, StoreInitializer } from './vanilla'

type UseStore =
  { <T extends UnknownState>
      (store: Store<T>):
        T

  , <T extends UnknownState, U>
      ( store: Store<T>
      , selector: (state: T) => U
      , equals?: (a: U, b: U) => boolean
      ):
        U
  }

export const useStore = ((store, selector, equals) => {
  const selected = useSyncExternalStoreWithSelector(
    store.subscribe,
    store.getState,
    null,
    selector,
    equals
  )
  useDebugValue(selected)

  return selected
}) as UseStore


const create =
  <T extends UnknownState, S extends Store<T>>
    (storeOrInitializer: S | StoreInitializer<T, S>): UseBoundStore<T, S> => {

  const store: S =
    typeof storeOrInitializer === "function"
      ? createStore(storeOrInitializer as StoreInitializer<T, S>)
      : storeOrInitializer

  return Object.assign(
    ((selector, equals) => useStore(store, selector, equals)) as UseBoundStore<T, S>,
    store
  )
}

type UseBoundStore<T extends UnknownState, S extends Store<T>> =
  & { (): T
    , <U>(selector: (state: T) => U, equals?: (a: U, b: U) => boolean): U
    }
  & S
  
export default create