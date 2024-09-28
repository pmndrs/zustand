---
title: redux
description: How to use actions and reducers in a store
nav: 208
---

# redux

`redux`

```js
redux(reducerFn, initialState)
```

- [Reference](#reference)
  - [Signature](#redux-signature)
- [Usage](#usage)
- [Troubleshooting](#troubleshooting)
  - TBD

## Reference

### `redux` Signature

```ts
redux<T, A>(reducerFn: (state: T, action: A) => T, initialState: T): StateCreator<T & { dispatch: (action: A) => A }, [], []>
```

#### Parameters

- `reducerFn`: It should be pure and should take the current state of your application and an action
  object as arguments, and returns the new state resulting from applying the action.
- `initialState`: The value you want the state to be initially. It can be a value of any type,
  except a function.

#### Returns

`redux` returns a state creator function.

## Usage

## Troubleshooting
