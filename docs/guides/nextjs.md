---
title: Setup with Next.js
nav: 21
---

[Next.js](https://nextjs.org) is a popular server-side rendering framework for React that presents
some unique challenges for using Zustand properly.
Keep in mind that Zustand store is a global
variable (AKA module state) making it optional to use a `Context`.
These challenges include:

- **Per-request store:** A Next.js server can handle multiple requests simultaneously. This means
  that the store should be created per request and should not be shared across requests.
- **SSR friendly:** Next.js applications are rendered twice, first on the server
  and again on the client. Having different outputs on both the client and the server will result
  in "hydration errors." The store will have to be initialized on the server and then
  re-initialized on the client with the same data in order to avoid that. Please read more about
  that in our [SSR and Hydration](./ssr-and-hydration) guide.
- **SPA routing friendly:** Next.js supports a hybrid model for client side routing, which means
  that in order to reset a store, we need to intialize it at the component level using a
  `Context`.
- **Server caching friendly:** Recent versions of Next.js (specifically applications using the App
  Router architecture) support aggressive server caching. Due to our store being a **module state**,
  it is completely compatible with this caching.

We have these general recommendations for the appropriate use of Zustand:

- **No global stores** - Because the store should not be shared across requests, it should not be defined
  as a global variable. Instead, the store should be created per request.
- **React Server Components should not read from or write to the store** - RSCs cannot use hooks or context. They aren't
  meant to be stateful. Having an RSC read from or write values to a global store violates the
  architecture of Next.js.

### Creating a store per request

Let's write our store factory function that will create a new store for each
request.

```ts
// stores/counter-store.ts
import { createStore } from 'zustand'

export type CounterState = {
  count: number
}

export type CounterActions = {
  decrementCount: () => void
  incrementCount: () => void
}

export type CounterStore = CounterState & CounterActions

export const defaultInitState: CounterState = {
  count: 0,
}

export const createCounterStore = (
  initState: CounterState = defaultInitState,
) => {
  return createStore<CounterStore>()((set) => ({
    ...initState,
    decrementCount: () => set((state) => ({ count: state.count - 1 })),
    incrementCount: () => set((state) => ({ count: state.count + 1 })),
  }))
}
```

### Providing the store

Let's use the `createCounterStore` in our component and share it using a context provider.

```tsx
// components/counter-store-provider.tsx
'use client'

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

> **Note:** In this example, we ensure that this component is re-render-safe by checking the
> value of the reference, so that the store is only created once. This component will only be
> rendered once per request on the server, but might be re-rendered multiple times on the client if
> there are stateful client components located above this component in the tree, or if this component
> also contains other mutable state that causes a re-render.

### Initializing the store

```ts
// stores/counter-store.ts
// rest of code

export const initCounterStore = (): CounterState => {
  return { count: new Date().getFullYear() }
}
```

```tsx
// components/counter-store-provider.tsx
// rest of code

import {
  type CounterStore,
  createCounterStore,
  initCounterStore,
} from 'stores/counter-store.ts'

// rest of code

export const CounterStoreProvider = ({
  children,
}: CounterStoreProviderProps) => {
  const storeRef = useRef<CounterStore>()
  if (!storeRef.current) {
    storeRef.current = createCounterStore(initCounterStore())
  }

  return (
    <CounterStoreContext.Provider value={storeRef.current}>
      {children}
    </CounterStoreContext.Provider>
  )
}

// rest of code
```

### Using the store with different architectures

There are two architectures for a Next.js application: the
[Pages Router](https://nextjs.org/docs/pages/building-your-application/routing) and the
[App Router](https://nextjs.org/docs/app/building-your-application/routing). The usage of Zustand on
both architectures should be the same with slight differences related to each architecture.

#### Pages Router

```tsx
// components/pages/home-page.tsx
import { useCounterStore } from 'components/counter-store-provider.ts'

export const HomePage = () => {
  const { count, incrementCount, decrementCount } = useCounterStore()

  return (
    <div>
      Count: {count}
      <hr />
      <button type="button" onClick={() => void incrementCount()}>
        Increment Count
      </button>
      <button type="button" onClick={() => void decrementCount()}>
        Decrement Count
      </button>
    </div>
  )
}
```

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

> **Note:** creating a store per route would require creating and sharing the store
> at page (route) component level. Try not to use this if you do not need to create
> a store per route.

```tsx
// pages/index.tsx
import { CounterStoreProvider } from 'components/counter-store-provider.tsx'
import { HomePage } from 'components/pages/home-page.tsx'

export default function Home() {
  return (
    <CounterStoreProvider>
      <HomePage />
    </CounterStoreProvider>
  )
}
```

#### App Router

```tsx
// components/pages/home-page.tsx
import { useCounterStore } from 'components/counter-store-provider.ts'

export const HomePage = () => {
  const { count, incrementCount, decrementCount } = useCounterStore()

  return (
    <div>
      Count: {count}
      <hr />
      <button type="button" onClick={() => void incrementCount()}>
        Increment Count
      </button>
      <button type="button" onClick={() => void decrementCount()}>
        Decrement Count
      </button>
    </div>
  )
}
```

```tsx
// app/layout.tsx
import { type ReactNode } from 'react'

export interface RootLayoutProps {
  children: ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return <CounterStoreProvider>{children}</CounterStoreProvider>
}
```

> **Note:** creating a store per route would require creating and sharing the store
> at page (route) component level. Try not to use this if you do not need to create
> a store per route.

```tsx
// app/index.tsx
import { CounterStoreProvider } from 'components/counter-store-provider.tsx'
import { HomePage } from 'components/pages/home-page.tsx'

export default function Home() {
  return (
    <CounterStoreProvider>
      <HomePage />
    </CounterStoreProvider>
  )
}
```
