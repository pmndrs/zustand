---
title: useStore
description:
nav: 213
---

# useStore ⚛️

`useStore` is a React Hook that lets you use a vanilla store in React.

```js
useStore(storeApi, selectorFn)
```

- [Reference](#reference)
  - [Signature](#usestore-signature)
- [Usage](#usage)
  - [Use a vanilla store in React](#use-a-vanilla-store-in-react)
  - [Using scoped (non-global) vanilla store in React](#using-scoped-non-global-vanilla-store-in-react)
- [Troubleshooting](#troubleshooting)
  - TBD

## Reference

### `useStore` Signature

```ts
useStore<StoreApi<T>, U = T>(storeApi: StoreApi<T>, selectorFn?: (state: T) => U) => UseBoundStore<StoreApi<T>>
```

#### Parameters

- `storeApi`: The instance that lets you access to store API utilities.
- `selectorFn`: A function that lets you return data that is based on current state.

#### Returns

`useStore` returns current state or returns any data based on current state depending on the
selector function.

## Usage

### Using a global vanilla store in React

TBD - Lorem, ipsum dolor sit amet consectetur adipisicing elit. Adipisci fugiat nobis, repellendus,
officiis rem qui facere maxime asperiores distinctio est maiores nam nisi ipsum quisquam sunt non,
dicta soluta quasi.

```tsx
import { createStore, useStore } from 'zustand'

type PositionStoreState = { x: number; y: number }

type PositionStoreActions = {
  setPosition: (nexPosition: Partial<PositionStoreState>) => void
}

type PositionStore = PositionStoreState & PositionStoreActions

const positionStore = createStore<PositionStore>()((set) => ({
  x: 0,
  y: 0,
  setPosition: (nextPosition) => {
    set(nextPosition)
  },
}))

export default function MovingDot() {
  const [position, setPosition] = useStore(positionStore, (state) => [
    { x: state.x, y: state.y },
    state.setPosition,
  ])

  return (
    <div
      onPointerMove={(e) => {
        setPosition({
          x: e.clientX,
          y: e.clientY,
        })
      }}
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
      }}
    >
      <div
        style={{
          position: 'absolute',
          backgroundColor: 'red',
          borderRadius: '50%',
          transform: `translate(${position.x}px, ${position.y}px)`,
          left: -10,
          top: -10,
          width: 20,
          height: 20,
        }}
      />
    </div>
  )
}
```

### Using scoped (non-global) vanilla store in React

TBD - Lorem ipsum dolor, sit amet consectetur adipisicing elit. Sed ex animi nemo sequi aperiam
debitis porro laudantium fugit amet, asperiores corporis fuga, nam nesciunt magni voluptatem
repudiandae, quam doloremque et?

```tsx
import { type ReactNode, useState, createContext, useContext } from 'react'
import { createStore, useStore } from 'zustand'

type PositionStoreState = { x: number; y: number }

type PositionStoreActions = {
  setPosition: (nexPosition: Partial<PositionStoreState>) => void
}

type PositionStore = PositionStoreState & PositionStoreActions

const createPositionStore = () => {
  return createStore<PositionStore>()((set) => ({
    x: 0,
    y: 0,
    setPosition: (nextPosition) => {
      set(nextPosition)
    },
  }))
}

const PositionStoreContext = createContext<ReturnType<
  typeof createPositionStore
> | null>(null)

function PositionStoreProvider({ children }: { children: ReactNode }) {
  const [positionStore] = useState(createPositionStore)

  return (
    <PositionStoreContext.Provider value={positionStore}>
      {children}
    </PositionStoreContext.Provider>
  )
}

function usePositionStore<U = PositionStore>(
  selector: (state: PositionStore) => U,
) {
  const store = useContext(PositionStoreContext)

  if (store === null) {
    throw new Error(
      'usePositionStore must be used within PositionStoreProvider',
    )
  }

  return useStore(store, selector)
}

function MovingDot({ color }: { color: string }) {
  const [position, setPosition] = usePositionStore(
    (state) => [{ x: state.x, y: state.y }, state.setPosition] as const,
  )

  return (
    <div
      onPointerMove={(e) => {
        setPosition({
          x:
            e.clientX > e.currentTarget.clientWidth
              ? e.clientX - e.currentTarget.clientWidth
              : e.clientX,
          y: e.clientY,
        })
      }}
      style={{
        position: 'relative',
        width: '50vw',
        height: '100vh',
      }}
    >
      <div
        style={{
          position: 'absolute',
          backgroundColor: color,
          borderRadius: '50%',
          transform: `translate(${position.x}px, ${position.y}px)`,
          left: -10,
          top: -10,
          width: 20,
          height: 20,
        }}
      />
    </div>
  )
}

export default function App() {
  return (
    <div style={{ display: 'flex' }}>
      <PositionStoreProvider>
        <MovingDot color="red" />
      </PositionStoreProvider>
      <PositionStoreProvider>
        <MovingDot color="blue" />
      </PositionStoreProvider>
    </div>
  )
}
```

## Troubleshooting

TBD
