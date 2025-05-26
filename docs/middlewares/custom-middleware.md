---
title: custom middleware
description: How to create a custom middleware
nav: 211
---

# custom middleware

You can make your own `middleware`.

```js
// Logs will be output every time the state changes
const log = (config) => (set, get, api) =>
  config(
    (...args) => {
      console.log('  applying', args)
      set(...args)
      console.log('  new state', get())
    },
    get,
    api
  )

// zustand
const useBeeStore = create(
  log((set) => ({
    bees: false,
    setBees: (input) => set({ bees: input }),
  }))
)
```


