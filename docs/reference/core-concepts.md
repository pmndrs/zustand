---
title: Core Concepts
description:
nav: 200
---

# Core Concepts

## Store

The Store lets you access to the current state and API utilities.

## Store API Utilities

These store API utilities lets you get current state, update current state and subscribe current
state. These utilities are: `setState` function, `getState` function, and `subscribe` function.

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

## Selector

The selector function lets you return data that is based on current state. It should take current
state as its only argument.

## Bound Hook

You can create custom hooks in React that utilize closures to "bind" functionality to specific data
or contexts. Within the custom hook, you might define a function that relies on values captured in
the closure during its creation. When you use the custom hook in your component, you're essentially
getting a function that's "bound" to that specific closure's captured data (in Zustand to store API
utilities).

## State Creator Function

The state creator function lets you create a store, when you pass to the `create` function from
Zustand. This function essentially acts as a _**blueprint**_ for your state management needs.
