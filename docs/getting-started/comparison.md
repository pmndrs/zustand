---
title: Comparison
description:
nav: 2
---

## Redux

Zustand and Redux are state management libraries for React. Here are some
differences between these two libraries.

### State Model

There are no big difference between Zustand and Redux. Both are base on
immutable state model.

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

### Render Optimization

There are no difference between Zustand and Redux. In both you need to do manual
render optimizations through selectors.

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

## Valtio

Zustand and Valtio are state management libraries for React. Here are some
differences between these two libraries.

### State Model

There is a major difference between Zustand and Valtio. Zustand is based on the
immutable state model, while Valtio is based on the mutable state model.

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

The other difference between Zustand and Valtio is: Valtio makes render
optimizations through property access. But, with Zustand you need to do manual
render optimizations through selectors.

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

Zustand and Jotai are state management libraries for React. Here are some
differences between these two libraries.

### State Model

There is a major difference between Zustand and Jotai. Zustand is a single
store, while Jotai consits of primitive atoms and allows composing them
together.

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

Zustand and Recoil are state management libraries for React. Here are some
differences between these two libraries.

### State Model

The major difference is the same as Zustand and Jotai. Also, Recoil depends on
atom string keys instead of atom object referential identities.

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
