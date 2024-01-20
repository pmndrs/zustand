---
title: Setup with Next.js
nav: 16
---

```ts
// stores/counter-store.ts
import { createStore } from 'zustand'

export type CounterState = {
  count: number
}

export type CounterActions = {
  decrementCount: () => void
  incremrentCount: () => void
}

export type CounterStore = CounterState & CounterActions

export const defaultInitState: Partial<CounterState> = {
  count: 0,
}

export const createCounterStore = (
  initState: Partial<CounterState> = defaultInitState,
) => {
  return createStore<CounterStore>()((set) => ({
    ...initState,
    decrementCount: () => set((state) => ({ count: state.count - 1 })),
    incrementCount: () => set((state) => ({ count: state.count + 1 })),
  }))
}
```

```tsx
// components/counter-store-provider.tsx
import { type ReactNode, createContext, useRef, useContext } from 'react'

import { type CounterStore, createCounterStore } from 'stores/counter-store.ts'

export const CounterStoreContext = createContext()

export interface CounterStoreProviderProps {
  children: ReactNode
}

export const CounterStoreProvider = ({
  children,
}: CounterStoreProviderProps) => {
  const storeRef = useRef<CounterStore>()
  if (!storeRef.current) {
    storeRef.current = createCounterStore()
  }

  return (
    <CounterStoreContext.Provider value={storeRef.current}>
      {children}
    </CounterStoreContext.Provider>
  )
}

export const useCounterStore = (selector: (store: CounterStore) => T): T => {
  const counterStoreContext = useContext(CounterStoreContext)

  if (counterStoreContext === undefined) {
    throw new Error(`useCounterStore must be use within CounterStoreProvider`)
  }

  return useStore(counterStoreContext, selector)
}
```

## Pages Router

### App

```tsx
// _app.tsx
import type { AppProps } from 'next/app'

import { CounterStoreProvider } from 'components/counter-store-provider.tsx'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <CounterStoreProvider>
      <Component {...pageProps} />
    </CounterStoreProvider>
  )
}
```

### Page

```tsx
// components/pages/home-page.tsx
import { useCounterStore } from 'components/counter-store-provider.ts'

export const HomePage = () => {
  const counterStore = useCounterStore()

  return <div>
}
```

```tsx
// pages/index.tsx
import { HomePage } from 'components/pages/home-page.tsx'

export default function Home() {
  return (
    <CounterStoreProvider>
      <HomePage />
    </CounterStoreProvider>
  )
}
```

## App Router

```tsx

```
