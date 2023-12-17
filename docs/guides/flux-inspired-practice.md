---
title: Flux inspired practice
nav: 5
---

Although Zustand is an unopinionated library, we do recommend a few patterns.
These are inspired by practices originally found in [Flux](https://github.com/facebookarchive/flux),
and more recently [Redux](https://redux.js.org/understanding/thinking-in-redux/three-principles),
so if you are coming from another library, you should feel right at home.

However, Zustand does differ in some fundamental ways,
so some terminology may not perfectly align to other libraries.

## Recommended patterns

### Single store

Your applications global state should be located in a single Zustand store.

If you have a large application, Zustand supports [splitting the store into slices](./slices-pattern.md).

### Use `set` / `setState` to update the store

Always use `set` (or `setState`) to perform updates to your store.
`set` (and `setState`) ensures the described update is correctly merged and listeners are appropriately notified.

### Colocate store actions

In Zustand, state can be updated without the use of dispatched actions and reducers found in other Flux libraries.
These store actions can be added directly to the store as shown below.

Optionally, by using `setState` they can be [located external to the store](./practice-with-no-store-actions.md)

```js
const useBoundStore = create((set) => ({
  storeSliceA: ...,
  storeSliceB: ...,
  storeSliceC: ...,
  updateX: () => set(...),
  updateY: () => set(...),
}))
```

## Redux-like patterns

If you can't live without Redux-like reducers, you can define a `dispatch` function on the root level of the store:

```typescript
const types = { increase: 'INCREASE', decrease: 'DECREASE' }

const reducer = (state, { type, by = 1 }) => {
  switch (type) {
    case types.increase:
      return { grumpiness: state.grumpiness + by }
    case types.decrease:
      return { grumpiness: state.grumpiness - by }
  }
}

const useGrumpyStore = create((set) => ({
  grumpiness: 0,
  dispatch: (args) => set((state) => reducer(state, args)),
}))

const dispatch = useGrumpyStore((state) => state.dispatch)
dispatch({ type: types.increase, by: 2 })
```

You could also use our redux-middleware. It wires up your main reducer, sets initial state, and adds a dispatch function to the state itself and the vanilla api.

```typescript
import { redux } from 'zustand/middleware'

const useReduxStore = create(redux(reducer, initialState))
```

Another way to update the store could be through functions wrapping the state functions. These could also handle side-effects of actions. For example, with HTTP-calls. To use Zustand in a non-reactive way, see [the readme](https://github.com/pmndrs/zustand#readingwriting-state-and-reacting-to-changes-outside-of-components).
