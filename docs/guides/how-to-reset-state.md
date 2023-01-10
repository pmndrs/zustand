---
title: How to reset state
nav: 13
---

The following pattern can be used to reset the state to its initial value.

```ts
import { create } from 'zustand'

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
const useSlice = create<State & Actions>()((set, get) => ({
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

Resetting multiple stores at once

```ts
import { create: _create, StateCreator } from 'zustand'

const resetters: (() => void)[] = []

export const create = (<T extends unknown>(f: StateCreator<T> | undefined) => {
  if (f === undefined) return create
  const store = _create(f)
  const initialState = store.getState()
  resetters.push(() => {
    store.setState(initialState, true)
  })
  return store
}) as typeof _create

export const resetAllStores = () => {
  for (const resetter of resetters) {
    resetter()
  }
}
```

## CodeSandbox Demo

- Basic: https://codesandbox.io/s/zustand-how-to-reset-state-basic-demo-rrqyon
- Advanced: https://codesandbox.io/s/zustand-how-to-reset-state-advanced-demo-gtu0qe
- Immer: https://codesandbox.io/s/how-to-reset-state-advance-immer-demo-nyet3f
