---
title: redux
description:
nav: 208
---

# redux

`redux` middleware lets you inspect and debug your state from within the browser, using the redux
devtools browser extension.

```js
redux(reducer, initialState)
```

- [Reference](#reference)
  - [Signature](#redux-signature)
  - [`setState` function](#setstate-function)
  - [`getState` function](#getstate-function)
  - [`subscribe` function](#subscribe-function)
  - [`storeApi`](#storeapi)
- [Usage](#usage)
- [Troubleshooting](#troubleshooting)

## Reference

### `redux` Signature

```ts
redux<T, A>(reducer: (state: T, action: A) => T, initialState: T): StateCreator<T & { dispatch: (action: A) => A }, [], []>
```

#### Parameters

- `reducer`: It should be pure and should take the current state of your application and an action
  object as arguments, and returns the new state resulting from applying the action.
- `initialState`: It should be the initial state of your application data managed by the store.

#### Returns

`redux` returns a state creator function.

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
- `replace`: This optional boolean flag controls whether the state is completely replaced or only
  shallow updated, through a shallow merge.

#### Returns

`setState` function do not have a return value.

### `getState` function

The `getState` function lets you access to the current state. It can be stale on asynchronous
operations.

### `subscribe` function

The `subscribe` function lets you subscribe to state updates. It should take current state, and
its previous state as arguments.

#### Parameters

- `currentState`: The current state.
- `previousState`: The previous state.

#### Returns

`subscribe` returns a function that lets you unsubscribe from itself.

### `storeApi`

The `storeApi` lets you access to the store API utilities. These store API utilities are:
`setState` function, `getState` function, and `subscribe` function.

## Usage

## Troubleshooting
