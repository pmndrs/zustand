import create from "zustand";

type Store = {
  count:number,
  increment: VoidFunction,
  decrement: VoidFunction,
  reset: VoidFunction,
}

export const useCounter = create<Store>((set) => ({
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