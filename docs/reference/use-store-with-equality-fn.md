---
title: useStoreWithEqualityFn
description:
nav: 212
---

# useStoreWithEqualityFn ⚛️

`useStoreWithEqualityFn` is a React Hook that lets you use a vanilla store in React, just like
`useStore`. However, it offers a way to define a custom equality check. This allows for more
granular control over when components re-render, improving performance and responsiveness.

```js
useStoreWithEqualityFn(storeApi, selector, equalityFn)
```

- [Reference](#reference)
  - [Signature](#usestorewithequalityfn-signature)
- [Usage](#usage)
- [Troubleshooting](#troubleshooting)

## Reference

### `useStoreWithEqualityFn` Signature

```ts
useStoreWithEqualityFn<T, U>(storeApi: StoreApi<T>, selectorFn: (state: T) => U, equalityFn?: (a: T, b: T) => boolean): U
```

#### Parameters

- `storeApi`: The instance that lets you access to store API utilities.
- `selectorFn`: A function that lets you return data that is based on current state.
- `equalityFn`: A function that lets you skip re-renders.

#### Returns

`useStoreWithEqualityFn` returns Lorem ipsum dolor sit amet consectetur adipisicing elit. Sint
ipsam iure nesciunt consectetur magnam nulla nostrum ducimus repellendus. Maiores ducimus, expedita
architecto in placeat enim debitis non repudiandae veritatis neque.

## Usage

### Using a global vanilla store in React

TBD - Lorem, ipsum dolor sit amet consectetur adipisicing elit. Adipisci fugiat nobis, repellendus,
officiis rem qui facere maxime asperiores distinctio est maiores nam nisi ipsum quisquam sunt non,
dicta soluta quasi.

```tsx
import { createStore } from 'zustand'
import { useStoreWithEqualityFn } from 'zustand/traditional'
import { shallow } from 'zustand/vanilla/shallow'

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
  const [position, setPosition] = useStoreWithEqualityFn(
    positionStore,
    (state) => [{ x: state.x, y: state.y }, state.setPosition],
    shallow,
  )

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
import { useStoreWithEqualityFn } from 'zustand/traditional'
import { shallow } from 'zustand/vanilla/shallow'

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

  return useStoreWithEqualityFn(store, selector, shallow)
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
