---
title: Comparison
description:
nav: 2
---

## Redux

### State Model

```tsx
import create from 'zustand'

type State = {
  count: number
}

type Actions = {
  increment: (qty: number) => void
  decrement: (qty: number) => void
}

const useCountStore = create<State & Actions>((set) => ({
  count: 0,
  increment: (qty: number) => set((state) => ({ count: state.count + qty })),
  decrement: (qty: number) => set((state) => ({ count: state.count - qty })),
}))
```

```ts
import create from 'zustand'

type State = {
  count: number
}

type Actions = {
  increment: (qty: number) => void
  decrement: (qty: number) => void
}

type Action = {
  type: keyof Actions
  qty: number
}

const countReducer = (state: State, action: Action) => {
  switch (action.type) {
    case 'increment':
      return { count: state.count + action.qty }
    case 'decrement':
      return { count: state.count - action.qty }
    default:
      return state
  }
}

const useCountStore = create<State & Actions>((set) => ({
  count: 0,
  dispatch: (action: Action) => set((state) => countReducer(state, action)),
}))
```

```ts

```

### Render Optimization

## Valtio

Zustand and Valtio are state management libraries for React. Here are some
differences between these two libraries.

### State Model

There is a major difference between Zustand and Valtio. Zustand is based on the
immutable state model, while Valtio is based on the mutable state model.
The contract in the immutable state model is that objects cannot be changed once created

```ts
import create from 'zustand'

const store = create(() => ({ obj: { count: 0 } }))
store.setState((prev) => ({ obj: { count: prev.obj.count + 1 } })
```

```ts
import { proxy } from 'valtio'

const state = proxy({ obj: { count: 0 } })
state.obj.count += 1
```

### Render Optimization

The other difference between Valtio and Zustand is, Valtio made render
optimizations through property access. But, with Zustand you need to do manual
render optimizations through selectors.

```ts
import create from 'zustand'

const useStore = create(() => ({
  count1: 0,
  count2: 1,
}))

const Component = () => {
  const count1 = useStore((state) => state.count1)
  // ...
}
```

```ts
import { proxy, useSnapshot } from 'valtio'

const state = proxy({
  count1: 0,
  count2: 0,
})

const Component = () => {
  const { count1 } = useSnapshot(state)
  // ...
}
```

## Jotai

## Recoil
