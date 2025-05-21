---
title: useShallow ⚛️
description: How to memoize selector functions
nav: 28
---

`useShallow` is a React Hook that lets you optimize re-renders.

```js
const memoizedSelector = useShallow(selector)
```

- [Types](#types)
  - [Signature](#signature)
- [Reference](#reference)
- [Usage](#usage)
  - [Writing a memoized selector](#writing-a-memoized-selector)
- [Troubleshooting](#troubleshooting)

### Signature

```ts
useShallow<T, U = T>(selectorFn: (state: T) => U): (state: T) => U
```

## Reference

### `useShallow(selectorFn)`

#### Parameters

- `selectorFn`: A function that lets you return data that is based on current state.

#### Returns

`useShallow` returns a memoized version of a selector function using a shallow comparison for
memoization.

## Usage

### Writing a memoized selector

First, we need to setup a store to hold the state for the bear family. In this store, we define
three properties: `papaBear`, `mamaBear`, and `babyBear`, each representing a different member of
the bear family and their respective oatmeal pot sizes.

```tsx
import { create } from 'zustand'

type BearFamilyMealsStore = {
  [key: string]: string
}

const useBearFamilyMealsStore = create<BearFamilyMealsStore>()(() => ({
  papaBear: 'large porridge-pot',
  mamaBear: 'middle-size porridge pot',
  babyBear: 'A little, small, wee pot',
}))
```

Next, we'll create a `BearNames` component that retrieves the keys of our state (the bear family
members) and displays them.

```tsx
function BearNames() {
  const names = useBearFamilyMealsStore((state) => Object.keys(state))

  return <div>{names.join(', ')}</div>
}
```

Next, we will create a `UpdateBabyBearMeal` component that periodically updates baby bear's meal
choice.

```tsx
const meals = [
  'A tiny, little, wee bowl',
  'A small, petite, tiny pot',
  'A wee, itty-bitty, small bowl',
  'A little, petite, tiny dish',
  'A tiny, small, wee vessel',
  'A small, little, wee cauldron',
  'A little, tiny, small cup',
  'A wee, small, little jar',
  'A tiny, wee, small pan',
  'A small, wee, little crock',
]

function UpdateBabyBearMeal() {
  useEffect(() => {
    const timer = setInterval(() => {
      useBearFamilyMealsStore.setState({
        babyBear: meals[Math.floor(Math.random() * (meals.length - 1))],
      })
    }, 1000)

    return () => {
      clearInterval(timer)
    }
  }, [])

  return null
}
```

Finally, we combine both components in the `App` component to see them in action.

```tsx
export default function App() {
  return (
    <>
      <UpdateBabyBearMeal />
      <BearNames />
    </>
  )
}
```

Here is what the code should look like:

```tsx
import { useEffect } from 'react'
import { create } from 'zustand'

type BearFamilyMealsStore = {
  [key: string]: string
}

const useBearFamilyMealsStore = create<BearFamilyMealsStore>()(() => ({
  papaBear: 'large porridge-pot',
  mamaBear: 'middle-size porridge pot',
  babyBear: 'A little, small, wee pot',
}))

const meals = [
  'A tiny, little, wee bowl',
  'A small, petite, tiny pot',
  'A wee, itty-bitty, small bowl',
  'A little, petite, tiny dish',
  'A tiny, small, wee vessel',
  'A small, little, wee cauldron',
  'A little, tiny, small cup',
  'A wee, small, little jar',
  'A tiny, wee, small pan',
  'A small, wee, little crock',
]

function UpdateBabyBearMeal() {
  useEffect(() => {
    const timer = setInterval(() => {
      useBearFamilyMealsStore.setState({
        babyBear: meals[Math.floor(Math.random() * (meals.length - 1))],
      })
    }, 1000)

    return () => {
      clearInterval(timer)
    }
  }, [])

  return null
}

function BearNames() {
  const names = useBearFamilyMealsStore((state) => Object.keys(state))

  return <div>{names.join(', ')}</div>
}

export default function App() {
  return (
    <>
      <UpdateBabyBearMeal />
      <BearNames />
    </>
  )
}
```

Everything might look fine, but there’s a small problem: the `BearNames` component keeps
re-rendering even if the names haven’t changed. This happens because the component re-renders
whenever any part of the state changes, even if the specific part we care about (the list of names) hasn’t changed.

To fix this, we use `useShallow` to make sure the component only re-renders when the actual keys of
the state change:

```tsx
function BearNames() {
  const names = useBearFamilyMealsStore(
    useShallow((state) => Object.keys(state)),
  )

  return <div>{names.join(', ')}</div>
}
```

Here is what the code should look like:

```tsx
import { useEffect } from 'react'
import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'

type BearFamilyMealsStore = {
  [key: string]: string
}

const useBearFamilyMealsStore = create<BearFamilyMealsStore>()(() => ({
  papaBear: 'large porridge-pot',
  mamaBear: 'middle-size porridge pot',
  babyBear: 'A little, small, wee pot',
}))

const meals = [
  'A tiny, little, wee bowl',
  'A small, petite, tiny pot',
  'A wee, itty-bitty, small bowl',
  'A little, petite, tiny dish',
  'A tiny, small, wee vessel',
  'A small, little, wee cauldron',
  'A little, tiny, small cup',
  'A wee, small, little jar',
  'A tiny, wee, small pan',
  'A small, wee, little crock',
]

function UpdateBabyBearMeal() {
  useEffect(() => {
    const timer = setInterval(() => {
      useBearFamilyMealsStore.setState({
        babyBear: meals[Math.floor(Math.random() * (meals.length - 1))],
      })
    }, 1000)

    return () => {
      clearInterval(timer)
    }
  }, [])

  return null
}

function BearNames() {
  const names = useBearFamilyMealsStore(
    useShallow((state) => Object.keys(state)),
  )

  return <div>{names.join(', ')}</div>
}

export default function App() {
  return (
    <>
      <UpdateBabyBearMeal />
      <BearNames />
    </>
  )
}
```

By using `useShallow`, we optimized the rendering process, ensuring that the component only
re-renders when necessary, which improves overall performance.

## Troubleshooting

TBD
