---
title: How to reset state
nav: 12
---

The following pattern can be used to reset the state to its initial value.

```ts
const useSomeStore = create<State & Actions>()((set, get, store) => ({
  // your code here
  reset: () => {
    set(store.getInitialState())
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
    storeResetFns.add(() => {
      store.setState(store.getInitialState(), true)
    })
    return store
  }
}) as typeof actualCreate
```

## CodeSandbox Demo

- Basic: https://stackblitz.com/edit/zustand-how-to-reset-state-basic
- Advanced: https://stackblitz.com/edit/zustand-how-to-reset-state-advanced
