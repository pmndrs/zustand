---
title: How to create a custom middleware
nav: 18
---

In Zustand, middleware is a powerful tool for enhancing the functionality of the store. They allow you to inject custom logic before and after state updates, enabling capabilities such as logging and persistence. Below, we will walk through the creation of a custom middleware by using a logging middleware example.

## Structure of middleware
Each Zustand middleware follows the same function signature:

``` javascript
const customMiddleware = (config) => (set, get, store) => {
  // custom middleware logic
  return config(...) // return the enhanced configuration
}
```

## Implementation of `logger` Middleware

``` javascript
const logger = (config) => (set, get, store) => {
  // return the enhanced configuration
  return config(
    // enhanced set function
    (...args) => {
      console.log('applying:', args)    // logger before state updates
      set(...args)                      // apply set funtion
      console.log('new state:', get())  // logger after state updates
    },
    get,
    store
  )
}
```

## Usage
Apply middleware when creating the store:

```javascript
import create from 'zustand'

const useStore = create(logger((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  reset: () => set({ count: 0 })
})))
```

## Middleware Workflow

1. When the `set` function is called (e.g., `increment()`)
2. The middleware first logs the action parameters: `applying: [ [Function] ]`
3. Executes the actual state update
4. The middleware logs the updated state: `new state: { count: 1, increment: [Function], reset: [Function] }`

## CodeSandbox Demo

https://codesandbox.io/p/sandbox/zustand-logger-middleware-skhxhf?file=/src/App.tsx

