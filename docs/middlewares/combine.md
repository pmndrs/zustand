---
title: combine
description: How to create a store and get types automatically inferred
nav: 201
---

# combine

`combine` middleware lets you create a cohesive state by merging an initial state with a state
creator function that adds new state slices and actions. This is really helpful as it automatically
infers types, so there’s no need for explicit type definitions.

> [!TIP]
> This makes state management more straightforward and efficient by making curried version of
> `create` and `createStore` not necessary for middleware usage.

```js
const nextStateCreatorFn = combine(initialState, additionalStateCreatorFn)
```

- [Types](#types)
  - [Signature](#combine-signature)
- [Reference](#reference)
- [Usage](#usage)
  - [Creating a state with inferred types](#creating-a-state-wit-inferred-types)
- [Troubleshooting](#troubleshooting)

## Types

### Signature

```ts
combine<T, U>(initialState: T, additionalStateCreatorFn: StateCreator<T, [], [], U>): StateCreator<Omit<T, keyof U> & U, [], []>
```

## Reference

### `combine(initialState, additionalStateCreatorFn)`

#### Parameters

- `initialState`: The value you want the state to be initially. It can be a value of any type,
  except a function.
- `additionalStateCreatorFn`: A function that takes `set` function, `get` function and `store` as
  arguments. Usually, you will return an object with the methods you want to expose.

#### Returns

`combine` returns a state creator function.

## Usage

### Creating a store with inferred types

This example shows you how you can create a store and get types automatically inferred, so you
don’t need to define them explicitly.

```ts
import { createStore } from 'zustand/vanilla'
import { combine } from 'zustand/middleware'

const positionStore = createStore(
  combine({ position: { x: 0, y: 0 } }, (set) => ({
    setPosition: (position) => set({ position }),
  })),
)

const $dotContainer = document.getElementById('dot-container') as HTMLDivElement
const $dot = document.getElementById('dot') as HTMLDivElement

$dotContainer.addEventListener('pointermove', (event) => {
  positionStore.getState().setPosition({
    x: event.clientX,
    y: event.clientY,
  })
})

const render: Parameters<typeof positionStore.subscribe>[0] = (state) => {
  $dot.style.transform = `translate(${state.position.x}px, ${state.position.y}px)`
}

render(positionStore.getInitialState(), positionStore.getInitialState())

positionStore.subscribe(render)
```

Here's the `html` code

```html
<div
  id="dot-container"
  style="position: relative; width: 100vw; height: 100vh;"
>
  <div
    id="dot"
    style="position: absolute; background-color: red; border-radius: 50%; left: -10px; top: -10px; width: 20px; height: 20px;"
  ></div>
</div>
```

## Troubleshooting

TBD
