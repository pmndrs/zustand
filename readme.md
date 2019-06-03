<p align="center">
  <img width="700" src="bear.png" />
</p>

[![Build Status](https://travis-ci.org/react-spring/zustand.svg?branch=master)](https://travis-ci.org/react-spring/zustand) [![npm version](https://badge.fury.io/js/zustand.svg)](https://badge.fury.io/js/zustand)

    npm install zustand

Small, fast and scaleable bearbones state-management solution. Has a comfy api based on hooks, isn't that boilerplatey or opinionated, but still just enough to be explicit and flux-like, not context based (no reliance on providers, breaches reconciler boundaries), and is cross-platform to boot. Make your paws dirty with a small live demo [here](https://codesandbox.io/s/v8pjv251w7).

#### Create a store (or multiple, up to you...)

You could be in global or component scope, manage your store anywhere you want!

```jsx
import create from 'zustand'

// You store is a hook! Name it anything you like
const [useStore] = create(set => ({
  // Everything in here is your state
  count: 1,
  actions: {
    // You don't have to nest your actions, but makes it easier to fetch them later on
    inc: () => set(state => ({ count: state.count + 1 })), // same semantics as setState
    dec: () => set(state => ({ count: state.count - 1 })), // ... it *merges* state
  },
}))
```

#### Bind components

Look Ma, no providers!

```jsx
function Counter() {
  // Will only re-render the component when "count" changes
  const count = useStore(state => state.count)
  return <h1>{count}</h1>
}

function Controls() {
  // "actions" isn't special, in this case it makes fetching updaters easier
  const actions = useStore(state => state.actions)
  return (
    <>
      <button onClick={actions.inc}>up</button>
      <button onClick={actions.dec}>down</button>
    </>
  )
}
```

# Recipes

## Fetching everything

You can, but remember that it will cause the component to update on every state change!

```jsx
const state = useStore()
```

## Selecting multiple state slices

Just like with Reduxes mapStateToProps, useStore can select state, either atomically or by returning an object. It will run a small shallow-equal test over the results you return and update the component on changes only.

```jsx
const { foo, bar } = useStore(state => ({ foo: state.foo, bar: state.bar }))
```

Atomic selects do the same ...

```jsx
const foo = useStore(state => state.foo)
const bar = useStore(state => state.bar)
```

## Fetching from multiple stores

Since you can create as many stores as you like, forwarding results to succeeding selectors is as natural as it gets.

```jsx
const currentUser = useCredentialsStore(state => state.currentUser)
const person = usePersonStore(state => state.persons[currentUser])
```

## Memoizing selectors, optimizing performance

Say you select a piece of state ...

```js
const foo = useStore(state => state.foo[props.id])
```

Your selector (`state => state.foo[props.id]`) will run on every state change, as well as every time the component renders. It isn't that expensive in this case, but let's optimize it for arguments sake.

You can either pass a static reference:

```js
const fooSelector = useCallback(state => state.foo[props.id], [props.id])
const foo = useStore(fooSelector)
```

Or an optional dependencies array to let zustand know when the selector needs to update:

```js
const foo = useStore(state => state.foo[props.id], [props.id])
```

From now on your selector is memoized and will only run when either the state changes, or the selector itself.

## Async actions

Just call `set` when you're ready, it doesn't care if your actions are async or not.

```jsx
const [useStore] = create(set => ({
  result: '',
  fetch: async url => {
    const response = await fetch(url)
    const json = await response.json()
    set({ result: json })
  },
}))
```

## Read from state in actions

The `set` function already allows functional update `set(state => result)` but should there be cases where you need to access outside of it you have an optional `get`, too.

```jsx
const [useStore] = create((set, get) => ({
  text: "hello",
  action: () => {
    const text = get().text
    ...
  }
}))
```

## Sick of reducers and changing nested state? Use Immer!

Having to build nested structures bearhanded is one of the more tiresome aspects of reducing state. Have you tried [immer](https://github.com/mweststrate/immer)? It is a tiny package that allows you to work with immutable state in a more convenient way. You can easily extend your store with it.

```jsx
import produce from "immer"

const [useStore] = create(set => ({
  set: fn => set(produce(fn)),
  nested: {
    structure: {
      constains: {
        a: "value"
      }
    }
  },
}))

const set = useStore(state => state.set)
set(draft => {
  draft.nested.structure.contains.a.value = false
  draft.nested.structure.contains.anotherValue = true
})
```

## Can't live without redux-like reducers and action types?

```jsx
const types = { increase: "INCREASE", decrease: "DECREASE" }

const reducer = (state, { type, by = 1 }) => {
  switch (type) {
    case types.increase: return { count: state.count + by }
    case types.decrease: return { count: state.count - by }
  }
}

const [useStore] = create(set => ({
  count: 0,
  dispatch: args => set(state => reducer(state, args)),
}))

const dispatch = useStore(state => state.dispatch)
dispatch({ type: types.increase, by: 2 })
```

## Reading/writing state and reacting to changes outside of components

You can use it with or without React out of the box.

```jsx
const [, api] = create({ n: 0 })

// Getting fresh state
const num = api.getState().n
// Listening to changes
const unsub = api.subscribe(state => console.log(state.n))
// And with a selector
const unsub2 = api.subscribe(state => state.n, n => console.log(n))
// Updating state, will trigger listeners
api.setState({ n: 1 })
// Unsubscribing listener
unsub()
// Destroying the store (removing all listeners)
api.destroy()
```

## Transient updates (for often occuring state-changes)

The subscribe method can also select state, similar to the useStore hook. This allows you to bind a component to a store without forcing it to re-render on state changes, you will be notified in a callback instead. This can make a [drastic](https://codesandbox.io/s/peaceful-johnson-txtws) performance difference in some edge cases where you are allowed to mutate the view directly.

```jsx
const [useStore, api] = create(set => ({ ... }))

function Component({ id }) {
  const coords = useRef([0, 0])
  // Connect to the store on mount, disconnect on unmount, catch state-changes in a callback
  useEffect(() => api.subscribe(state => state.coords[id], xy => (coords.current = xy)), [id])
```

## Middleware

```jsx
const logger = fn => (set, get) => fn(args => {
  console.log("  applying", args)
  set(args)
  console.log("  new state", get())
}, get)

const [useStore] = create(logger(set => ({
  text: "hello",
  setText: text => set({ text })
})))
```
