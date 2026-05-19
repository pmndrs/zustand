---
title: How to reset state
nav: 20
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
import { StateCreator, create as actualCreate } from 'zustand'

const storeResetFns = new Set<() => void>()

export const resetAllStores = () => {
  storeResetFns.forEach((resetFn) => {
    resetFn()
  })
}

export const create = <T>(stateCreator: StateCreator<T>) => {
  const store = actualCreate(stateCreator)
  storeResetFns.add(() => {
    store.setState(store.getInitialState(), true)
  })
  return store
}
```

## Demo

- Basic: https://stackblitz.com/edit/zustand-how-to-reset-state-basic
- Advanced: https://stackblitz.com/edit/zustand-how-to-reset-state-advanced
