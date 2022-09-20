---
title: How to reset state
nav: 13
---

The following pattern can be used to reset the state to its initial value.

```ts
import create from 'zustand'

// define types for state values and actions separately
type State = {
  salmon: number
  tuna: number
}

type Actions = {
  addSalmon: (qty: number) => void
  addTuna: (qty: number) => void
  reset: () => void
}

// define the initial state
const initialState: State = {
  salmon: 0,
  tuna: 0,
}

// create store
const useSlice = create<State & Actions>((set, get) => ({
  ...initialState,

  addSalmon: (qty: number) => {
    set({ salmon: get().salmon + qty })
  },

  addTuna: (qty: number) => {
    set({ tuna: get().tuna + qty })
  },

  reset: () => {
    set(initialState)
  },
}))
```

Resetting multiple stores at once instead of individual stores

```ts
import _create, { StateCreator, StoreApi, UseBoundStore } from 'zustand'

const resetters: (() => void)[] = []

export const create = <TState extends unknown>(
  createState: StateCreator<TState> | StoreApi<TState>
): UseBoundStore<StoreApi<TState>> => {
  // We need to use createState as never to support StateCreator<TState> and
  // StoreApi<TState> at the same time.
  // We also need to re-type slice to UseBoundStore<StoreApi<TState>>
  const slice: UseBoundStore<StoreApi<TState>> = _create(createState as never)
  const initialState = slice.getState()

  resetters.push(() => {
    slice.setState(initialState, true)
  })

  return slice
}

export const resetAllSlices = () => {
  for (const resetter of resetters) {
    resetter()
  }
}
```

## CodeSandbox Demo

- Basic: https://codesandbox.io/s/zustand-how-to-reset-state-basic-demo-rrqyon
- Advanced: https://codesandbox.io/s/zustand-how-to-reset-state-advanced-demo-gtu0qe
