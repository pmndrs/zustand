---
title: createStore
description:
nav: 202
---

# createStore

`createStore` lets you create a vanilla store with store API utilities. In React, you can utilize a
vanilla store using the [`useStore`](./use-store) hook.

```js
createStore(initializer)
```

- [Reference](#reference)
  - [Signature](#createstore-signature)
  - [`setState` function](#setstate-function)
  - [`getState` function](#getstate-function)
  - [`subscribe` function](#subscribe-function)
  - [`storeApi`](#storeapi)
- [Usage](#usage)
  - [Updating state based on previous state](#updating-state-base-on-a-previous-state)
  - [Updating objects and non-objects in state](#updating-objects-and-non-objects-in-state)
  - [Subscribing to state updates](#subscribing-to-state-updates)
  - [Split state in multiple slices](#split-state-in-multiple-slices)
- [Troubleshooting](#troubleshooting)
  - [I’ve updated the state, but the screen doesn’t update](#ive-updated-the-state-but-the-screen-doesnt-update)

## Reference

### `createStore` Signature

```ts
createStore<T>()(initializer: StateCreator<T, [], []>): StoreApi<T>
```

#### Parameters

- `initializer`: The value you want the state to be initially. It can be a value of any type, but
  when you pass a function should take `setState` function, `getState` function and `storeApi` as
  arguments.

#### Returns

`createStore` returns a vanilla store with some API utilities. These API utilities are: `setState`
function, `getState` function, and `subscribe` function.

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

### Updating state base on a previous state

Lorem ipsum dolor sit amet consectetur adipisicing elit. Nam in provident eius eaque modi,
architecto consequuntur nihil soluta, dolore ratione, deleniti voluptatum unde. Qui veritatis,
deleniti error vero ducimus sunt.

### Updating objects and non-objects in state

Lorem, ipsum dolor sit amet consectetur adipisicing elit. Cupiditate consectetur sequi repellendus
culpa nesciunt dolores aut. Voluptas corrupti expedita temporibus doloribus, maxime dolor iure
suscipit adipisci hic cumque quasi officia?

### Subscribing to state updates

Lorem ipsum dolor sit amet, consectetur adipisicing elit. Aut quidem est neque consequuntur,
dolorem eius, explicabo ullam voluptatibus ex corporis qui, quasi eum reprehenderit maxime! Magni
magnam dignissimos eos dicta!

### Split state in multiple slices

Lorem ipsum dolor sit amet consectetur adipisicing elit. Repellat, sint doloremque incidunt beatae
asperiores tempore amet quam ipsa commodi adipisci nobis quis fugiat aliquam? Facere repellendus
asperiores incidunt maxime facilis?

## Troubleshooting

Lorem, ipsum dolor sit amet consectetur adipisicing elit. Aut illo, earum beatae voluptate corporis
saepe ipsa? Placeat animi commodi qui odit debitis eveniet enim maiores, illum tempora repellendus
sint non?

### I’ve updated the state, but the screen doesn’t update

Lorem ipsum dolor sit amet consectetur adipisicing elit. Modi facere vel minus saepe inventore hic
tenetur aspernatur officia ipsam accusantium illum, neque consectetur placeat doloremque pariatur
voluptatum amet odio quos!