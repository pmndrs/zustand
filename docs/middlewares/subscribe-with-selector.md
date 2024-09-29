---
title: subscribeWithSelector
description: How to subscribe to granular store updates in a store
nav: 210
---

# subscribeWithSelector

`subscribeWithSelector` middleware lets you subscribe to specific data based on current state.

```js
const nextStateCreatorFn = subscribeWithSelector(stateCreatorFn)
```

- [Types](#types)
  - [Signature](#signature)
  - [Mutator](#mutator)
- [Reference](#reference)
- [Usage](#usage)
- [Troubleshooting](#troubleshooting)
  - TBD

## Types

### Signature

```ts
subscribeWithSelector<T>(stateCreatorFn: StateCreator<T, [], []>): StateCreator<T, [['zustand/subscribeWithSelector', never]], []>
```

### Mutator

<!-- prettier-ignore-start -->
```ts
['zustand/subscribeWithSelector', never]
```
<!-- prettier-ignore-end -->

## Reference

### `subscribeWithSelector(stateCreatorFn)`

#### Parameters

- `stateCreatorFn`: A function that takes `set` function, `get` function and `store` as arguments.
  Usually, you will return an object with the methods you want to expose.

#### Returns

`subscribeWithSelector` returns a state creator function.

## Usage

## Troubleshooting

TBD
