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
useStoreWithEqualityFn(storeApi, selectorFn, equalityFn)
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

First, let's set up a store that will hold the position of the dot on the screen. We'll define the
store to manage `x` and `y` coordinates and provide an action to update these coordinates.

```tsx
import { createStore } from 'zustand/vanilla'
import { useStoreWithEqualityFn } from 'zustand/traditional'
import { shallow } from 'zustand/shallow'

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
```

Next, we'll create a `MovingDot` component that renders a div representing the dot. This component
will use the store to track and update the dot's position.

```tsx
function MovingDot() {
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

Finally, we’ll render the `MovingDot` component in our `App` component.

```tsx
export default function App() {
  return <MovingDot />
}
```

Here is what the code should look like:

```tsx
import { createStore } from 'zustand/vanilla'
import { useStoreWithEqualityFn } from 'zustand/traditional'
import { shallow } from 'zustand/shallow'

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

function MovingDot() {
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

export default function App() {
  return <MovingDot />
}
```

### Using scoped (non-global) vanilla store in React

First, let's set up a store that will hold the position of the dot on the screen. We'll define the
store to manage `x` and `y` coordinates and provide an action to update these coordinates.

```tsx
import { createStore } from 'zustand/vanilla'

type PositionStoreState = { x: number; y: number }

type PositionStoreActions = {
  setPosition: (nextPosition: Partial<PositionStoreState>) => void
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
```

Next, we'll create a context and a provider component to pass down the store through the React
component tree. This allows each `MovingDot` component to have its own independent state.

```tsx
import { type ReactNode, createContext, useState, useContext } from 'react'

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
```

To simplify accessing the store, we’ll create a React custom hook, `usePositionStore`. This hook
will read the store from the context and allow us to select specific parts of the state.

```ts
import { useStoreWithEqualityFn } from 'zustand/traditional'
import { shallow } from 'zustand/shallow'

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
```

Now, let's create the `MovingDot` component, which will render a dot that follows the mouse cursor
within its container.

```tsx
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
```

Finally, we'll bring everything together in the `App` component, where we render two `MovingDot`
components, each with its own independent state.

```tsx
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

Here is what the code should look like:

```tsx
import { type ReactNode, useState, createContext, useContext } from 'react'
import { createStore } from 'zustand/vanilla'
import { useStoreWithEqualityFn } from 'zustand/traditional'
import { shallow } from 'zustand/shallow'

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

### Using dynamic scoped (non-global) vanilla stores in React

First, we'll create a factory function that generates a store for managing the counter state.
Each tab will have its own instance of this store.

```ts
import { createStore } from 'zustand/vanilla'

type CounterState = {
  count: number
}

type CounterActions = { increment: () => void }

type CounterStore = CounterState & CounterActions

const createCounterStore = () => {
  return createStore<CounterStore>()((set) => ({
    count: 0,
    increment: () => {
      set((state) => ({ count: state.count + 1 }))
    },
  }))
}
```

Next, we'll create a factory function that manages the creation and retrieval of counter stores.
This allows each tab to have its own independent counter.

```ts
const defaultCounterStores = new Map<
  string,
  ReturnType<typeof createCounterStore>
>()

const createCounterStoreFactory = (
  counterStores: typeof defaultCounterStores,
) => {
  return (counterStoreKey: string) => {
    if (!counterStores.has(counterStoreKey)) {
      counterStores.set(counterStoreKey, createCounterStore())
    }
    return counterStores.get(counterStoreKey)!
  }
}

const getOrCreateCounterStoreByKey =
  createCounterStoreFactory(defaultCounterStores)
```

Finally, we'll create the `App` component, which renders the tabs and their respective counters.
The counter state is managed independently for each tab.

```tsx
export default function App() {
  const [currentTabIndex, setCurrentTabIndex] = useState(0)
  const counterState = useStoreWithEqualityFn(
    getOrCreateCounterStoreByKey(`tab-${currentTabIndex}`),
    (state) => state,
    shallow,
  )

  return (
    <div style={{ fontFamily: 'monospace' }}>
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid salmon',
          paddingBottom: 4,
        }}
      >
        <button
          type="button"
          style={{
            border: '1px solid salmon',
            backgroundColor: '#fff',
            cursor: 'pointer',
          }}
          onClick={() => setCurrentTabIndex(0)}
        >
          Tab 1
        </button>
        <button
          type="button"
          style={{
            border: '1px solid salmon',
            backgroundColor: '#fff',
            cursor: 'pointer',
          }}
          onClick={() => setCurrentTabIndex(1)}
        >
          Tab 2
        </button>
        <button
          type="button"
          style={{
            border: '1px solid salmon',
            backgroundColor: '#fff',
            cursor: 'pointer',
          }}
          onClick={() => setCurrentTabIndex(2)}
        >
          Tab 3
        </button>
      </div>
      <div style={{ padding: 4 }}>
        Content of Tab {currentTabIndex + 1}
        <br /> <br />
        <button type="button" onClick={() => counterState.increment()}>
          Count: {counterState.count}
        </button>
      </div>
    </div>
  )
}
```

Here is what the code should look like:

```tsx
import { useState } from 'react'
import { createStore } from 'zustand/vanilla'
import { useStoreWithEqualityFn } from 'zustand/traditional'
import { shallow } from 'zustand/shallow'

type CounterState = {
  count: number
}

type CounterActions = { increment: () => void }

type CounterStore = CounterState & CounterActions

const createCounterStore = () => {
  return createStore<CounterStore>()((set) => ({
    count: 0,
    increment: () => {
      set((state) => ({ count: state.count + 1 }))
    },
  }))
}

const defaultCounterStores = new Map<
  string,
  ReturnType<typeof createCounterStore>
>()

const createCounterStoreFactory = (
  counterStores: typeof defaultCounterStores,
) => {
  return (counterStoreKey: string) => {
    if (!counterStores.has(counterStoreKey)) {
      counterStores.set(counterStoreKey, createCounterStore())
    }
    return counterStores.get(counterStoreKey)!
  }
}

const getOrCreateCounterStoreByKey =
  createCounterStoreFactory(defaultCounterStores)

export default function App() {
  const [currentTabIndex, setCurrentTabIndex] = useState(0)
  const counterState = useStore(
    getOrCreateCounterStoreByKey(`tab-${currentTabIndex}`),
    (state) => state,
    shallow,
  )

  return (
    <div style={{ fontFamily: 'monospace' }}>
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid salmon',
          paddingBottom: 4,
        }}
      >
        <button
          type="button"
          style={{
            border: '1px solid salmon',
            backgroundColor: '#fff',
            cursor: 'pointer',
          }}
          onClick={() => setCurrentTabIndex(0)}
        >
          Tab 1
        </button>
        <button
          type="button"
          style={{
            border: '1px solid salmon',
            backgroundColor: '#fff',
            cursor: 'pointer',
          }}
          onClick={() => setCurrentTabIndex(1)}
        >
          Tab 2
        </button>
        <button
          type="button"
          style={{
            border: '1px solid salmon',
            backgroundColor: '#fff',
            cursor: 'pointer',
          }}
          onClick={() => setCurrentTabIndex(2)}
        >
          Tab 3
        </button>
      </div>
      <div style={{ padding: 4 }}>
        Content of Tab {currentTabIndex + 1}
        <br /> <br />
        <button type="button" onClick={() => counterState.increment()}>
          Count: {counterState.count}
        </button>
      </div>
    </div>
  )
}
```

## Troubleshooting

TBD
