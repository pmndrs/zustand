---
title: subscribeWithSelector
description: How to subscribe to granular store updates in a store
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
  - TBD

## Reference

### `subscribeWithSelector` Signature

```ts
subscribeWithSelector<T>(stateCreatorFn: StateCreator<T, [], []>): StateCreator<T, [], []>
```

#### Parameters

- `stateCreatorFn`: A function that takes `set` function, `get` function and `api` as arguments.
  Usually, you will return an object with the methods you want to expose.

#### Returns

`subscribeWithSelector` returns a state creator function.

## Usage

## Troubleshooting

TBD
