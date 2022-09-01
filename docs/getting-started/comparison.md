---
title: Comparison
description:
nav: 2
---

Zustand is one of many state management libraries for React. On this page we
will discuss Zustand in comparison to some of these libraries, including Redux,
Valtio, Jotai, and Recoil.

Each library has its own strengths and weaknesses, and we will compare key
differences and similarities between each.

## Redux

### State Model

There are no big differences between Zustand and Redux. Both are based on
immutable state model. Also, Redux needs to wrap you app in context providers.

```ts
import create from 'zustand'

type State = {
  count: number
}

type Actions = {
  increment: (qty: number) => void
  decrement: (qty: number) => void
}

const useCountStore = create<State & Actions>((set) => ({
  count: 0,
  increment: (qty: number) => set((state) => ({ count: state.count + qty })),
  decrement: (qty: number) => set((state) => ({ count: state.count - qty })),
}))
```

```ts
import create from 'zustand'

type State = {
  count: number
}

type Actions = {
  increment: (qty: number) => void
  decrement: (qty: number) => void
}

type Action = {
  type: keyof Actions
  qty: number
}

const countReducer = (state: State, action: Action) => {
  switch (action.type) {
    case 'increment':
      return { count: state.count + action.qty }
    case 'decrement':
      return { count: state.count - action.qty }
    default:
      return state
  }
}

const useCountStore = create<State & Actions>((set) => ({
  count: 0,
  dispatch: (action: Action) => set((state) => countReducer(state, action)),
}))
```

```ts
import { createStore } from 'redux'
import { useSelector, useDispatch } from 'react-redux'

type State = {
  count: number
}

type Action = {
  type: 'increment' | 'decrement'
  qty: number
}

const countReducer = (state: State, action: Action) => {
  switch (action.type) {
    case 'increment':
      return { count: state.count + action.qty }
    case 'decrement':
      return { count: state.count - action.qty }
    default:
      return state
  }
}

const countStore = createStore(countReducer)
```

```ts
import { createSlice, configureStore } from '@reduxjs/toolkit'

const countSlice = createSlice({
  name: 'count',
  initialState: { value: 0 },
  reducers: {
    incremented: (state, qty: number) => {
      // Redux Toolkit does not mutate the state, it use Immer library behind
      // scenes allow us to have something called "draft state".
      state.value += qty
    },
    decremented: (state, qty: number) => {
      state.value -= qty
    },
  },
})

const countStore = configureStore({ reducer: countSlice.reducer })
```

### Render Optimization

When it comes to render optimizations within your app, there are no major
differences in approach between Zustand and Redux. In both libraries it is
recommended that you manually apply render optimizations by using selectors.

```ts
import create from 'zustand'

type State = {
  count: number
}

type Actions = {
  increment: (qty: number) => void
  decrement: (qty: number) => void
}

const useCountStore = create<State & Actions>((set) => ({
  count: 0,
  increment: (qty: number) => set((state) => ({ count: state.count + qty })),
  decrement: (qty: number) => set((state) => ({ count: state.count - qty })),
}))

const Component = () => {
  const count = useCountStore((state) => state.count)
  const increment = useCountStore((state) => state.increment)
  const decrement = useCountStore((state) => state.decrement)
  // ...
}
```

```ts
import { createStore } from 'redux'
import { useSelector, useDispatch } from 'react-redux'

type State = {
  count: number
}

type Action = {
  type: 'increment' | 'decrement'
  qty: number
}

const countReducer = (state: State, action: Action) => {
  switch (action.type) {
    case 'increment':
      return { count: state.count + action.qty }
    case 'decrement':
      return { count: state.count - action.qty }
    default:
      return state
  }
}

const countStore = createStore(countReducer)

const Component = () => {
  const count = useSelector((state) => state.count)
  const dispatch = useDispatch()
  // ...
}
```

