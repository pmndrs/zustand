---
title: create
description:
nav: 204
---

# create

`create` lets you create a store and expose store api utilities.

```js
create(initializer)
```

- [Reference](#reference)
  - [`Signature`](#create-signature)
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
  when you pass a function should take `setState` function, `getState` function and `api` as
  arguments.

#### Returns

`create` returns a hook, that should take `selector` function as its only argument. Also,
expose [`setState`](#selector-function) function, [`getState`](#getstate-function) function, and
[`subscribe`](#subscribe-function) function.

### `selector` function

Lorem ipsum dolor, sit amet consectetur adipisicing elit. Incidunt, natus reiciendis porro earum
fugit, nihil vero adipisci assumenda, quia ab harum nostrum quasi. Dolorem, aspernatur. Nemo quae
repellendus doloribus deserunt?

### `equalityFn` function

Lorem ipsum dolor sit amet consectetur adipisicing elit. Qui perspiciatis inventore minus totam
nihil quasi ipsa, iure pariatur distinctio aspernatur aliquid reprehenderit alias a. Aliquam quis
deleniti temporibus ex vero.

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

### `storeApi`

The `storeApi` lets you access to the store api functions like [`setState`](#setstate-function)
function, [`getState`](#getstate-function) function, and [`subscribe`](#subscribe-function)
function.

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
