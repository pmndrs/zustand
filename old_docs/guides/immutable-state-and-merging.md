---
title: Immutable state and merging
nav: 4
---

Like with React's `useState`, we need to update state immutably.

Here's a typical example:

```jsx
import { create } from 'zustand'

const useCountStore = create((set) => ({
  count: 0,
  inc: () => set((state) => ({ count: state.count + 1 })),
}))
```

The `set` function is to update state in the store.
Because the state is immutable, it should have been like this:

```js
set((state) => ({ ...state, count: state.count + 1 }))
```

However, as this is a common pattern, `set` actually merges state, and
we can skip the `...state` part:

```js
set((state) => ({ count: state.count + 1 }))
```

## Nested objects

The `set` function merges state at only one level.
If you have a nested object, you need to merge them explicitly. You will use the spread operator pattern like so:

```jsx
import { create } from 'zustand'

const useCountStore = create((set) => ({
  nested: { count: 0 },
  inc: () =>
    set((state) => ({
      nested: { ...state.nested, count: state.nested.count + 1 },
    })),
}))
```

For complex use cases, consider using some libraries that help with immutable updates.
You can refer to [Updating nested state object values](./updating-state.md#deeply-nested-object).

## Replace flag

To disable the merging behavior, you can specify a `replace` boolean value for `set` like so:

```js
set((state) => newState, true)
```
