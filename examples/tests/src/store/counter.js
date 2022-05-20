import create from 'zustand'

export const useCounter = create((set) => {
  return {
    count: 0,
    increment() {
      set(({ count }) => ({ count: count + 1 }))
    },
    decrement() {
      set(({ count }) => ({ count: count - 1 }))
    },
  }
})