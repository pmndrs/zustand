---
title: Flux inspired practice
nav: 3
---

Although zustand is an unopinionated library, here's one of the recommended usages:

- Create one single store
- Define a store only with `set`
- Define dispatch functions at the root level of the store to update one or more store slices

```js
const useBoundStore = create((set) => ({
  storeSliceA: ...,
  storeSliceB: ...,
  storeSliceC: ...,
  dispatchX: () => set(...),
  dispatchY: () => set(...),
}))
```

See [Splitting the store into separate slices](https://github.com/pmndrs/zustand/blob/main/docs/typescript.md#slices-pattern) for how to define a store with separate slices.

## Flux like patterns / "Dispatching" actions

If you can't live without redux-like reducers, you can define a `dispatch` function on the root level of the store like store

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

Or, just use our redux-middleware. It wires up your main-reducer, sets initial state, and adds a dispatch function to the state itself and the vanilla api. Try [this](https://codesandbox.io/s/amazing-kepler-swxol) example.

```typescript
import { redux } from 'zustand/middleware'

const useReduxStore = create(redux(reducer, initialState))
```

Another way to update the store could be in functions wrapping the state functions. These could also handle side-effects of actions, for example for HTTP-calls. For using Zustand in a none-reactive way see [the readme](https://github.com/pmndrs/zustand#readingwriting-state-and-reacting-to-changes-outside-of-components)
