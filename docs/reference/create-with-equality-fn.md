---
title: createWithEqualityFn
description:
nav: 203
---

# createWithEqualityFn ⚛️

`createWithEqualityFn` lets you create a React Hook with store API utilities, and default equality
function.

```js
createWithEqualityFn(stateCreatorFn, equalityFn)
```

- [Reference](#reference)
  - [Signature](#createwithequalityfn-signature)
  - [`selector` function](#selector-function)
  - [`equality` function](#equality-function)
  - [`setState` function](#setstate-function)
  - [`getState` function](#getstate-function)
  - [`subscribe` function](#subscribe-function)
  - [`storeApi`](#storeapi)
- [Usage](#usage)
  - [Updating state based on previous state](#updating-state-base-on-a-previous-state)
  - [Updating objects and non-objects in state](#updating-objects-and-non-objects-in-state)
  - [Subscribing to state updates](#subscribing-to-state-updates)
- [Troubleshooting](#troubleshooting)
  - [I’ve updated the state, but the screen doesn’t update](#ive-updated-the-state-but-the-screen-doesnt-update)

## Reference

### `createWithEqualityFn` Signature

```ts
createWithEqualityFn<T>()(stateCreatorFn: StateCreator<T, [], []>, equalityFn?: (a: T, b: T) => boolean): UseBoundStore<StoreApi<T>>
```

#### Parameters

- `stateCreatorFn`: The state creator function that specifies how the state gets initialized and
  updated. It must be pure, should take `setState` function, `getState` function and `storeApi` as
  arguments.
- **optional** `equalityFn`: Defaults to `Object.is`. A function that lets you skip re-renders.

#### Returns

`createWithEqualityFn` returns a React Hook:

1. The React Hook that lets you return data that is based on current state, using a `selector`
   function, and lets you skip re-renders using a `equality` function. It should take a selector
   function, and an equality function as arguments.

### `selector` function

The `selector` function lets you return data that is based on current state. It should take current
state as its only argument.

### `equality` function

The `equality` function lets you skip re-renders when certain values are unchanged. It should
take the previous state, and its current state as arguments. It should return `true` if the
previous and current states are equal. Otherwise, it should return `false`.

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
