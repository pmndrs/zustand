---
title: combine
description:
nav: 201
---

# combine

`combine` middleware lets you create a new state by combining an initial state with additional
state created by a function. This middleware is particularly useful due to infers the state, so you
don't need to type it.

```js
combine(initialState, additionalStateCreator)
```

- [Reference](#reference)
  - [Signature](#combine-signature)
- [Usage](#usage)
- [Troubleshooting](#troubleshooting)

## Reference

### `combine` Signature

```ts
combine<T, U>(initialState: T, additionalStateCreatorFn: StateCreator<T, [], [], U>): StateCreator<Omit<T, keyof U> & U, [], []>
```

#### Parameters

- `initialState`: The value you want the state to be initially. It can be a value of any type,
  except a function.
- `additionalStateCreatorFn`: The state creator function that specifies how the state gets
  initialized and updated. It must be pure, should take `setState` function, `getState` function
  and `storeApi` as arguments.

#### Returns

`combine` returns a state creator function.

## Usage

## Troubleshooting
