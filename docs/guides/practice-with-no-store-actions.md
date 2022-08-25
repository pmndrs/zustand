---
title: Practice with no store actions
nav: 8
---

The recommended usage in the Readme is to colocate actions within the store.

For example:

```js
export const useBoundStore = create((set) => ({
  count: 0,
  text: 'hello',
  inc: () => set((state) => ({ count: state.count + 1 })),
  setText: (text) => set({ text }),
})
```

This creates a self-contained store with data and actions together.

---

An alternative approach is to define actions at module level, external to the store.

```js
export const useBoundStore = create(() => ({
  count: 0,
  text: 'hello',
}))

export const inc = () =>
  useBoundStore.setState((state) => ({ count: state.count + 1 }))

export const setText = (text) => useBoundStore.setState({ text })
```

This has a few advantages:

- It doesn't require a hook to call an action,
- It facilitates code splitting,

While this pattern doesn't offer any downsides, some may prefer the documented approach in the Readme due to its encapsulated nature.
