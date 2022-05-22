import create, { StoreApi } from 'zustand'
import createContext from 'zustand/context'

type Store = {
  count:number,
  increment: VoidFunction,
  decrement: VoidFunction,
  reset: VoidFunction,
}

export const createCounter = () => create<Store>((set) => ({
  count: 0,
  increment() {
    set(({count}) => ({count: count+1}))
  },
  decrement() {
    set(({count}) => ({count: count-1}))
  },
  reset() {
    set({count:0})
  }
}))

export const { Provider: CounterProvider, useStore: useContextCounter } = createContext<StoreApi<Store>>()