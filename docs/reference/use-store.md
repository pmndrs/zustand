---
title: useStore
description:
nav: 213
---

# useStore ⚛️

`useStore` is a React Hook that lets you use a vanilla store in React.

```js
useStore(api, selector)
```

- [Reference](#reference)
  - [`useStore` Signature](#usestore-signature)
  - [`setState` function](#setstate-function)
  - [`getState` function](#getstate-function)
  - [`subscribe` function](#subscribe-function)
  - [`storeApi`](#storeapi)
- [Usage](#usage)
  - [Use a vanilla store in React](#use-a-vanilla-store-in-react)
- [Troubleshooting](#troubleshooting)

## Reference

### `useStore` Signature

```ts
useStore<StoreApi<T>, U = T>(storeApi: StoreApi<T>, selector?: (state: T) => U) => UseBoundStore<StoreApi<T>>
```

#### Parameters

- `storeApi`: The [`storeApi`](#storeapi) that lets you access to store API utilities.
- `selector`: The [`selector` function](#selector-function) that should take current state as its only argument, and
  should return data based on current state.

#### Returns

`useStore` returns current state or returns any data based on current state depending on the
selector function.

### `setState` function

The `setState` function lets you update the state to a different value and trigger re-render. You
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
  - if you pass a function as a `nextState`. It must be pure, should take current state as its
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

- `currentState`: It's the current state.
- `previousState`: It's the previous state.

#### Returns

`subscribe` returns a function that lets you unsubscribe.

### `storeApi`

The `storeApi` lets you access to the store API utilities like
[`setState` function](#setstate-function), [`getState` function](#getstate-function),
and [`subscribe` function](#subscribe-function).

## Usage

### Use a vanilla store in React

## Troubleshooting
