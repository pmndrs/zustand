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

### `setState` function

The `setState` function lets you update the state to a different value and trigger re-render. You
can pass the next state directly, a next partial state, a function that calculates it from the
previous state, or replace it completely.

#### Parameters

- `nextState`: The value that you want the state to be. It can be a value of any type, but there is
  a special behavior for functions.
  - If you pass an object as a `nextState`. It will shallow merge `nextState` with the current
    state. You can pass only the properties you want to update, this allows for selective state
    updates without modifying other properties.
  - If you pass a non-object as a `nextState`, make sure you use `replace` as `true` to avoid
    unexpected behaviors.
  - If you pass a function as a `nextState`. It must be pure, should take current state as its
    only argument, and should return the next state. The next state returned by the updater
    function face the same restrictions of any next state.
- `replace`: This optional boolean flag controls whether to replace the entire state or merge the
  update with the current state.

#### Returns

`setState` function do not have a return value.

### `getState` function

The `getState` function lets you access to the current state. It can be stale on asynchronous
operations.

### `subscribe` function

The `subscribe` function lets you subscribe to state updates. It should take current state and
previous state as arguments.

#### Parameters

- `currentState`: The current state.
- `previousState`: The previous state.

#### Returns

`subscribe` returns a function that lets you unsubscribe.

### `storeApi`

The `storeApi` lets you access to the store API functions like
[`setState` function](#setstate-function), [`getState` function](#getstate-function), and
[`subscribe` function](#subscribe-function).

## Usage

## Troubleshooting
