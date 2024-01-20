---
title: SSR and Hydration
nav: 15
---

## Server Side Rendering (SSR)

Sever Side Rendering (SSR) is a technique that help us to render our components into
HTML strings on the server, send them directly to the browser, and finally "hydrate" the
static markup into a fully interactive app on the client.

### React

```tsx
// app.tsx
export const App = () => {
  return <div>Hello World!</div>
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
  const hmtl = ReactDOMServer.renderToString(<App />)

  res.send(`
    <title>Hello World Website</title>
    <div id="root">${html}</div>
  `)
})

app.listen(port, () => {
  console.log(`Server is listening at ${port}`)
})
```

## Hydration

Hydration turns the initial HTML snapshot from the server into a fully interactive app
that runs in the browser. The right way to "hydrate" a component is by using `hydrateRoot`

> **Warning:** The React tree you pass to `hydrateRoot` needs to produce the same output as it did on the server.
> The most common causes leading to hydration errors include:
>
> - Extra whitespace (like newlines) around the React-generated HTML inside the root node.
> - Using checks like typeof window !== 'undefined' in your rendering logic.
> - Using browser-only APIs like window.matchMedia in your rendering logic.
> - Rendering different data on the server and the client.
> - React recovers from some hydration errors, but you must fix them like other bugs. In the best case, they’ll lead to a slowdown; in the worst case, event handlers can get attached to the wrong elements.

You can read more about the caveats and pitfalls here: [hydrateRoot](https://react.dev/reference/react-dom/client/hydrateRoot)
