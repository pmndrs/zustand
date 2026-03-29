---
title: combine
description: How to create a store and get types automatically inferred
nav: 32
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
  - [Signature](#signature)
- [Reference](#reference)
- [Usage](#usage)
  - [Creating a store with inferred types](#creating-a-store-with-inferred-types)
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

### TypeScript can't infer the state type inside actions

When using `combine`, TypeScript infers the state type from the initial state object. If you
reference properties that don't exist on the initial state inside your creator function, you'll
get a type error. Make sure all state properties are declared in the initial state:

```ts
// Wrong - `text` is not in initial state, so `get().text` is a type error
const useStore = create(
  combine({ count: 0 }, (set, get) => ({
    text: 'hello',
    getText: () => get().text, // Error: Property 'text' does not exist
  })),
)

// Correct - all state properties in initial state
const useStore = create(
  combine({ count: 0, text: 'hello' }, (set, get) => ({
    getText: () => get().text,
  })),
)
```

### Actions overwrite initial state properties

If the creator function returns an object with the same keys as the initial state, the creator's
values take precedence because `combine` uses `Object.assign`. Keep state and actions separate
to avoid unintentional overrides.
