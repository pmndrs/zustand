---
title: devtools
description: How to time-travel debug your store
nav: 205
---

# devtools

`devtools` middleware lets you use [Redux DevTools Extension](https://github.com/reduxjs/redux-devtools)
without Redux. Read more about the benefits of using [Redux DevTools for debugging](https://redux.js.org/style-guide/#use-the-redux-devtools-extension-for-debugging).

> [!IMPORTANT]
> In order to use `devtools` from `zustand/middleware` you need to install
> `@redux-devtools/extension` library.

```js
const nextStateCreatorFn = devtools(stateCreatorFn, devtoolsOptions)
```

- [Types](#types)
  - [Signature](#signature)
  - [Mutator](#mutator)
- [Reference](#reference)
- [Usage](#usage)
  - [Debugging a store](#debugging-a-store)
  - [Debugging a Slices pattern based store](#debugging-a-slices-pattern-based-store)
  - [Cleanup](#cleanup)
- [Troubleshooting](#troubleshooting)
  - [Only one store is displayed](#only-one-store-is-displayed)
  - [Action names are labeled as 'anonymous'](#all-action-names-are-labeled-as-anonymous)

## Types

### Signature

```ts
devtools<T>(stateCreatorFn: StateCreator<T, [], []>, devtoolsOptions?: DevtoolsOptions): StateCreator<T, [['zustand/devtools', never]], []>
```

### Mutator

<!-- prettier-ignore-start -->
```ts
['zustand/devtools', never]
```
<!-- prettier-ignore-end -->

## Reference

### `devtools(stateCreatorFn, devtoolsOptions)`

#### Parameters

- `stateCreatorFn`: A function that takes `set` function, `get` function and `store` as arguments.
  Usually, you will return an object with the methods you want to expose.
- **optional** `devtoolsOptions`: An object to define `Redux Devtools` options.
  - **optional** `name`: A custom identifier for the connection in the Redux DevTools.
  - **optional** `enabled`: Defaults to `true` when is on development mode, and defaults to `false`
    when is on production mode. Enables or disables the Redux DevTools integration
    for this store.
  - **optional** `anonymousActionType`: Defaults to the inferred action type or `anonymous` if
    unavailable. A string to use as the action type for anonymous mutations in the Redux DevTools.
  - **optional** `store`: A custom identifier for the store in the Redux DevTools.

#### Returns

`devtools` returns a state creator function.

## Usage

### Debugging a store

This example shows you how you can use `Redux Devtools` to debug a store

```ts
import { create, StateCreator } from 'zustand'
import { devtools } from 'zustand/middleware'

type JungleStore = {
  bears: number
  addBear: () => void
  fishes: number
  addFish: () => void
}

const useJungleStore = create<JungleStore>()(
  devtools((set) => ({
    bears: 0,
    addBear: () =>
      set((state) => ({ bears: state.bears + 1 }), undefined, 'jungle/addBear'),
    fishes: 0,
    addFish: () =>
      set(
        (state) => ({ fishes: state.fishes + 1 }),
        undefined,
        'jungle/addFish',
      ),
  })),
)
```

### Debugging a Slices pattern based store

This example shows you how you can use `Redux Devtools` to debug a Slices pattern based store

```ts
import { create, StateCreator } from 'zustand'
import { devtools } from 'zustand/middleware'

type BearSlice = {
  bears: number
  addBear: () => void
}

type FishSlice = {
  fishes: number
  addFish: () => void
}

type JungleStore = BearSlice & FishSlice

const createBearSlice: StateCreator<
  JungleStore,
  [['zustand/devtools', never]],
  [],
  BearSlice
> = (set) => ({
  bears: 0,
  addBear: () =>
    set(
      (state) => ({ bears: state.bears + 1 }),
      undefined,
      'jungle:bear/addBear',
    ),
})

const createFishSlice: StateCreator<
  JungleStore,
  [['zustand/devtools', never]],
  [],
  FishSlice
> = (set) => ({
  fishes: 0,
  addFish: () =>
    set(
      (state) => ({ fishes: state.fishes + 1 }),
      undefined,
      'jungle:fish/addFish',
    ),
})

const useJungleStore = create<JungleStore>()(
  devtools((...args) => ({
    ...createBearSlice(...args),
    ...createFishSlice(...args),
  })),
)
```

### Cleanup

When a store is no longer needed, you can clean up the Redux DevTools connection by calling the `cleanup` method on the store:

```ts
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

const useStore = create(
  devtools((set) => ({
    count: 0,
    increment: () => set((state) => ({ count: state.count + 1 })),
  })),
)

// When you're done with the store, clean it up
useStore.devtools.cleanup()
```

This is particularly useful in applications that wrap store in context or create multiple stores dynamically.

## Troubleshooting

### Only one store is displayed

By default, `Redux Devtools` only show one store at a time, so in order to see other stores you
need to use store selector and choose a different store.

### All action names are labeled as 'anonymous'

If an action type name is not provided, it is defaulted to "anonymous". You can customize this
default value by providing a `anonymousActionType` parameter:

For instance the next example doesn't have action type name:

```ts
import { create, StateCreator } from 'zustand'
import { devtools } from 'zustand/middleware'

type BearSlice = {
  bears: number
  addBear: () => void
}

type FishSlice = {
  fishes: number
  addFish: () => void
}

type JungleStore = BearSlice & FishSlice

const createBearSlice: StateCreator<
  JungleStore,
  [['zustand/devtools', never]],
  [],
  BearSlice
> = (set) => ({
  bears: 0,
  addBear: () => set((state) => ({ bears: state.bears + 1 })),
  eatFish: () => set((state) => ({ fishes: state.fishes - 1 })),
})

const createFishSlice: StateCreator<
  JungleStore,
  [['zustand/devtools', never]],
  [],
  FishSlice
> = (set) => ({
  fishes: 0,
  addFish: () => set((state) => ({ fishes: state.fishes + 1 })),
})

const useJungleStore = create<JungleStore>()(
  devtools((...args) => ({
    ...createBearSlice(...args),
    ...createFishSlice(...args),
  })),
)
```

In order to fix the previous example, we need to provide an action type name as the third parameter.
Additionally, to preserve the default behavior of the replacement logic, the second parameter
should be set to `undefined`.

Here's the fixed previous example

```ts
import { create, StateCreator } from 'zustand'

type BearSlice = {
  bears: number
  addBear: () => void
}

type FishSlice = {
  fishes: number
  addFish: () => void
}

type JungleStore = BearSlice & FishSlice

const createBearSlice: StateCreator<
  JungleStore,
  [['zustand/devtools', never]],
  [],
  BearSlice
> = (set) => ({
  bears: 0,
  addBear: () =>
    set((state) => ({ bears: state.bears + 1 }), undefined, 'bear/addBear'),
})

const createFishSlice: StateCreator<
  JungleStore,
  [['zustand/devtools', never]],
  [],
  FishSlice
> = (set) => ({
  fishes: 0,
  addFish: () =>
    set((state) => ({ fishes: state.fishes + 1 }), undefined, 'fish/addFish'),
})

const useJungleStore = create<JungleStore>()(
  devtools((...args) => ({
    ...createBearSlice(...args),
    ...createFishSlice(...args),
  })),
)
```

> [!IMPORTANT]
> Do not set the second parameter to `true` or `false` unless you want to override the default
> replacement logic
