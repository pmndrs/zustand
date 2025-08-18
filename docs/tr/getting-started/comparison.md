---
title: Karşılaştırma
description: Zustand benzer kütüphanelerle karşılaştırıldığında
nav: 1
---

Zustand, React için geliştirilmiş birçok durum yönetimi (state management) kütüphanesinden biridir.
Bu bölümde Redux, Valtio, Jotai ve Recoil gibi kütüphanelerle kıyaslayarak Zustand’ın konumunu ele alacağız.

Her kütüphanenin kendine özgü güçlü ve zayıf yönleri vardır.
Burada, aralarındaki temel farklar ve benzerliklere değineceğiz.

## Redux

### State Modeli (Redux’a karşı)

Kavramsal olarak Zustand ve Redux birbirine oldukça benzerdir:
İkisi de immutable state modeline dayanır.
Ancak Redux uygulamanızı context provider’lar ile sarmanızı gerektirir;
Zustand’da böyle bir gereklilik yoktur.

**Zustand**

```ts
import { create } from 'zustand'

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
import { create } from 'zustand'

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

**Redux**

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
      // Redux Toolkit state’i doğrudan değiştirmez.
      // Arka planda Immer kütüphanesini kullanır
      // ve bize "taslak state" (draft state) üzerinde çalışma imkanı verir.
      state.value += qty
    },
    decremented: (state, qty: number) => {
      state.value -= qty
    },
  },
})

const countStore = configureStore({ reducer: countSlice.reducer })
```

### Render Optimizasyonu (Redux’a karşı)

Uygulamanızda render optimizasyonuna geldiğinde,
Zustand ile Redux arasında yaklaşım açısından büyük bir fark yoktur.
Her iki kütüphanede de render optimizasyonunu elle yapmanız,
yani selector kullanmanız önerilir.

**Zustand**

```ts
import { create } from 'zustand'

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

**Redux**

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
      // Redux Toolkit state’i doğrudan değiştirmez.
      // Arka planda Immer kütüphanesini kullanır
      // ve bize "taslak state" (draft state) üzerinde çalışma imkanı verir.
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

### State Modeli (Valtio’ya karşı)

Zustand ve Valtio, durum yönetimine temelde farklı bir şekilde yaklaşır.
Zustand **immutable** state modeline dayanırken,
Valtio **mutable** state modeline dayanır.

**Zustand**

```ts
import { create } from 'zustand'

type State = {
  obj: { count: number }
}

const store = create<State>(() => ({ obj: { count: 0 } }))

store.setState((prev) => ({ obj: { count: prev.obj.count + 1 } }))
```

**Valtio**

```ts
import { proxy } from 'valtio'

const state = proxy({ obj: { count: 0 } })

state.obj.count += 1
```

### Render Optimizasyonu (Valtio’ya karşı)

Zustand ile Valtio arasındaki diğer fark,
Valtio’nun render optimizasyonlarını property erişimi üzerinden yapmasıdır.
Zustand’da ise render optimizasyonlarını manuel olarak,
selector kullanarak yapmanız önerilir.

**Zustand**

```ts
import { create } from 'zustand'

type State = {
  count: number
}

const useCountStore = create<State>(() => ({
  count: 0,
}))

const Component = () => {
  const count = useCountStore((state) => state.count)
  // ...
}
```

**Valtio**

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

### State Modeli (Jotai’ya karşı)

Zustand ile Jotai arasında temel bir fark vardır.
Zustand tek bir store üzerine kuruludur,
Jotai ise bir araya getirilebilen primitive atomlardan oluşur.

**Zustand**

```ts
import { create } from 'zustand'

type State = {
  count: number
}

type Actions = {
  updateCount: (
    countCallback: (count: State['count']) => State['count'],
  ) => void
}

const useCountStore = create<State & Actions>((set) => ({
  count: 0,
  updateCount: (countCallback) =>
    set((state) => ({ count: countCallback(state.count) })),
}))
```

**Jotai**

```ts
import { atom } from 'jotai'

const countAtom = atom<number>(0)
```

### Render Optimizasyonu (Jotai’ya karşı)

Jotai, render optimizasyonunu atom bağımlılıkları üzerinden gerçekleştirir.
Zustand’da ise render optimizasyonlarını manuel olarak,
selector kullanarak yapmanız önerilir.

**Zustand**

```ts
import { create } from 'zustand'

type State = {
  count: number
}

type Actions = {
  updateCount: (
    countCallback: (count: State['count']) => State['count'],
  ) => void
}

const useCountStore = create<State & Actions>((set) => ({
  count: 0,
  updateCount: (countCallback) =>
    set((state) => ({ count: countCallback(state.count) })),
}))

const Component = () => {
  const count = useCountStore((state) => state.count)
  const updateCount = useCountStore((state) => state.updateCount)
  // ...
}
```

**Jotai**

```ts
import { atom, useAtom } from 'jotai'

const countAtom = atom<number>(0)

const Component = () => {
  const [count, updateCount] = useAtom(countAtom)
  // ...
}
```

## Recoil

### State Modeli (Recoil’e karşı)

Zustand ile Recoil arasındaki fark,
Zustand ile Jotai arasındaki farka benzer.
Recoil, atom object referential identity yerine
atom string key’lerine dayanır.
Ayrıca Recoil, uygulamanızı bir context provider ile sarmanızı gerektirir.

**Zustand**

```ts
import { create } from 'zustand'

type State = {
  count: number
}

type Actions = {
  setCount: (countCallback: (count: State['count']) => State['count']) => void
}

const useCountStore = create<State & Actions>((set) => ({
  count: 0,
  setCount: (countCallback) =>
    set((state) => ({ count: countCallback(state.count) })),
}))
```

**Recoil**

```ts
import { atom } from 'recoil'

const count = atom({
  key: 'count',
  default: 0,
})
```

### Render Optimizasyonu (Recoil’e karşı)

Önceki optimizasyon karşılaştırmalarına benzer şekilde,
Recoil render optimizasyonunu atom bağımlılıkları üzerinden yapar.
Zustand’da ise render optimizasyonlarını manuel olarak,
selector kullanarak yapmanız önerilir.

**Zustand**

```ts
import { create } from 'zustand'

type State = {
  count: number
}

type Actions = {
  setCount: (countCallback: (count: State['count']) => State['count']) => void
}

const useCountStore = create<State & Actions>((set) => ({
  count: 0,
  setCount: (countCallback) =>
    set((state) => ({ count: countCallback(state.count) })),
}))

const Component = () => {
  const count = useCountStore((state) => state.count)
  const setCount = useCountStore((state) => state.setCount)
  // ...
}
```

**Recoil**

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

## NPM İndirme Popülaritesi

- [React için durum yönetimi kütüphanelerinin NPM indirme popülaritesi](https://npm-stat.com/charts.html?package=zustand&package=jotai&package=valtio&package=%40reduxjs%2Ftoolkit&package=recoil)
