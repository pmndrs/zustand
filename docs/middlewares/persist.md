---
title: persist
description: How to persist a store
nav: 207
---

# persist

`persist` middleware lets you persist a store's state across page reloads or application
restarts.

```js
const nextStateCreatorFn = persist(stateCreatorFn, persistOptions)
```

- [Types](#types)
  - [Signature](#signature)
  - [Mutator](#mutator)
- [Reference](#reference)
- [Usage](#usage)
  - [Persisting a state](#persisting-a-state)
  - [Persisting a state partially](#persisting-a-state-partially)
  - [Persisting a state with custom storage](#persisting-a-state-with-custom-storage)
  - [Persisting a state through versioning and migrations](#persisting-a-state-through-versioning-and-migrations)
  - [Persisting a state with nested objects](#persisting-a-state-with-nested-objects)
  - [Persisting a state and hydrate it manually](#persisting-a-state-and-hydrate-it-manually)
  - [Clearing persisted data](#clearing-persisted-data)
  - [onRehydrateStorage patterns](#onrehydratestorage-patterns)
  - [Handling initial state](#handling-initial-state)
- [Troubleshooting](#troubleshooting)

## Types

### Signature

```ts
persist<T, U>(stateCreatorFn: StateCreator<T, [], []>, persistOptions?: PersistOptions<T, U>): StateCreator<T, [['zustand/persist', U]], []>
```

### Mutator

<!-- prettier-ignore-start -->
```ts
['zustand/persist', U]
```
<!-- prettier-ignore-end -->

## Reference

### `persist(stateCreatorFn)`

#### Parameters

- `stateCreatorFn`: A function that takes `set` function, `get` function and `store` as arguments.
  Usually, you will return an object with the methods you want to expose.
- `persistOptions`: An object to define storage options.
  - `name`: A unique name of the item for your store in the storage.
  - **optional** `storage`: Defaults to `createJSONStorage(() => localStorage)`.
  - **optional** `partialize`: A function to filter state fields before persisting it.
  - **optional** `onRehydrateStorage`: A function or function returning a function that allows
    custom logic before and after state rehydration.
  - **optional** `version`: A version number for the persisted state. If the stored state version
    doesn't match, it won't be used.
  - **optional** `migrate`: A function to migrate persisted state if the version mismatch occurs.
  - **optional** `merge`: A function for custom logic when merging persisted state with the current
    state during rehydration. Defaults to a shallow merge.
  - **optional** `skipHydration`: Defaults to `false`. If `true`, the middleware won't
    automatically rehydrate the state on initialization. Use `rehydrate` function manually in this
    case. This is useful for server-side rendering (SSR) applications.

#### Returns

`persist` returns a state creator function.

## Usage

### Persisting a state

In this tutorial, we'll create a simple position tracker using vanilla store and the `persist`
middleware. The example tracks the `position` of the mouse as it moves within a container and
stores the `position` in local storage, so it persists even when the page reloads.

We start by setting up a vanilla store that holds the position (an object with `x` and `y`
coordinates) and an action to update it. We'll also use the `persist` middleware to store the
position in `localStorage`.

```ts
import { createStore } from 'zustand/vanilla'
import { persist } from 'zustand/middleware'

type PositionStoreState = { position: { x: number; y: number } }

type PositionStoreActions = {
  setPosition: (nextPosition: PositionStoreState['position']) => void
}

type PositionStore = PositionStoreState & PositionStoreActions

const positionStore = createStore<PositionStore>()(
  persist(
    (set) => ({
      position: { x: 0, y: 0 },
      setPosition: (position) => set({ position }),
    }),
    { name: 'position-storage' },
  ),
)
```

Next, we'll track the mouse movements inside a div and update the store with the new position.

```ts
const $dotContainer = document.getElementById('dot-container') as HTMLDivElement
const $dot = document.getElementById('dot') as HTMLDivElement

$dotContainer.addEventListener('pointermove', (event) => {
  positionStore.getState().setPosition({
    x: event.clientX,
    y: event.clientY,
  })
})
```

We want to reflect the position updates on the screen by moving a div element
(representing the dot) to the new coordinates.

```ts
const render: Parameters<typeof positionStore.subscribe>[0] = (state) => {
  $dot.style.transform = `translate(${state.position.x}px, ${state.position.y}px)`
}

render(positionStore.getState(), positionStore.getState())

positionStore.subscribe(render)
```

Here's the complete code.

```ts
import { createStore } from 'zustand/vanilla'
import { persist } from 'zustand/middleware'

type PositionStoreState = { position: { x: number; y: number } }

type PositionStoreActions = {
  setPosition: (nextPosition: PositionStoreState['position']) => void
}

type PositionStore = PositionStoreState & PositionStoreActions

const positionStore = createStore<PositionStore>()(
  persist(
    (set) => ({
      position: { x: 0, y: 0 },
      setPosition: (position) => set({ position }),
    }),
    { name: 'position-storage' },
  ),
)

const $dotContainer = document.getElementById('dot-container') as HTMLDivElement
const $dot = document.getElementById('dot') as HTMLDivElement

$dotContainer.addEventListener('pointermove', (event) => {
  positionStore.getState().setPosition({
    x: event.clientX,
    y: event.clientY,
  })
})

const render: Parameters<typeof positionStore.subscribe>[0] = (state) => {
  $dot.style.transform = `translate(${state.position.x}px, ${state.position.y}px)`
}

render(positionStore.getState(), positionStore.getState())

positionStore.subscribe(render)
```

Here's the `HTML` code

```html
<div
  id="dot-container"
  style="position: relative; width: 100vw; height: 100vh;"
>
  <div
    id="dot"
    style="position: absolute; background-color: red; border-radius: 50%; left: -10px; top: -10px; width: 20px; height: 20px;"
  ></div>
</div>
```

### Persisting a state partially

In this tutorial, we'll create a simple position tracker using vanilla store and the `persist`
middleware. Additionally, we'll show you how to persist only part of the state
(partial persistence), which can be useful when you don't want to store the entire state in
`localStorage`.

We'll first create a vanilla store that holds the position state and actions to update it. We'll
use the `persist` middleware to persist only the relevant part of the state (in this case, the
context containing the position).

```ts
import { createStore } from 'zustand/vanilla'
import { persist } from 'zustand/middleware'

type PositionStoreState = {
  context: {
    position: { x: number; y: number }
  }
}

type PositionStoreActions = {
  actions: {
    setPosition: (
      nextPosition: PositionStoreState['context']['position'],
    ) => void
  }
}

type PositionStore = PositionStoreState & PositionStoreActions

const positionStore = createStore<PositionStore>()(
  persist(
    (set) => ({
      context: {
        position: { x: 0, y: 0 },
      },
      actions: {
        setPosition: (position) => set({ context: { position } }),
      },
    }),
    {
      name: 'position-storage',
      partialize: (state) => ({ context: state.context }),
    },
  ),
)
```

Next, we'll track the mouse movements inside a div and update the store with the new position.

```ts
const $dotContainer = document.getElementById('dot-container') as HTMLDivElement
const $dot = document.getElementById('dot') as HTMLDivElement

$dotContainer.addEventListener('pointermove', (event) => {
  positionStore.getState().actions.setPosition({
    x: event.clientX,
    y: event.clientY,
  })
})
```

We want to reflect the position updates on the screen by moving a div element
(representing the dot) to the new coordinates.

```ts
const render: Parameters<typeof positionStore.subscribe>[0] = (state) => {
  $dot.style.transform = `translate(${state.context.position.x}px, ${state.context.position.y}px)`
}

render(positionStore.getState(), positionStore.getState())

positionStore.subscribe(render)
```

Here's the full code to create a dot that follows your mouse movement inside a container and
persists the `context` in `localStorage`.

```ts
import { createStore } from 'zustand/vanilla'
import { persist } from 'zustand/middleware'

type PositionStoreState = {
  context: {
    position: { x: number; y: number }
  }
}

type PositionStoreActions = {
  actions: {
    setPosition: (
      nextPosition: PositionStoreState['context']['position'],
    ) => void
  }
}

type PositionStore = PositionStoreState & PositionStoreActions

const positionStore = createStore<PositionStore>()(
  persist(
    (set) => ({
      context: {
        position: { x: 0, y: 0 },
      },
      actions: {
        setPosition: (position) => set({ context: { position } }),
      },
    }),
    {
      name: 'position-storage',
      partialize: (state) => ({ context: state.context }),
    },
  ),
)

const $dotContainer = document.getElementById('dot-container') as HTMLDivElement
const $dot = document.getElementById('dot') as HTMLDivElement

$dotContainer.addEventListener('pointermove', (event) => {
  positionStore.getState().actions.setPosition({
    x: event.clientX,
    y: event.clientY,
  })
})

const render: Parameters<typeof positionStore.subscribe>[0] = (state) => {
  $dot.style.transform = `translate(${state.context.position.x}px, ${state.context.position.y}px)`
}

render(positionStore.getState(), positionStore.getState())

positionStore.subscribe(render)
```

Here's the `HTML` code

```html
<div
  id="dot-container"
  style="position: relative; width: 100vw; height: 100vh;"
>
  <div
    id="dot"
    style="position: absolute; background-color: red; border-radius: 50%; left: -10px; top: -10px; width: 20px; height: 20px;"
  ></div>
</div>
```

### Persisting a state with custom storage

In this mini tutorial, we'll create a simple position-tracking system using vanilla store, where
the position state is persisted in the URL's search parameters. This approach allows state
persistence directly in the browser's URL, which can be useful for maintaining state across page
reloads or sharing links with state embedded.

We need to implement functions to manipulate URL search parameters as if they were a storage
mechanism. This includes retrieving, setting, and removing parameters.

```ts
const getSearchParams = () => {
  return new URL(location.href).searchParams
}

const updateSearchParams = (searchParams: URLSearchParams) => {
  window.history.replaceState(
    {},
    '',
    `${location.pathname}?${searchParams.toString()}`,
  )
}

const getSearchParam = (key: string) => {
  const searchParams = getSearchParams()
  return searchParams.get(key)
}

const updateSearchParam = (key: string, value: string) => {
  const searchParams = getSearchParams()
  searchParams.set(key, value)

  updateSearchParams(searchParams)
}

const removeSearchParam = (key: string) => {
  const searchParams = getSearchParams()
  searchParams.delete(key)

  updateSearchParams(searchParams)
}
```

To use the URL search parameters as storage, we define a `searchParamsStorage` object with
`getItem`, `setItem`, and `removeItem` methods. These methods map to our custom functions that
manipulate search parameters.

```ts
const searchParamsStorage = {
  getItem: (key: string) => getSearchParam(key),
  setItem: (key: string, value: string) => updateSearchParam(key, value),
  removeItem: (key: string) => removeSearchParam(key),
}
```

Now, we initialize the vanilla store using the `persist` middleware, specifying that we want to use
our custom storage. Instead of the default `localStorage` or `sessionStorage`, we'll persist the
position data in the URL search parameters.

```ts
import { createStore } from 'zustand/vanilla'
import { persist, createJSONStorage } from 'zustand/middleware'

type PositionStoreState = { position: { x: number; y: number } }

type PositionStoreActions = {
  setPosition: (nextPosition: PositionStoreState['position']) => void
}

type PositionStore = PositionStoreState & PositionStoreActions

const positionStore = createStore<PositionStore>()(
  persist(
    (set) => ({
      position: { x: 0, y: 0 },
      setPosition: (position) => set({ position }),
    }),
    {
      name: 'position-storage',
      storage: createJSONStorage(() => searchParamsStorage),
    },
  ),
)
```

Next, we'll track the mouse movements inside a div and update the store with the new position.

```ts
const $dotContainer = document.getElementById('dot-container') as HTMLDivElement
const $dot = document.getElementById('dot') as HTMLDivElement

$dotContainer.addEventListener('pointermove', (event) => {
  positionStore.getState().setPosition({
    x: event.clientX,
    y: event.clientY,
  })
})
```

We want to reflect the position updates on the screen by moving a div element
(representing the dot) to the new coordinates.

```ts
const render: Parameters<typeof positionStore.subscribe>[0] = (state) => {
  $dot.style.transform = `translate(${state.position.x}px, ${state.position.y}px)`
}

render(positionStore.getState(), positionStore.getState())

positionStore.subscribe(render)
```

Here's the full code to create a dot that follows your mouse movement inside a container and
persists the position in URL's search parameters.

```ts
import { createStore } from 'zustand/vanilla'
import { persist, createJSONStorage } from 'zustand/middleware'

type PositionStoreState = { position: { x: number; y: number } }

type PositionStoreActions = {
  setPosition: (nextPosition: PositionStoreState['position']) => void
}

type PositionStore = PositionStoreState & PositionStoreActions

const getSearchParams = () => {
  return new URL(location.href).searchParams
}

const updateSearchParams = (searchParams: URLSearchParams) => {
  window.history.replaceState(
    {},
    '',
    `${location.pathname}?${searchParams.toString()}`,
  )
}

const getSearchParam = (key: string) => {
  const searchParams = getSearchParams()
  return searchParams.get(key)
}

const updateSearchParam = (key: string, value: string) => {
  const searchParams = getSearchParams()
  searchParams.set(key, value)

  updateSearchParams(searchParams)
}

const removeSearchParam = (key: string) => {
  const searchParams = getSearchParams()
  searchParams.delete(key)

  updateSearchParams(searchParams)
}

const searchParamsStorage = {
  getItem: (key: string) => getSearchParam(key),
  setItem: (key: string, value: string) => updateSearchParam(key, value),
  removeItem: (key: string) => removeSearchParam(key),
}

const positionStore = createStore<PositionStore>()(
  persist(
    (set) => ({
      position: { x: 0, y: 0 },
      setPosition: (position) => set({ position }),
    }),
    {
      name: 'position-storage',
      storage: createJSONStorage(() => searchParamsStorage),
    },
  ),
)

const $dotContainer = document.getElementById('dot-container') as HTMLDivElement
const $dot = document.getElementById('dot') as HTMLDivElement

$dotContainer.addEventListener('pointermove', (event) => {
  positionStore.getState().setPosition({
    x: event.clientX,
    y: event.clientY,
  })
})

const render: Parameters<typeof positionStore.subscribe>[0] = (state) => {
  $dot.style.transform = `translate(${state.position.x}px, ${state.position.y}px)`
}

render(positionStore.getState(), positionStore.getState())

positionStore.subscribe(render)
```

Here's the `HTML` code

```html
<div
  id="dot-container"
  style="position: relative; width: 100vw; height: 100vh;"
>
  <div
    id="dot"
    style="position: absolute; background-color: red; border-radius: 50%; left: -10px; top: -10px; width: 20px; height: 20px;"
  ></div>
</div>
```

### Persisting a state through versioning and migrations

In this tutorial, we'll explore how to manage state persistence using versioning and migration.
We will demonstrate how to evolve your state schema across versions without breaking existing
persisted data.

Before moving to versioned state management, we simulate an initial state for `version` 0. This is
done by manually setting a `version` 0 state in `localStorage` if it doesn't already exist. The
`version` 0 state saves the coordinates as `x` and `y` fields.

```ts
// For tutorial purposes only
if (!localStorage.getItem('position-storage')) {
  localStorage.setItem(
    'position-storage',
    JSON.stringify({
      state: { x: 100, y: 100 }, // version 0 structure
      version: 0,
    }),
  )
}
```

Next, we use `persist` middleware to handle state persistence. We also add a migration function to
handle changes between versions. In this example, we `migrate` the state from `version` 0 (where
`x` and `y` are separate) to `version` 1, where they are combined into a `position` object.

```ts
migrate: (persisted: any, version) => {
  if (version === 0) {
    persisted.position = { x: persisted.x, y: persisted.y }
    delete persisted.x
    delete persisted.y
  }

  return persisted
}
```

Next, we'll track the mouse movements inside a div and update the store with the new position.

```ts
const $dotContainer = document.getElementById('dot-container') as HTMLDivElement
const $dot = document.getElementById('dot') as HTMLDivElement

$dotContainer.addEventListener('pointermove', (event) => {
  positionStore.getState().setPosition({
    x: event.clientX,
    y: event.clientY,
  })
})
```

We want to reflect the position updates on the screen by moving a div element
(representing the dot) to the new coordinates.

```ts
const render: Parameters<typeof positionStore.subscribe>[0] = (state) => {
  $dot.style.transform = `translate(${state.position.x}px, ${state.position.y}px)`
}

render(positionStore.getState(), positionStore.getState())

positionStore.subscribe(render)
```

Here's the complete code.

```ts
import { createStore } from 'zustand/vanilla'
import { persist } from 'zustand/middleware'

// For tutorial purposes only
if (!localStorage.getItem('position-storage')) {
  localStorage.setItem(
    'position-storage',
    JSON.stringify({
      state: { x: 100, y: 100 },
      version: 0,
    }),
  )
}

type PositionStoreState = { position: { x: number; y: number } }

type PositionStoreActions = {
  setPosition: (nextPosition: PositionStoreState['position']) => void
}

type PositionStore = PositionStoreState & PositionStoreActions

const positionStore = createStore<PositionStore>()(
  persist(
    (set) => ({
      position: { x: 0, y: 0 }, // version 0: just x: 0, y: 0
      setPosition: (position) => set({ position }),
    }),
    {
      name: 'position-storage',
      version: 1,
      migrate: (persisted: any, version) => {
        if (version === 0) {
          persisted.position = { x: persisted.x, y: persisted.y }
          delete persisted.x
          delete persisted.y
        }

        return persisted
      },
    },
  ),
)

const $dotContainer = document.getElementById('dot-container') as HTMLDivElement
const $dot = document.getElementById('dot') as HTMLDivElement

$dotContainer.addEventListener('pointermove', (event) => {
  positionStore.getState().setPosition({
    x: event.clientX,
    y: event.clientY,
  })
})

const render: Parameters<typeof positionStore.subscribe>[0] = (state) => {
  $dot.style.transform = `translate(${state.position.x}px, ${state.position.y}px)`
}

render(positionStore.getState(), positionStore.getState())

positionStore.subscribe(render)
```

Here's the `HTML` code

```html
<div
  id="dot-container"
  style="position: relative; width: 100vw; height: 100vh;"
>
  <div
    id="dot"
    style="position: absolute; background-color: red; border-radius: 50%; left: -10px; top: -10px; width: 20px; height: 20px;"
  ></div>
</div>
```

### Persisting a state with nested objects

In this tutorial, we'll create a vanilla store that keeps track of a position represented by `x`
and `y` coordinates. We will also implement persistence using `localStorage` and demonstrate how to
handle merging of state with potentially missing fields.

To simulate an initial state for the tutorial, we will check if our position data exists in
`localStorage`. If it doesn't, we'll set it up.

```ts
if (!localStorage.getItem('position-storage')) {
  localStorage.setItem(
    'position-storage',
    JSON.stringify({
      state: { position: { y: 100 } }, // missing `x` field
      version: 0,
    }),
  )
}
```

Now, we will create the store and configure it to use persistence and deep merging.

```ts
import { createStore } from 'zustand/vanilla'
import { persist } from 'zustand/middleware'
import createDeepMerge from '@fastify/deepmerge'

const deepMerge = createDeepMerge({ all: true })

type PositionStoreState = { position: { x: number; y: number } }

type PositionStoreActions = {
  setPosition: (nextPosition: PositionStoreState['position']) => void
}

type PositionStore = PositionStoreState & PositionStoreActions

const positionStore = createStore<PositionStore>()(
  persist(
    (set) => ({
      position: { x: 0, y: 0 },
      setPosition: (position) => set({ position }),
    }),
    {
      name: 'position-storage',
      merge: (persisted, current) => deepMerge(current, persisted) as never,
    },
  ),
)
```

Next, we'll track the mouse movements inside a div and update the store with the new position.

```ts
const $dotContainer = document.getElementById('dot-container') as HTMLDivElement
const $dot = document.getElementById('dot') as HTMLDivElement

$dotContainer.addEventListener('pointermove', (event) => {
  positionStore.getState().setPosition({
    x: event.clientX,
    y: event.clientY,
  })
})
```

We want to reflect the position updates on the screen by moving a div element
(representing the dot) to the new coordinates.

```ts
const render: Parameters<typeof positionStore.subscribe>[0] = (state) => {
  $dot.style.transform = `translate(${state.position.x}px, ${state.position.y}px)`
}

render(positionStore.getState(), positionStore.getState())

positionStore.subscribe(render)
```

Here's the complete code.

```ts
import { createStore } from 'zustand/vanilla'
import { persist } from 'zustand/middleware'
import createDeepMerge from '@fastify/deepmerge'

const deepMerge = createDeepMerge({ all: true })

// For tutorial purposes only
if (!localStorage.getItem('position-storage')) {
  localStorage.setItem(
    'position-storage',
    JSON.stringify({
      state: { position: { y: 100 } }, // missing `x` field
      version: 0,
    }),
  )
}

type PositionStoreState = { position: { x: number; y: number } }

type PositionStoreActions = {
  setPosition: (nextPosition: PositionStoreState['position']) => void
}

type PositionStore = PositionStoreState & PositionStoreActions

const positionStore = createStore<PositionStore>()(
  persist(
    (set) => ({
      position: { x: 0, y: 0 },
      setPosition: (position) => set({ position }),
    }),
    {
      name: 'position-storage',
      merge: (persisted, current) => deepMerge(current, persisted) as never,
    },
  ),
)

const $dotContainer = document.getElementById('dot-container') as HTMLDivElement
const $dot = document.getElementById('dot') as HTMLDivElement

$dotContainer.addEventListener('pointermove', (event) => {
  positionStore.getState().setPosition({
    x: event.clientX,
    y: event.clientY,
  })
})

const render: Parameters<typeof positionStore.subscribe>[0] = (state) => {
  console.log({ state })
  $dot.style.transform = `translate(${state.position.x}px, ${state.position.y}px)`
}

render(positionStore.getState(), positionStore.getState())

positionStore.subscribe(render)
```

Here's the `HTML` code

```html
<div
  id="dot-container"
  style="position: relative; width: 100vw; height: 100vh;"
>
  <div
    id="dot"
    style="position: absolute; background-color: red; border-radius: 50%; left: -10px; top: -10px; width: 20px; height: 20px;"
  ></div>
</div>
```

### Persisting a state and hydrate it manually

In this tutorial, we'll create a vanilla store that keeps track of a position represented by `x`
and `y` coordinates. We will also implement persistence using `localStorage` and explore how to
skip the hydration process and manually trigger rehydration after a delay.

We start by setting up a vanilla store that holds the position (an object with `x` and `y`
coordinates) and an action to update it. Furthermore, we'll also use the `persist` middleware to
store the position in `localStorage` but skipping hydration.

```ts
import { createStore } from 'zustand/vanilla'
import { persist } from 'zustand/middleware'

type PositionStoreState = { position: { x: number; y: number } }

type PositionStoreActions = {
  setPosition: (nextPosition: PositionStoreState['position']) => void
}

type PositionStore = PositionStoreState & PositionStoreActions

const positionStore = createStore<PositionStore>()(
  persist(
    (set) => ({
      position: { x: 0, y: 0 },
      setPosition: (position) => set({ position }),
    }),
    {
      name: 'position-storage',
      skipHydration: true,
    },
  ),
)
```

Since we skipped hydration in the initial setup, we will manually rehydrate the state. Here, we're
using `setTimeout` to simulate a delayed rehydration.

```ts
setTimeout(() => {
  positionStore.persist.rehydrate()
}, 2000)
```

Next, we'll track the mouse movements inside a div and update the store with the new position.

```ts
const $dotContainer = document.getElementById('dot-container') as HTMLDivElement
const $dot = document.getElementById('dot') as HTMLDivElement

$dotContainer.addEventListener('pointermove', (event) => {
  positionStore.getState().setPosition({
    x: event.clientX,
    y: event.clientY,
  })
})
```

We want to reflect the position updates on the screen by moving a div element
(representing the dot) to the new coordinates.

```ts
const render: Parameters<typeof positionStore.subscribe>[0] = (state) => {
  $dot.style.transform = `translate(${state.position.x}px, ${state.position.y}px)`
}

render(positionStore.getState(), positionStore.getState())

positionStore.subscribe(render)
```

Here's the complete code.

```ts
import { createStore } from 'zustand/vanilla'
import { persist } from 'zustand/middleware'

type PositionStoreState = { position: { x: number; y: number } }

type PositionStoreActions = {
  setPosition: (nextPosition: PositionStoreState['position']) => void
}

type PositionStore = PositionStoreState & PositionStoreActions

const positionStore = createStore<PositionStore>()(
  persist(
    (set) => ({
      position: { x: 0, y: 0 },
      setPosition: (position) => set({ position }),
    }),
    {
      name: 'position-storage',
      skipHydration: true,
    },
  ),
)

const $dotContainer = document.getElementById('dot-container') as HTMLDivElement
const $dot = document.getElementById('dot') as HTMLDivElement

$dotContainer.addEventListener('pointermove', (event) => {
  positionStore.getState().setPosition({
    x: event.clientX,
    y: event.clientY,
  })
})

const render: Parameters<typeof positionStore.subscribe>[0] = (state) => {
  $dot.style.transform = `translate(${state.position.x}px, ${state.position.y}px)`
}

setTimeout(() => {
  positionStore.persist.rehydrate()
}, 2000)

render(positionStore.getState(), positionStore.getState())

positionStore.subscribe(render)
```

Here's the `HTML` code

```html
<div
  id="dot-container"
  style="position: relative; width: 100vw; height: 100vh;"
>
  <div
    id="dot"
    style="position: absolute; background-color: red; border-radius: 50%; left: -10px; top: -10px; width: 20px; height: 20px;"
  ></div>
</div>
```

### Clearing persisted data

In this tutorial, we'll explore how to clear persisted data from your store. This is useful when
users want to reset their application state or when you need to clear sensitive information.

There are several ways to clear persisted data depending on your use case.

#### Clear all persisted data

To clear all persisted data for a store, use the `clearStorage` method:

```ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Store = {
  count: number
  increment: () => void
  reset: () => void
}

const useStore = create<Store>()(
  persist(
    (set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 })),
      reset: () => set({ count: 0 }),
    }),
    { name: 'my-store' },
  ),
)

// Clear all persisted data
useStore.persist.clearStorage()
```

#### Clear specific key

If you need to clear data for a specific store, you can remove it directly from storage:

```ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useStore = create()(
  persist(
    (set) => ({ count: 0 }),
    { name: 'my-store' },
  ),
)

// Clear the specific store's data
localStorage.removeItem('my-store')
```

#### User-triggered reset pattern

A common pattern is to provide a reset button that clears persisted data:

```ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Store = {
  formData: { name: string; email: string } | null
  setFormData: (data: { name: string; email: string }) => void
  clearForm: () => void
}

const useFormStore = create<Store>()(
  persist(
    (set) => ({
      formData: null,
      setFormData: (data) => set({ formData: data }),
      clearForm: () => set({ formData: null }),
    }),
    { name: 'form-storage' },
  ),
)

function ResetButton() {
  const clearForm = useFormStore((state) => state.clearForm)
  const clearStorage = useFormStore.persist.clearStorage

  const handleReset = () => {
    clearForm()
    clearStorage()
  }

  return <button onClick={handleReset}>Clear All Data</button>
}
```

### onRehydrateStorage patterns

The `onRehydrateStorage` option allows you to execute logic before and after the store is hydrated
from storage. This is useful for logging, analytics, or coordinating with other systems.

#### Basic pattern

The simplest pattern is to return a callback that runs after hydration:

```ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useStore = create()(
  persist(
    (set) => ({ count: 0 }),
    {
      name: 'my-store',
      onRehydrateStorage: () => (state) => {
        console.log('hydration finished', state)
      },
    },
  ),
)
```

#### Before and after callbacks

You can also track both before and after hydration by returning a function from the callback:

```ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useStore = create()(
  persist(
    (set) => ({ count: 0 }),
    {
      name: 'my-store',
      onRehydrateStorage: () => (state) => {
        console.log('about to hydrate', state)
        return (finalState) => {
          console.log('hydrated', finalState)
        }
      },
    },
  ),
)
```

#### Async initialization

You can use the hydration callback to perform async operations like tracking analytics:

```ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useStore = create()(
  persist(
    (set) => ({
      count: 0,
      lastVisit: null,
    }),
    {
      name: 'my-store',
      onRehydrateStorage: () => async (state) => {
        if (state) {
          // Track that state was restored
          await analytics.track('stateRestored', {
            count: state.count,
            lastVisit: state.lastVisit,
          })
        }
      },
    },
  ),
)
```

#### Error handling

You can also handle hydration errors:

```ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useStore = create()(
  persist(
    (set) => ({ count: 0 }),
    {
      name: 'my-store',
      onRehydrateStorage: () => (state) => {
        console.log('hydration completed successfully')
      },
    },
  ),
)
```

### Handling initial state

By default, Zustand returns the initial state immediately, then hydrates from storage. This means
your store will have the default values first, then update with persisted values after hydration.

#### Store-first behavior

By default, the store returns initial state before hydration completes:

```ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useStore = create()(
  persist(
    (set) => ({
      isLoading: true,
      data: null,
      count: 0,
    }),
    { name: 'my-store' },
  ),
)

// Initially: { isLoading: true, data: null, count: 0 }
// After hydration: { isLoading: false, data: {...}, count: 5 }
```

#### Loading state pattern

A common pattern is to track loading state:

```ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useStore = create()(
  persist(
    (set) => ({
      isLoading: true,
      data: null,
      count: 0,
      _hasHydrated: false,
    }),
    {
      name: 'my-store',
      onRehydrateStorage: () => (state) => {
        if (state) {
          state._hasHydrated = true
        }
      },
    },
  ),
)

// In your component:
function MyComponent() {
  const isLoading = useStore((state) => state.isLoading)
  const hasHydrated = useStore((state) => state._hasHydrated)

  if (isLoading || !hasHydrated) {
    return <Loading />
  }

  return <Content />
}
```

#### Skipping automatic hydration

For SSR or when you need more control, use `skipHydration`:

```ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useStore = create()(
  persist(
    (set) => ({
      count: 0,
      _hydrated: false,
    }),
    {
      name: 'my-store',
      skipHydration: true,
    },
  ),
)

// Manually trigger hydration when ready
useStore.persist.rehydrate()

// Or track when it completes
useStore.persist.onHydrate(() => {
  console.log('hydration triggered')
})
```

## Troubleshooting

### State not persisting across page reloads

If your state isn't being persisted, check the following:

1. **Unique name**: Ensure each store has a unique `name` in persist options.
2. **Storage availability**: Verify `localStorage` is available (may be blocked in private browsing).
3. **Storage quota**: Check if storage quota has been exceeded (5MB limit in most browsers).

```ts
const useStore = create()(
  persist(
    (set) => ({ count: 0 }),
    { name: 'my-unique-store-name' },
  ),
)
```

### Hydration mismatch errors in React

If you see hydration errors in React, you may need to skip initial hydration for SSR:

```ts
const useStore = create()(
  persist(
    (set) => ({ count: 0 }),
    {
      name: 'my-store',
      skipHydration: true,
    },
  ),
)

// In your component
useEffect(() => {
  useStore.persist.rehydrate()
}, [])
```

### State merging unexpectedly

By default, persisted state is merged shallowly. If you have nested objects, use the `merge` option:

```ts
merge: (persisted, current) => deepMerge(current, persisted),
```

### Migration not running

Make sure your `version` option is set higher than the stored version:

```ts
{
  name: 'my-store',
  version: 1, // Increment this when making breaking changes
  migrate: (persisted, version) => {
    // Migration logic
  },
}
```

### Custom storage not working

Ensure your custom storage implements the correct interface:

```ts
const customStorage = {
  getItem: (name: string) => string | null | Promise<string | null>,
  setItem: (name: string, value: string) => void,
  removeItem: (name: string) => void,
}
```

If using `createJSONStorage`, your storage should return raw JSON strings.

## Related

- [zustand-persist-plus](https://github.com/PeterPCW/zustand-persist-plus) — Advanced persistence extensions including encryption, compression, migrations, and cloud sync adapters
