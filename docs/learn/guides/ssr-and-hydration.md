---
title: SSR and Hydration
nav: 16
---

## Server-side Rendering (SSR)

Server-side Rendering (SSR) is a technique that helps us render our components into
HTML strings on the server, send them directly to the browser, and finally "hydrate" the
static markup into a fully interactive app on the client.

### React

Let's say we want to render a stateless app using React. In order to do that, we need
to use `express`, `react` and `react-dom/server`. We don't need `react-dom/client`
since it's a stateless app.

Let's dive into that:

- `express` helps us build a web app that we can run using Node,
- `react` helps us build the UI components that we use in our app,
- `react-dom/server` helps us render our components on a server.

```json
// tsconfig.json
{
  "compilerOptions": {
    "noImplicitAny": false,
    "noEmitOnError": true,
    "removeComments": false,
    "sourceMap": true,
    "target": "esnext"
  },
  "include": ["**/*"]
}
```

> **Note:** do not forget to remove all comments from your `tsconfig.json` file.

```tsx
// app.tsx
export const App = () => {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Static Server-side-rendered App</title>
      </head>
      <body>
        <div>Hello World!</div>
      </body>
    </html>
  )
}
```

```tsx
// server.tsx
import express from 'express'
import React from 'react'
import ReactDOMServer from 'react-dom/server'

import { App } from './app.tsx'

const port = Number.parseInt(process.env.PORT || '3000', 10)
const app = express()

app.get('/', (_, res) => {
  const { pipe } = ReactDOMServer.renderToPipeableStream(<App />, {
    onShellReady() {
      res.setHeader('content-type', 'text/html')
      pipe(res)
    },
  })
})

app.listen(port, () => {
  console.log(`Server is listening at ${port}`)
})
```

```sh
tsc --build
```

```sh
node server.js
```

## Hydration

Hydration turns the initial HTML snapshot from the server into a fully interactive app
that runs in the browser. The right way to "hydrate" a component is by using `hydrateRoot`.

### React

Let's say we want to render a stateful app using React. In order to do that we need to
use `express`, `react`, `react-dom/server` and `react-dom/client`.

Let's dive into that:

- `express` helps us build a web app that we can run using Node,
- `react` helps us build the UI components that we use in our app,
- `react-dom/server` helps us render our components on a server,
- `react-dom/client` helps us hydrate our components on a client.

> **Note:** Do not forget that even if we can render our components on a server, it is
> important to "hydrate" them on a client to make them interactive.

```json
// tsconfig.json
{
  "compilerOptions": {
    "noImplicitAny": false,
    "noEmitOnError": true,
    "removeComments": false,
    "sourceMap": true,
    "target": "esnext"
  },
  "include": ["**/*"]
}
```

> **Note:** do not forget to remove all comments in your `tsconfig.json` file.

```tsx
// app.tsx
export const App = () => {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Static Server-side-rendered App</title>
      </head>
      <body>
        <div>Hello World!</div>
      </body>
    </html>
  )
}
```

```tsx
// main.tsx
import ReactDOMClient from 'react-dom/client'

import { App } from './app.tsx'

ReactDOMClient.hydrateRoot(document, <App />)
```

```tsx
// server.tsx
import express from 'express'
import React from 'react'
import ReactDOMServer from 'react-dom/server'

import { App } from './app.tsx'

const port = Number.parseInt(process.env.PORT || '3000', 10)
const app = express()

app.use('/', (_, res) => {
  const { pipe } = ReactDOMServer.renderToPipeableStream(<App />, {
    bootstrapScripts: ['/main.js'],
    onShellReady() {
      res.setHeader('content-type', 'text/html')
      pipe(res)
    },
  })
})

app.listen(port, () => {
  console.log(`Server is listening at ${port}`)
})
```

```sh
tsc --build
```

```sh
node server.js
```

> **Warning:** The React tree you pass to `hydrateRoot` needs to produce the same output as it did on the server.
> The most common causes leading to hydration errors include:
>
> - Extra whitespace (like newlines) around the React-generated HTML inside the root node.
> - Using checks like typeof window !== 'undefined' in your rendering logic.
> - Using browser-only APIs like `window.matchMedia` in your rendering logic.
> - Rendering different data on the server and the client.
>
> React recovers from some hydration errors, but you must fix them like other bugs. In the best case, they’ll lead to a slowdown; in the worst case, event handlers can get attached to the wrong elements.

You can read more about the caveats and pitfalls here: [hydrateRoot](https://react.dev/reference/react-dom/client/hydrateRoot)

## Using `persist` middleware under SSR

A common source of hydration errors when using Zustand with an SSR framework
(Next.js, Remix, etc.) is the [`persist`](../../reference/middlewares/persist.md)
middleware. By default `persist` rehydrates from storage **during the first
client render**, so the component reads the stored value immediately — before
hydration finishes. The server rendered with the store's initial state, so the
two renders disagree and React aborts hydration, falling back to a full client
render of the subtree.

### Symptom

In production you see the minified
[React error #418 / #423 / #425](https://react.dev/errors/418) in the console
("Text content did not match. Server: ... Client: ..."). In dev the message
points at any component that reads a persisted store value — a header that
shows the cart item count, a layout that renders `locale`, etc.

### Fix: `skipHydration` + manual rehydrate

Tell `persist` not to rehydrate automatically, so the first client render
matches the server's default state. Then call `persist.rehydrate()` from a
`useEffect` after mount. The re-render triggered by the rehydrate happens
after hydration completes, so it's a normal state update, not a mismatch.

```ts
// src/stores/cart-store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type CartState = {
  items: string[]
  add: (item: string) => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (item) => set((state) => ({ items: [...state.items, item] })),
    }),
    {
      name: 'cart',
      skipHydration: true,
    },
  ),
)
```

```tsx
// src/components/store-rehydrator.tsx
'use client'

import { useEffect } from 'react'
import { useCartStore } from '@/stores/cart-store'

// Render once near the top of the tree (e.g. inside the App Router root
// layout's body). Rehydrate runs after mount, so the initial client render
// still matches the server HTML.
export function StoreRehydrator() {
  useEffect(() => {
    useCartStore.persist.rehydrate()
  }, [])
  return null
}
```

If you persist several stores, rehydrate them all from the same effect so the
initial defaults line up in a single pass:

```tsx
useEffect(() => {
  useCartStore.persist.rehydrate()
  useLanguageStore.persist.rehydrate()
  useSettingsStore.persist.rehydrate()
}, [])
```

### When not to use this pattern

- If the persisted store is only read by client-only components (e.g. a
  modal that mounts after user interaction), you don't need `skipHydration` —
  the default behavior is fine.
- If you render the persisted value behind a `useEffect`-driven "mounted"
  guard, that also sidesteps the mismatch without touching `persist` config.

`skipHydration` + `rehydrate()` is the right choice when the persisted store
is read during the initial render of components that are SSR'd.
