---
title: Flux inspired practice
nav: 5
---

Although zustand is an unopinionated library, here are some patterns we recommend:

- Create a single store;
- Always use `set` to define a store;
- Define your dispatch functions at the root level of the store to update one or more store slices.

```js
const useBoundStore = create((set) => ({
  storeSliceA: ...,
  storeSliceB: ...,
  storeSliceC: ...,
  dispatchX: () => set(...),
  dispatchY: () => set(...),
}))
```

See [Splitting the store into separate slices](./typescript.md#slices-pattern) for how to define a store with separate slices.

## Flux like patterns / "dispatching" actions

If you can't live without redux-like reducers, you can define a `dispatch` function on the root level of the store like so:

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

Another way to update the store could be through functions wrapping the state functions. These could also handle side-effects of actions. For example, with HTTP-calls. To use Zustand in a none-reactive way, see [the readme](https://github.com/pmndrs/zustand#readingwriting-state-and-reacting-to-changes-outside-of-components).
