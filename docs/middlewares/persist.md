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
  - [Persisting a partial state](#persisting-a-partial-state)
  - [Persisting a state with custom storage](#persisting-a-state-with-custom-storage)
- [Troubleshooting](#troubleshooting)
  - [Cannot read property `setOptions` of undefined](#cannot-read-property-setoptions-of-undefined)
  - [Storage is not being validated or type checked](#storage-is-not-being-validated-or-type-checked)
  - [Cannot read property `setItem`/`getItem`/`removeItem` of null](#cannot-read-property-setitemgetitemremoveitem-of-null)

## Types

### Signature

```ts
persist<T, U>(stateCreatorFn: StateCreator<T, [], []>, persistOptions?: PersistOptions<T, U>): StateCreator<T, [['zustand/persist', unknown]], []>
```

### Mutator

<!-- prettier-ignore-start -->
```ts
['zustand/persist', unknown]
```
<!-- prettier-ignore-end -->

## Reference

### `persist(stateCreatorFn)`

#### Parameters

- `stateCreatorFn`: The state creator function that specifies how the state gets initialized and
  updated. It must be pure, should take `setState` function, `getState` function and `storeApi` as
  arguments.
- `persistOptions`: An object to define storage options.
  - `name`: A unique name of the item for your store in the storage.
  - **optional** `storage`: Defaults to `createJSONStorage(() => localStorage)`. -
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

```ts
import { createStore } from 'zustand/vanilla'
import { persist } from 'zustand/middleware/persist'

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

render(positionStore.getInitialState(), positionStore.getInitialState())

positionStore.subscribe(render)
```

### Persisting a partial state

```ts
import { createStore } from 'zustand/vanilla'
import { persist } from 'zustand/middleware/persist'

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

render(positionStore.getInitialState(), positionStore.getInitialState())

positionStore.subscribe(render)
```

### Persisting a state with custom storage

```ts
import { createStore } from 'zustand/vanilla'
import { persist, createJSONStorage } from 'zustand/middleware/persist'

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
      storage: createJSONStorage(() => sessionStorage),
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

render(positionStore.getInitialState(), positionStore.getInitialState())

positionStore.subscribe(render)
```

## Troubleshooting

### Cannot read property `setOptions` of undefined

### Storage is not being validated or type checked

### Cannot read property `setItem`/`getItem`/`removeItem` of null
