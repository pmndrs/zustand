---
title: Immutable state and merging
nav: 5
---

Like `useState`, we need to update state immutably.

Here's a typical example.

```jsx
import create from 'zustand'

const useCountStore = create((set) => ({
  count: 0,
  inc: () => set((state) => ({ count: state.count + 1 })),
}))
```

The `set` function is to update state in store.
Because the state is immutable, it should have been this:

```js
set((state) => ({ ...state, count: state.count + 1 }))
```

As this happens very often, `set` actually merges state, and
we can skip `...state` part:

```js
set((state) => ({ count: state.count + 1 }))
```

## Nested objects

The `set` function merges state only one level.
If you have a nested object, you need to merge them explicitly.

```jsx
import create from 'zustand'

const useCountStore = create((set) => ({
  nested: { count: 0 },
  inc: () =>
    set((state) => ({
      nested: { ...state.nested, count: state.nested.count + 1 },
    })),
}))
```

For complex use cases, consider using some libraries that helps immutable updates.
Refer [Updating nested state object values](./updating-nested-state-object-values.md).

## Replace flag

To disable the merging behavior, you can specify `replace` boolean value to `set`.

```js
set((state) => newState, true)
```
