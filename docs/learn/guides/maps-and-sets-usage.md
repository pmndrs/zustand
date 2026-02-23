---
title: Map and Set Usage
nav: 10
---

# Map and Set in Zustand

Map and Set are mutable data structures. To use them in Zustand, you must create new instances when updating.

## Map

### Reading a Map

```typescript
const foo = useSomeStore((state) => state.foo)
```

### Updating a Map

Always create a new Map instance:

```ts
// Update single entry
set((state) => ({
  foo: new Map(state.foo).set(key, value),
}))

// Delete entry
set((state) => {
  const next = new Map(state.foo)
  next.delete(key)
  return { foo: next }
})

// Update multiple entries
set((state) => {
  const next = new Map(state.foo)
  next.set('key1', 'value1')
  next.set('key2', 'value2')
  return { foo: next }
})

// Clear
set({ foo: new Map() })
```

## Set

### Reading a Set

```ts
const bar = useSomeStore((state) => state.bar)
```

### Updating a Set

Always create a new Set instance:

```ts
// Add item
set((state) => ({
  bar: new Set(state.bar).add(item),
}))

// Delete item
set((state) => {
  const next = new Set(state.bar)
  next.delete(item)
  return { bar: next }
})

// Toggle item
set((state) => {
  const next = new Set(state.bar)
  next.has(item) ? next.delete(item) : next.add(item)
  return { bar: next }
})

// Clear
set({ bar: new Set() })
```

## Why New Instances?

Zustand detects changes by comparing references. Mutating a Map or Set doesn't change its reference:

```ts
// ❌ Wrong - same reference, no re-render
set((state) => {
  state.foo.set(key, value)
  return { foo: state.foo }
})

// ✅ Correct - new reference, triggers re-render
set((state) => ({
  foo: new Map(state.foo).set(key, value),
}))
```

## Pitfall: Type Hints for Empty Collections

Provide type hints when initializing empty Maps and Sets:

```ts
{
  ids: new Set([] as string[]),
  users: new Map([] as [string, User][])
}
```

Without type hints, TypeScript infers `never[]` which prevents adding items later.

## Demos

Basic: https://stackblitz.com/edit/vitejs-vite-5cu5ddvx
