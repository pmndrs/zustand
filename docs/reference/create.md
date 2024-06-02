---
title: create
description:
nav: 204
---

# create ⚛️

`create` lets you create a React Hook with store API utilities.

```js
create(initializer)
```

- [Reference](#reference)
  - [Signature](#create-signature)
  - [`selector` function](#selector-function)
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

### `create` Signature

```ts
create<T>()(initializer: StateCreator<T, [], []>): UseBoundStore<StoreApi<T>>
```

#### Parameters

- `initializer`: The value you want the state to be initially. It can be a value of any type, but
  when you pass a function should take `setState` function, `getState` function and `storeApi` as
  arguments.

#### Returns

`create` returns a React Hook:

1. The React Hook that lets you return data that is based on current state, using a
   [`selector` function](#selector-function). It should take a selector function as its only
   argument.

### `selector` function

The `selector` function lets you return data that is based on current state. It should take current
state as its only argument.

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
[`setState` function](#setstate-function), [`getState` function](#getstate-function), and
[`subscribe` function](#subscribe-function).

## Usage

### Updating state base on previous state

Lorem ipsum, dolor sit amet consectetur adipisicing elit. Incidunt placeat debitis laborum vero
totam excepturi, ducimus, qui molestias, dolorem minus doloribus repudiandae ex delectus corporis
libero quo et numquam quidem?

### Updating objects and non-objects in state

Lorem ipsum dolor sit amet consectetur adipisicing elit. Maxime, quo expedita! Rem aut placeat
excepturi accusamus deserunt velit reprehenderit corrupti amet ad nisi ipsum, veritatis
perspiciatis eligendi possimus quasi facilis!

### Subscribing to state updates

Lorem ipsum dolor, sit amet consectetur adipisicing elit. Ipsa minima cum consectetur magnam,
nostrum temporibus. Exercitationem enim temporibus ipsum doloremque sequi fuga aliquid rem quasi
harum, eos, eaque est ducimus!

## Troubleshooting

### I’ve updated the state, but the screen doesn’t update

Lorem ipsum dolor sit amet consectetur adipisicing elit. Consequatur repudiandae consequuntur
aliquam iste corporis inventore vel dolorum architecto qui error. Et enim voluptate voluptatem
animi, aut quas commodi corporis fugiat.