---
title: Calling actions outside a React event handler in pre React 18
nav: 10
---

Because React handles `setState` synchronously if it's called outside an event handler, updating the state outside an event handler will force react to update the components synchronously. Therefore, there is a risk of encountering the zombie-child effect.
In order to fix this, the action needs to be wrapped in `unstable_batchedUpdates` like so:

```jsx
import { unstable_batchedUpdates } from 'react-dom' // or 'react-native'

const useFishStore = create((set) => ({
  fishes: 0,
  increaseFishes: () => set((prev) => ({ fishes: prev.fishes + 1 })),
}))

const nonReactCallback = () => {
  unstable_batchedUpdates(() => {
    useFishStore.getState().increaseFishes()
  })
}
```

More details: https://github.com/pmndrs/zustand/issues/302
