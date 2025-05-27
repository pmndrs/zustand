---
title: custom middleware
description: How to create a custom middleware
nav: 211
---

# custom middleware

You can easily create your own `middleware`, just like the `log` below:

```js
// Log when the state changes
const log = (config) => (set, get, store) =>
  config(
    (...args) => {
      console.log('  applying', args)
      set(...args)
      console.log('  new state', get())
    },
    get,
    store
  )
```

- [Types](#types)
  - [Signature](#combine-signature)
- [Reference](#reference)
- [Usage](#usage)
  - [Log when the state changes](#Log when the state changes)
- [Troubleshooting](#troubleshooting)

## Types

### Signature

```ts
log = <T>(config: StateCreator<T, [], []>): StateCreator<T, [], []>
```

## Reference

### `log(config)`

#### Parameters

- `config`: A function that takes `set` function, `get` function and `store` as arguments. Usually, you will return an object with the methods you want to expose.

#### Returns

`log` returns a state creator function.

## Usage

### Log when the state changes

This example shows you how you can create a store and apply log middleware.

```ts
import { create } from 'zustand'

const useBeeStore = create(
  log((set) => ({
    bees: false,
    setBees: (input) => set({ bees: input }),
  }))
)

const setBees = useBeeStore((state) => state.setBees)
```

## Troubleshooting

TBD
