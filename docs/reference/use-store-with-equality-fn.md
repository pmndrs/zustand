---
title: useStoreWithEqualityFn
description:
nav: 212
---

# useStoreWithEqualityFn ⚛️

`useStoreWithEqualityFn` is a React Hook that lets you use a vanilla store in React, just like
`useStore`. However, it offers a way to define a custom equality check. This allows for more
granular control over when components re-render, improving performance and responsiveness.

```js
useStoreWithEqualityFn(storeApi, selector, equalityFn)
```

- [Reference](#reference)
  - [Signature](#usestorewithequalityfn-signature)
- [Usage](#usage)
- [Troubleshooting](#troubleshooting)

## Reference

### `useStoreWithEqualityFn` Signature

```ts
useStoreWithEqualityFn<T, U>(storeApi: StoreApi<T>, selectorFn: (state: T) => U, equalityFn?: (a: T, b: T) => boolean): U
```

#### Parameters

- `storeApi`: The instance that lets you access to store API utilities.
- `selectorFn`: A function that lets you return data that is based on current state.
- `equalityFn`: A function that lets you skip re-renders.

#### Returns

`useStoreWithEqualityFn` returns Lorem ipsum dolor sit amet consectetur adipisicing elit. Sint
ipsam iure nesciunt consectetur magnam nulla nostrum ducimus repellendus. Maiores ducimus, expedita
architecto in placeat enim debitis non repudiandae veritatis neque.

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
