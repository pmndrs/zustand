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

### Subscribing partial state updates

By subscribing to partial state updates, you register a callback that fires whenever the store's
partial state updates. We can use `subscribe` for external state management.

```ts
import { createStore } from 'zustand/vanilla'
import { subscribeWithSelector } from 'zustand/middleware'

type PositionStoreState = { position: { x: number; y: number } }

type PositionStoreActions = {
  setPosition: (nextPosition: PositionStoreState['position']) => void
}

type PositionStore = PositionStoreState & PositionStoreActions

const positionStore = createStore<PositionStore>()(
  subscribeWithSelector((set) => ({
    position: { x: 0, y: 0 },
    setPosition: (position) => set({ position }),
  })),
)

const $dot = document.getElementById('dot') as HTMLDivElement

$dot.addEventListener('mouseenter', (event) => {
  const parent = event.currentTarget.parentElement
  const parentWidth = parent.clientWidth
  const parentHeight = parent.clientHeight

  positionStore.getState().setPosition({
    x: Math.ceil(Math.random() * parentWidth),
    y: Math.ceil(Math.random() * parentHeight),
  })
})

const render: Parameters<typeof positionStore.subscribe>[0] = (state) => {
  $dot.style.transform = `translate(${state.position.x}px, ${state.position.y}px)`
}

render(positionStore.getInitialState(), positionStore.getInitialState())

positionStore.subscribe((state) => state.position, render)

const logger: Parameters<typeof positionStore.subscribe>[0] = (x) => {
  console.log('new x position', { x })
}

positionStore.subscribe((state) => state.position.x, logger)
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
