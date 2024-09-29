---
title: redux
description: How to use actions and reducers in a store
nav: 208
---

# redux

```js
const nextStateCreatorFn = redux(reducerFn, initialState)
```

- [Types](#types)
  - [Signature](#signature)
  - [Mutator](#mutator)
- [Reference](#reference)
- [Usage](#usage)
- [Troubleshooting](#troubleshooting)
  - TBD

## Types

### Signature

```ts
redux<T, A>(reducerFn: (state: T, action: A) => T, initialState: T): StateCreator<T & { dispatch: (action: A) => A }, [['zustand/redux', A]], []>
```

### Mutator

<!-- prettier-ignore-start -->
```ts
['zustand/redux', A]
```
<!-- prettier-ignore-end -->

## Reference

### `redux(reducerFn, initialState)`

#### Parameters

- `reducerFn`: It should be pure and should take the current state of your application and an action
  object as arguments, and returns the new state resulting from applying the action.
- `initialState`: The value you want the state to be initially. It can be a value of any type,
  except a function.

#### Returns

`redux` returns a state creator function.

## Usage

## Troubleshooting
