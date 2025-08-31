import { createStore } from 'zustand/vanilla'
import type { StoreApi } from 'zustand'

export type CounterState = { count: number }
export type CounterActions = {
  inc(): void
  dec(): void
  reset(): void
}
export type CounterStore = CounterState & CounterActions

export function createCounterStore(initial?: Partial<CounterState>): StoreApi<CounterStore> {
  return createStore<CounterStore>()((set, get) => ({
    count: initial?.count ?? 0,
    inc: () => set({ count: get().count + 1 }),
    dec: () => set({ count: get().count - 1 }),
    reset: () => set({ count: 0 }),
  }))
}