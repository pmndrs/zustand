import type { StoreApi } from 'zustand'
import { useStore as useZustandStore } from 'zustand'

export function bindUseStore<S extends object>(store: StoreApi<S>) {
  return function useStore<T>(selector: (s: S) => T): T {
    return useZustandStore(store, selector)
  }
}