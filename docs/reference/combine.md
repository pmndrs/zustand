---
title: combine
description:
nav: 200
---

# combine

The `combine` middleware is commonly used to create a new state by combining an initial state with
additional state created by a function. This middleware is particularly useful due to infers the
state so you do not need to type it.

```js
combine(initialState, additionalStateCreator)
```

- [Reference](#reference)
  - [Signature](#combine-signature)
  - [`setState` function](#setstate-function)
  - [`getState` function](#getstate-function)
  - [`api`](#api)
- [Usage](#usage)
- [Troubleshooting](#troubleshooting)

## Reference

### `combine` Signature

```ts [TypeScript]
combine<T, U>(initialState: T, additionalStateCreator: StateCreator<T, [], [], U>): Omit<T, keyof U> & U
```

#### Parameters

- `initialState`: The value you want the state to be initially. It can be a value of any type,
  except a function.
- `additionalStateCreator`: A function that should take [`setState`](#setstate-function) function,
  [`getState`](#getstate-function) function and [`api`](#api) as arguments. It should returns an
  additional state based on the initial state.

#### Returns

`combine` returns a new state that is the result of merging the initial state and the additional
state.

### `setState` function

The `setState` function lets you update the state to a different value and trigger a re-render. You
can pass the next state directly, a next partial state, a function that calculates it from the
previous state, or replace it completely.

#### Parameters

- `nextState`: The value that you want the state to be. It can be a value of any type, but there is
  a special behavior for functions.
  - if you pass an object as a `nextState`. It will shallow merge `nextState` with the current
    state. You can pass only the properties you want to update, this allows for selective state
    updates without modifying other properties.
  - if you pass a non-object as a `nextState`, make sure you use `replace` as `true` to avoid
    unexpected behaviors.
  - if you pass a function as a `nextState`. It must be pure, should take previous state as its
    only argument, and should return the next state. The next state returned by the updater
    function face the same restrictions of any next state.
- `replace`: This optional boolean flag controls whether to replace the entire state or merge the
  update with the current state.

#### Returns

`setState` function do not have a return value.

### `getState` function

The `getState` function lets you access to the current state. It can be stale on async operations.

#### `subscribe` function

The `subscribe` function lets you subscribe to state updates. It should take current state and
previous state as arguments.

#### Parameters

- `currentState`:
- `previousState`:

#### Returns

`subscribe` returns an unsubscribe function that you can use later.

#### `destroy` function

The `destroy` function lets you clear all the listeners. This function is **deprecated** and would
be removed in the future.

### `api`

The `api` (aka store api) lets you access to the store api functions like
[`setState`](#setstate-function) function, [`getState`](#getstate-function) function,
[`subscribe`](#subscribe-function) function, and [`destroy`](#destroy-function) function.

## Usage

## Troubleshooting
