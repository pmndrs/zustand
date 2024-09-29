---
title: persist
description: How to persist a store
nav: 207
---

# persist

`persist` middleware lets you persist your store's state across page reloads or application
restarts.

```js
const nextStateCreatorFn = persist(stateCreatorFn, persistOptions)
```

- [Types](#types)
  - [Signature](#signature)
  - [Mutator](#mutator)
- [Reference](#reference)
- [Usage](#usage)
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
- `persistOptions`: An object to.
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

## Troubleshooting

### Cannot read property `setOptions` of undefined

Lorem ipsum dolor sit amet consectetur adipisicing elit. Harum reprehenderit eaque excepturi,
cumque officia incidunt repellendus, fugit soluta dolore perspiciatis laudantium voluptatem
repudiandae illum ipsum quam, perferendis iusto a aperiam!

### Storage is not being validated or type checked

Lorem ipsum dolor sit amet consectetur adipisicing elit. Harum ratione aspernatur dolores ut in
erferendis quis reprehenderit iure numquam minima laborum vero unde, eum laudantium! Minima beatae
natus tempore est.

### Cannot read property `setItem`/`getItem`/`removeItem` of null