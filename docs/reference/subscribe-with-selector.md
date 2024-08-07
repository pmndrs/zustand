---
title: subscribeWithSelector
description:
nav: 210
---

# subscribeWithSelector

`subscribeWithSelector` middleware lets you subscribe to specific data based on current state.

```js
subscribeWithSelector(stateCreatorFn)
```

- [Reference](#reference)
  - [Signature](#subscribewithselector-signature)
- [Usage](#usage)
- [Troubleshooting](#troubleshooting)

## Reference

### `subscribeWithSelector` Signature

```ts
subscribeWithSelector<T>(stateCreatorFn: StateCreator<T, [], []>): StateCreator<T, [], []>
```

#### Parameters

- `stateCreatorFn`: The state creator function that specifies how the state gets initialized and
  updated. It must be pure, should take `setState` function, `getState` function and `storeApi` as
  arguments.

#### Returns

`subscribeWithSelector` returns a state creator function.

## Usage

## Troubleshooting
