---
title: Setup with Next.js
nav: 17
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
  that in our [SSR and Hydration](./ssr-and-hydration.md) guide.
- **SPA routing friendly:** Next.js supports a hybrid model for client side routing, which means
  that in order to reset a store, we need to initialize it at the component level using a
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

```json
// tsconfig.json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

> **Note:** do not forget to remove all comments from your `tsconfig.json` file.

```ts
// src/stores/counter-store.ts
import { createStore } from 'zustand/vanilla'

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
// src/providers/counter-store-provider.tsx
'use client'

import { type ReactNode, createContext, useRef, useContext } from 'react'
import { useStore } from 'zustand'

import { type CounterStore, createCounterStore } from '@/stores/counter-store'

export type CounterStoreApi = ReturnType<typeof createCounterStore>

export const CounterStoreContext = createContext<CounterStoreApi | undefined>(
  undefined,
)

export interface CounterStoreProviderProps {
  children: ReactNode
}

export const CounterStoreProvider = ({
  children,
}: CounterStoreProviderProps) => {
  const storeRef = useRef<CounterStoreApi | null>(null)
  if (storeRef.current === null) {
    storeRef.current = createCounterStore()
  }

  return (
    <CounterStoreContext.Provider value={storeRef.current}>
      {children}
    </CounterStoreContext.Provider>
  )
}

export const useCounterStore = <T,>(
  selector: (store: CounterStore) => T,
): T => {
  const counterStoreContext = useContext(CounterStoreContext)

  if (!counterStoreContext) {
    throw new Error(`useCounterStore must be used within CounterStoreProvider`)
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
// src/stores/counter-store.ts
import { createStore } from 'zustand/vanilla'

export type CounterState = {
  count: number
}

export type CounterActions = {
  decrementCount: () => void
  incrementCount: () => void
}

export type CounterStore = CounterState & CounterActions

export const initCounterStore = (): CounterState => {
  return { count: new Date().getFullYear() }
}

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

```tsx
// src/providers/counter-store-provider.tsx
'use client'

import { type ReactNode, createContext, useRef, useContext } from 'react'
import { useStore } from 'zustand'

import {
  type CounterStore,
  createCounterStore,
  initCounterStore,
} from '@/stores/counter-store'

export type CounterStoreApi = ReturnType<typeof createCounterStore>

export const CounterStoreContext = createContext<CounterStoreApi | undefined>(
  undefined,
)

export interface CounterStoreProviderProps {
  children: ReactNode
}

export const CounterStoreProvider = ({
  children,
}: CounterStoreProviderProps) => {
  const storeRef = useRef<CounterStoreApi | null>(null)
  if (storeRef.current === null) {
    storeRef.current = createCounterStore(initCounterStore())
  }

  return (
    <CounterStoreContext.Provider value={storeRef.current}>
      {children}
    </CounterStoreContext.Provider>
  )
}

export const useCounterStore = <T,>(
  selector: (store: CounterStore) => T,
): T => {
  const counterStoreContext = useContext(CounterStoreContext)

  if (!counterStoreContext) {
    throw new Error(`useCounterStore must be used within CounterStoreProvider`)
  }

  return useStore(counterStoreContext, selector)
}
```

### Using the store with different architectures

There are two architectures for a Next.js application: the
[Pages Router](https://nextjs.org/docs/pages/building-your-application/routing) and the
[App Router](https://nextjs.org/docs/app/building-your-application/routing). The usage of Zustand on
both architectures should be the same with slight differences related to each architecture.

#### Pages Router

```tsx
// src/components/pages/home-page.tsx
import { useCounterStore } from '@/providers/counter-store-provider.ts'

export const HomePage = () => {
  const { count, incrementCount, decrementCount } = useCounterStore(
    (state) => state,
  )

  return (
    <div>
      Count: {count}
      <hr />
      <button type="button" onClick={incrementCount}>
        Increment Count
      </button>
      <button type="button" onClick={decrementCount}>
        Decrement Count
      </button>
    </div>
  )
}
```

```tsx
// src/_app.tsx
import type { AppProps } from 'next/app'

import { CounterStoreProvider } from '@/providers/counter-store-provider.tsx'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <CounterStoreProvider>
      <Component {...pageProps} />
    </CounterStoreProvider>
  )
}
```

```tsx
// src/pages/index.tsx
import { HomePage } from '@/components/pages/home-page.tsx'

export default function Home() {
  return <HomePage />
}
```

> **Note:** creating a store per route would require creating and sharing the store
> at page (route) component level. Try not to use this if you do not need to create
> a store per route.

```tsx
// src/pages/index.tsx
import { CounterStoreProvider } from '@/providers/counter-store-provider.tsx'
import { HomePage } from '@/components/pages/home-page.tsx'

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
// src/components/pages/home-page.tsx
'use client'

import { useCounterStore } from '@/providers/counter-store-provider'

export const HomePage = () => {
  const { count, incrementCount, decrementCount } = useCounterStore(
    (state) => state,
  )

  return (
    <div>
      Count: {count}
      <hr />
      <button type="button" onClick={incrementCount}>
        Increment Count
      </button>
      <button type="button" onClick={decrementCount}>
        Decrement Count
      </button>
    </div>
  )
}
```

```tsx
// src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

import { CounterStoreProvider } from '@/providers/counter-store-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Create Next App',
  description: 'Generated by create next app',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <CounterStoreProvider>{children}</CounterStoreProvider>
      </body>
    </html>
  )
}
```

```tsx
// src/app/page.tsx
import { HomePage } from '@/components/pages/home-page'

export default function Home() {
  return <HomePage />
}
```

> **Note:** creating a store per route would require creating and sharing the store
> at page (route) component level. Try not to use this if you do not need to create
> a store per route.

```tsx
// src/app/page.tsx
import { CounterStoreProvider } from '@/providers/counter-store-provider'
import { HomePage } from '@/components/pages/home-page'

export default function Home() {
  return (
    <CounterStoreProvider>
      <HomePage />
    </CounterStoreProvider>
  )
}
```
