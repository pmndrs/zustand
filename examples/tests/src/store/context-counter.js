import create from 'zustand'
import createContext from 'zustand/context'

export const createCounter = () => create((set) => {
  return {
    count: 0,
    increment() {
      set(({ count }) => ({ count: count + 1 }))
    },
  }
})

export const { Provider: CounterProvider, useStore: useBoundCounter } = createContext()