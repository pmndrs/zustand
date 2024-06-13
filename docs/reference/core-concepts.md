---
title: Core Concepts
description:
nav: 200
---

# Core Concepts

## Store

The Store lets you access to the store API utilities.

## API Utilities

These store API utilities are: `setState` function, `getState` function, and `subscribe` function.

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

### Selector

Lorem, ipsum dolor sit amet consectetur adipisicing elit. Vel veritatis alias saepe vitae placeat
blanditiis laborum, asperiores architecto explicabo unde. Cum sint vero veritatis. Hic ipsum quis
saepe voluptates temporibus!

### Bound Hook

Lorem, ipsum dolor sit amet consectetur adipisicing elit. Minus quas sequi, similique corrupti iure
incidunt autem. Voluptas eum atque harum! Assumenda natus, animi doloribus facilis maiores dicta
iusto ipsa earum.
