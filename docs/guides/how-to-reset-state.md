---
title: How to reset state
nav: 12
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
import type { StateCreator } from 'zustand'
import { create: actualCreate } from 'zustand'

const storeResetFns = new Set<() => void>()

const resetAllStores = () => {
  storeResetFns.forEach((resetFn) => {
    resetFn()
  })
}

export const create = (<T>() => {
  return (stateCreator: StateCreator<T>) => {
    const store = actualCreate(stateCreator)
    const initialState = store.getInitialState()
    storeResetFns.add(() => {
      store.setState(initialState, true)
    })
    return store
  }
}) as typeof actualCreate
```

## CodeSandbox Demo

- Basic: https://codesandbox.io/s/zustand-how-to-reset-state-basic-demo-rrqyon
- Advanced: https://codesandbox.io/s/zustand-how-to-reset-state-advanced-demo-gtu0qe
- Immer: https://codesandbox.io/s/how-to-reset-state-advance-immer-demo-nyet3f
