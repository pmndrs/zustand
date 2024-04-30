---
title: createWithEqualityFn
description:
nav: 203
---

# createWithEqualityFn

`createWithEqualityFn` lets you create a store with an equality function from the beginning and
bound store to a custom hook. Lorem ipsum dolor sit amet consectetur, adipisicing elit. Labore
repellendus pariatur suscipit quidem hic ullam blanditiis ut repudiandae ab unde dolores, tempore
expedita ipsam minus reprehenderit voluptas soluta sed debitis!

::: code-group

```ts [TypeScript]
createWithEqualityFn<T>()(initializer: StateCreator<T, [], []>, equalityFn: (a: T, b: T) => boolean): UseBoundStore<StoreApi<T>>
```

```js [JavaScript]
createWithEqualityFn(initializer, equalityFn)
```

:::

- [Reference](#reference)
  - [Signature](#createwithequalityfn-signature)
  - [`selector` function](#selector-function)
  - [`equalityFn` function](#equalityfn-function)
  - [`setState` function](#setstate-function)
  - [`getState` function](#getstate-function)
  - [`subscribe` function](#subscribe-function)
  - [`destroy` function](#destroy-function)
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
createWithEqualityFn<T>()(initializer: StateCreator<T, [], []>, equalityFn: (a: T, b: T) => boolean): UseBoundStore<StoreApi<T>>
```

#### Parameters

- `initializer`: The value you want the state to be initially. It can be a value of any type, but
  when you pass a function should take [`setState`](#setstate-function) function,
  [`getState`](#getstate-function) function and [`api`](#api) as arguments.
- `equalityFn`: A function that accepts two arguments: the previous state, and its new state. It
  should return `true` if the old and new states are equal. Otherwise it should return `false`.

#### Returns

`createWithEqualityFn` returns a custom hook, that could take `selector` function, and `equalityFn`
function as arguments. Also, expose `setState` function, `getState` function, `subscribe` function,
and `destroy` function.

### `selector` function

Lorem ipsum dolor, sit amet consectetur adipisicing elit. Incidunt, natus reiciendis porro earum
fugit, nihil vero adipisci assumenda, quia ab harum nostrum quasi. Dolorem, aspernatur. Nemo quae
repellendus doloribus deserunt?

### `equalityFn` function

Lorem ipsum dolor sit amet consectetur adipisicing elit. Qui perspiciatis inventore minus totam
nihil quasi ipsa, iure pariatur distinctio aspernatur aliquid reprehenderit alias a. Aliquam quis
deleniti temporibus ex vero.

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
  - if you pass a function as a `nextState`. It must be pure, should take current state as its
    only argument, and should return the next state. The next state returned by the updater
    function face the same restrictions of any next state.
- `replace`: This optional boolean flag controls whether to replace the entire state or merge the
  update with the current state.

#### Returns

`setState` function do not have a return value.

### `getState` function

The `getState` function lets you access to the current state. It can be stale on async operations.

### `subscribe` function

The `subscribe` function lets you subscribe to state updates. It should take current state and
previous state as arguments.

#### Parameters

- `currentState`: It's the current state.
- `previousState`: It's the previous state.

#### Returns

`subscribe` returns a function that lets you unsubscribe.

### `destroy` function

The `destroy` function lets you clear all the listeners. This function is **deprecated** and would
be removed in the future.

### `storeApi`

The `storeApi` lets you access to the store api functions like [`setState`](#setstate-function)
function, [`getState`](#getstate-function) function, [`subscribe`](#subscribe-function) function,
and [`destroy`](#destroy-function) function.
