---
title: Connect to state with URL hash
nav: 12
---

## State is connected with URL hash

If you want to connect state of a store to URL hash, you can create your own hash storage.

```ts
import create from 'zustand'
import { persist, StateStorage } from 'zustand/middleware'

const hashStorage: StateStorage = {
  getItem: (key): string => {
    const searchParams = new URLSearchParams(location.hash.slice(1))
    const storedValue = searchParams.get(key)
    return JSON.parse(storedValue)
  },
  setItem: (key, newValue): void => {
    const searchParams = new URLSearchParams(location.hash.slice(1))
    searchParams.set(key, JSON.stringify(newValue))
    location.hash = searchParams.toString()
  },
  removeItem: (key): void => {
    const searchParams = new URLSearchParams(location.hash.slice(1))
    searchParams.delete(key)
    location.hash = searchParams.toString()
  },
}

export const useBoundStore = create(
  persist(
    (set, get) => ({
      fishes: 0,
      addAFish: () => set({ fishes: get().fishes + 1 }),
    }),
    {
      name: 'food-storage', // unique name
      getStorage: () => hashStorage,
    }
  )
)
```

## CodeSandbox Demo

https://codesandbox.io/s/silly-fire-gsjbc7?file=/src/App.tsx