```ts
import { useSelector } from 'react-redux'
import type { TypedUseSelectorHook } from 'react-redux'
import { createSlice, configureStore } from '@reduxjs/toolkit'

const countSlice = createSlice({
  name: 'count',
  initialState: { value: 0 },
  reducers: {
    incremented: (state, qty: number) => {
      // Redux Toolkit does not mutate the state, it use Immer library behind
      // scenes allow us to have something called "draft state".
      state.value += qty
    },
    decremented: (state, qty: number) => {
      state.value -= qty
    },
  },
})

const countStore = configureStore({ reducer: countSlice.reducer })

const useAppSelector: TypedUseSelectorHook<typeof countStore.getState> =
  useSelector

const useAppDispatch: () => typeof countStore.dispatch = useDispatch

const Component = () => {
  const count = useAppSelector((state) => state.count.value)
  const dispatch = useAppDispatch()
  // ...
}
```

## Valtio

### State Model

There is a major difference between Zustand and Valtio. Zustand is based on
the immutable state model, while Valtio is based on the mutable state model.

```ts
import create from 'zustand'

const store = create(() => ({ obj: { count: 0 } }))

store.setState((prev) => ({ obj: { count: prev.obj.count + 1 } })
```

```ts
import { proxy } from 'valtio'

const state = proxy({ obj: { count: 0 } })

state.obj.count += 1
```

### Render Optimization

The other difference between Zustand and Valtio is Valtio makes render
optimizations through property access. While Zustand it is recommended that you
manually apply render optimizations by using selectors.

```ts
import create from 'zustand'

const useCountStore = create(() => ({
  count: 0,
}))

const Component = () => {
  const count = useCountStore((state) => state.count)
  // ...
}
```

```ts
import { proxy, useSnapshot } from 'valtio'

const state = proxy({
  count: 0,
})

const Component = () => {
  const { count } = useSnapshot(state)
  // ...
}
```

## Jotai

### State Model

There are two major differences between Zustand and Jotai. The first one is
Zustand is a single store, while Jotai consists of primitive atoms and allows
composing them together. The last one is Zustand store is global in memory, but
Jotai atoms are not (are definitions that do not hold values) and that's why
you can not use it outside React.

```ts
import create from 'zustand'

type State = {
  count: number
}

const useCountStore = create<State>((set) => ({
  count: 0,
  updateCount: (countCallback: (count: State['count']) => State['count']) =>
    set((state) => ({ count: countCallback(state.count) })),
}))
```

```ts
import { atom } from 'jotai'

const countAtom = atom<number>(0)
```

### Render Optimization

The other difference between Zustand and Jotai is: Jotai makes render
optimizations through atom dependency. But, with Zustand you need to do manual
render optimizations through selectors.

```ts
import create from 'zustand'

type State = {
  count: number
}

const useCountStore = create<State>((set) => ({
  count: 0,
  updateCount: (countCallback: (count: State['count']) => State['count']) =>
    set((state) => ({ count: countCallback(state.count) })),
}))

const Component = () => {
  const count = useCountStore((state) => state.count)
  const updateCount = useCountStore((state) => state.updateCount)
  // ...
}
```

```ts
import { atom, useAtom } from 'jotai'

const countAtom = atom<number>(0)

const Component = () => {
  const [count, updateCount] = useAtom(countAtom)
  // ...
}
```

## Recoil

### State Model

The major difference is the same as Zustand and Jotai is: Recoil depends on
atom string keys instead of atom object referential identities. Also, Recoil
needs to wrap your app in a context provider.

```ts
import create from 'zustand'

type State = {
  count: number
}

const useCountStore = create<State>((set) => ({
  count: 0,
  setCount: (countCallback: (count: State['count']) => State['count']) =>
    set((state) => ({ count: countCallback(state.count) })),
}))
```

```ts
import { atom } from 'recoil'

const count = atom({
  key: 'count',
  default: 0,
})
```

### Render Optimization

The other difference between Zustand and Recoil is: Recoil makes render
optimizations through atom dependency. But, with Zustand you need to do manual
render optimizations through selectors.

```ts
import create from 'zustand'

type State = {
  count: number
}

const useCountStore = create<State>((set) => ({
  count: 0,
  setCount: (countCallback: (count: State['count']) => State['count']) =>
    set((state) => ({ count: countCallback(state.count) })),
}))

const Component = () => {
  const count = useCountStore((state) => state.count)
  const setCount = useCountStore((state) => state.setCount)
  // ...
}
```

```ts
import { atom, useRecoilState } from 'recoil'

const countAtom = atom({
  key: 'count',
  default: 0,
})

const Component = () => {
  const [count, setCount] = useRecoilState(countAtom)
  // ...
}
```
