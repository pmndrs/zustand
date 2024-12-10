---
title: useStore ⚛️
description: How to use vanilla stores in React
nav: 30
---

`useStore` is a React Hook that lets you use a vanilla store in React.

```js
const someState = useStore(store, selectorFn)
```

- [Types](#types)
  - [Signature](#signature)
- [Reference](#reference)
- [Usage](#usage)
  - [Use a vanilla store in React](#use-a-vanilla-store-in-react)
  - [Using dynamic vanilla stores in React](#using-dynamic-global-vanilla-stores-in-react)
  - [Using scoped (non-global) vanilla store in React](#using-scoped-non-global-vanilla-store-in-react)
  - [Using dynamic scoped (non-global) vanilla stores in React](#using-dynamic-scoped-non-global-vanilla-stores-in-react)
- [Troubleshooting](#troubleshooting)

## Types

### Signature

```ts
useStore<StoreApi<T>, U = T>(store: StoreApi<T>, selectorFn?: (state: T) => U) => UseBoundStore<StoreApi<T>>
```

## Reference

### `useStore(store, selectorFn)`

#### Parameters

- `storeApi`: The instance that lets you access to store API utilities.
- `selectorFn`: A function that lets you return data that is based on current state.

#### Returns

`useStore` returns any data based on current state depending on the selector function. It should
take a store, and a selector function as arguments.

## Usage

### Using a global vanilla store in React

First, let's set up a store that will hold the position of the dot on the screen. We'll define the
store to manage `x` and `y` coordinates and provide an action to update these coordinates.

```tsx
type PositionStoreState = { position: { x: number; y: number } }

type PositionStoreActions = {
  setPosition: (nextPosition: PositionStoreState['position']) => void
}

type PositionStore = PositionStoreState & PositionStoreActions

const positionStore = createStore<PositionStore>()((set) => ({
  position: { x: 0, y: 0 },
  setPosition: (position) => set({ position }),
}))
```

Next, we'll create a `MovingDot` component that renders a div representing the dot. This component
will use the store to track and update the dot's position.

```tsx
function MovingDot() {
  const position = useStore(positionStore, (state) => state.position)
  const setPosition = useStore(positionStore, (state) => state.setPosition)

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
import { createStore, useStore } from 'zustand'

type PositionStoreState = { position: { x: number; y: number } }

type PositionStoreActions = {
  setPosition: (nextPosition: PositionStoreState['position']) => void
}

type PositionStore = PositionStoreState & PositionStoreActions

const positionStore = createStore<PositionStore>()((set) => ({
  position: { x: 0, y: 0 },
  setPosition: (position) => set({ position }),
}))

function MovingDot() {
  const position = useStore(positionStore, (state) => state.position)
  const setPosition = useStore(positionStore, (state) => state.setPosition)

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

### Using dynamic global vanilla stores in React

First, we'll create a factory function that generates a store for managing the counter state.
Each tab will have its own instance of this store.

```ts
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

Now, let’s build the Tabs component, where users can switch between tabs and increment each tab’s
counter.

```tsx
const [currentTabIndex, setCurrentTabIndex] = useState(0)
const counterState = useStore(
  getOrCreateCounterStoreByKey(`tab-${currentTabIndex}`),
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
```

Finally, we'll create the `App` component, which renders the tabs and their respective counters.
The counter state is managed independently for each tab.

```tsx
export default function App() {
  return <Tabs />
}
```

Here is what the code should look like:

```tsx
import { useState } from 'react'
import { createStore, useStore } from 'zustand'

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

### Using scoped (non-global) vanilla store in React

First, let's set up a store that will hold the position of the dot on the screen. We'll define the
store to manage `x` and `y` coordinates and provide an action to update these coordinates.

```tsx
type PositionStoreState = { position: { x: number; y: number } }

type PositionStoreActions = {
  setPosition: (nextPosition: PositionStoreState['position']) => void
}

type PositionStore = PositionStoreState & PositionStoreActions

const createPositionStore = () => {
  return createStore<PositionStore>()((set) => ({
    position: { x: 0, y: 0 },
    setPosition: (position) => set({ position }),
  }))
}
```

Next, we'll create a context and a provider component to pass down the store through the React
component tree. This allows each `MovingDot` component to have its own independent state.

```tsx
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
function usePositionStore<U>(selector: (state: PositionStore) => U) {
  const store = useContext(PositionStoreContext)

  if (store === null) {
    throw new Error(
      'usePositionStore must be used within PositionStoreProvider',
    )
  }

  return useStore(store, selector)
}
```

Now, let's create the `MovingDot` component, which will render a dot that follows the mouse cursor
within its container.

```tsx
function MovingDot({ color }: { color: string }) {
  const position = usePositionStore((state) => state.position)
  const setPosition = usePositionStore((state) => state.setPosition)

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
import { createStore, useStore } from 'zustand'

type PositionStoreState = { position: { x: number; y: number } }

type PositionStoreActions = {
  setPosition: (nextPosition: PositionStoreState['position']) => void
}

type PositionStore = PositionStoreState & PositionStoreActions

const createPositionStore = () => {
  return createStore<PositionStore>()((set) => ({
    position: { x: 0, y: 0 },
    setPosition: (position) => set({ position }),
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

function usePositionStore<U>(selector: (state: PositionStore) => U) {
  const store = useContext(PositionStoreContext)

  if (store === null) {
    throw new Error(
      'usePositionStore must be used within PositionStoreProvider',
    )
  }

  return useStore(store, selector)
}

function MovingDot({ color }: { color: string }) {
  const position = usePositionStore((state) => state.position)
  const setPosition = usePositionStore((state) => state.setPosition)

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
import { createStore } from 'zustand'

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
const createCounterStoreFactory = (
  counterStores: Map<string, ReturnType<typeof createCounterStore>>,
) => {
  return (counterStoreKey: string) => {
    if (!counterStores.has(counterStoreKey)) {
      counterStores.set(counterStoreKey, createCounterStore())
    }
    return counterStores.get(counterStoreKey)!
  }
}
```

Next, we need a way to manage and access these stores throughout our app. We’ll use React’s context
for this.

```tsx
const CounterStoresContext = createContext(null)

const CounterStoresProvider = ({ children }) => {
  const [stores] = useState(
    () => new Map<string, ReturnType<typeof createCounterStore>>(),
  )

  return (
    <CounterStoresContext.Provider value={stores}>
      {children}
    </CounterStoresContext.Provider>
  )
}
```

Now, we’ll create a custom hook, `useCounterStore`, that lets us access the correct store for a
given tab.

```tsx
const useCounterStore = <U>(
  currentTabIndex: number,
  selector: (state: CounterStore) => U,
) => {
  const stores = useContext(CounterStoresContext)

  if (stores === undefined) {
    throw new Error('useCounterStore must be used within CounterStoresProvider')
  }

  const getOrCreateCounterStoreByKey = useCallback(
    () => createCounterStoreFactory(stores),
    [stores],
  )

  return useStore(getOrCreateCounterStoreByKey(`tab-${currentTabIndex}`))
}
```

Now, let’s build the Tabs component, where users can switch between tabs and increment each tab’s
counter.

```tsx
function Tabs() {
  const [currentTabIndex, setCurrentTabIndex] = useState(0)
  const counterState = useCounterStore(
    `tab-${currentTabIndex}`,
    (state) => state,
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

Finally, we'll create the `App` component, which renders the tabs and their respective counters.
The counter state is managed independently for each tab.

```tsx
export default function App() {
  return (
    <CounterStoresProvider>
      <Tabs />
    </CounterStoresProvider>
  )
}
```

Here is what the code should look like:

```tsx
import {
  type ReactNode,
  useState,
  useCallback,
  useContext,
  createContext,
} from 'react'
import { createStore, useStore } from 'zustand'

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

const createCounterStoreFactory = (
  counterStores: Map<string, ReturnType<typeof createCounterStore>>,
) => {
  return (counterStoreKey: string) => {
    if (!counterStores.has(counterStoreKey)) {
      counterStores.set(counterStoreKey, createCounterStore())
    }
    return counterStores.get(counterStoreKey)!
  }
}

const CounterStoresContext = createContext<Map<
  string,
  ReturnType<typeof createCounterStore>
> | null>(null)

const CounterStoresProvider = ({ children }: { children: ReactNode }) => {
  const [stores] = useState(
    () => new Map<string, ReturnType<typeof createCounterStore>>(),
  )

  return (
    <CounterStoresContext.Provider value={stores}>
      {children}
    </CounterStoresContext.Provider>
  )
}

const useCounterStore = <U,>(
  key: string,
  selector: (state: CounterStore) => U,
) => {
  const stores = useContext(CounterStoresContext)

  if (stores === undefined) {
    throw new Error('useCounterStore must be used within CounterStoresProvider')
  }

  const getOrCreateCounterStoreByKey = useCallback(
    (key: string) => createCounterStoreFactory(stores!)(key),
    [stores],
  )

  return useStore(getOrCreateCounterStoreByKey(key), selector)
}

function Tabs() {
  const [currentTabIndex, setCurrentTabIndex] = useState(0)
  const counterState = useCounterStore(
    `tab-${currentTabIndex}`,
    (state) => state,
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

export default function App() {
  return (
    <CounterStoresProvider>
      <Tabs />
    </CounterStoresProvider>
  )
}
```

## Troubleshooting

TBD
