---
title: SSR and Hydration
nav: 20
---

## Server Side Rendering (SSR)

Sever Side Rendering (SSR) is a technique that help us to render our components into
HTML strings on the server, send them directly to the browser, and finally "hydrate" the
static markup into a fully interactive app on the client.

### React

Let's say we want to render an stateless app using react. In order to do that we need
to use `express`, `react` and `react-dom/server`, we don't need `react-dom/client`
since it's a statless app.

Let's dive into that:

- `express` help us to built a web app that we can run using node
- `react` help us to built the ui components that we use in our app
- `react-dom/server` help us to render our components on server side

```json
// package.json
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

> **Note:** try not to forget to remove all comments in your `package.json` file

```tsx
// app.tsx
export const App = () => {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Static Server Side Rendering App</title>
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
  const { pipe } = renderToPipeableStream(<App />, {
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
that runs in the browser. The right way to "hydrate" a component is by using `hydrateRoot`

### React

Let's say we want to render an statefull app using react. In order to do that we need to
use `express`, `react`, `react-dom/server` and `react-dom/client`.

Let's dive into that:

- `express` help us to built a web app that we can run using node
- `react` help us to built the ui components that we use in our app
- `react-dom/server` help us to render our components on server side
- `react-dom/client` help us to "hydrate" our components on client side

> **Note:** Do not forget that even if we can render our components on server side is
> important to "hydrate" them on client side to make them interactive

```json
// package.json
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

> **Note:** try not to forget to remove all comments in your `package.json` file

```tsx
// app.tsx
export const App = () => {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Static Server Side Rendering App</title>
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

ReactDOMClient.hydrateRoot(<App />, document)
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
  const { pipe } = renderToPipeableStream(<App />, {
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
> - Using browser-only APIs like window.matchMedia in your rendering logic.
> - Rendering different data on the server and the client.
>
> React recovers from some hydration errors, but you must fix them like other bugs. In the best case, they’ll lead to a slowdown; in the worst case, event handlers can get attached to the wrong elements.

You can read more about the caveats and pitfalls here: [hydrateRoot](https://react.dev/reference/react-dom/client/hydrateRoot)