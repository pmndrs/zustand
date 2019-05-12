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

// Name your store anything you like, but remember, it's a hook!
const [useStore] = create(set => ({
  // Everything in here is your state
  count: 1,
  // You don't have to nest your actions, but makes it easier to fetch them later on
  actions: {
    inc: () => set(state => ({ count: state.count + 1 })), // same semantics as setState
    dec: () => set(state => ({ count: state.count - 1 })),
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
  // "actions" isn't special, we just named it like that to fetch updaters easier
  const { inc, dec } = useStore(state => state.actions)
  return (
    <>
      <button onClick={inc}>up</button>
      <button onClick={dec}>down</button>
    </>
  )
}
```

# Recipes

## Fetching everything

You can, but remember that it will cause the component to update on every state change!

```jsx
const data = useStore()
```

## Selecting multiple state slices

It's just like mapStateToProps in Redux. zustand will run a small shallow equal over the object you return. Of course, it won't cause re-renders if these properties aren't changed in the state model.

```jsx
const { name, age } = useStore(state => ({ name: state.name, age: state.age }))
```

Or, if you prefer, atomic selects do the same ...

```jsx
const name = useStore(state => state.name)
const age = useStore(state => state.age)
```

## Fetching from multiple stores

Since you can create as many stores as you like, forwarding a result into another selector is straight forward.

```jsx
const currentUser = useCredentialsStore(state => state.currentUser)
const person = usePersonStore(state => state.persons[currentUser])
```

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
const types = {
  increase: "INCREASE",
  decrease: "DECREASE"
}

const reducer = (state, { type, ...payload }) => {
  switch (type) {
    case types.increase: return { ...state, count: state.count + 1 }
    case types.decrease: return { ...state, count: state.count - 1 }
  }
  return state
}

const [useStore] = create(set => ({
  count: 0,
  dispatch: args => set(state => reducer(state, args)),
}))

const dispatch = useStore(state => state.dispatch)
dispatch({ type: types.increase })
```

## Reading/writing state and reacting to changes outside of components

You can use it with or without React out of the box.

```jsx
const [, api] = create({ n: 0 })

// Getting fresh state
const n = api.getState().n
// Listening to changes
const unsub = api.subscribe(state => console.log(state.n))
// Updating state, will trigger listeners
api.setState({ n: 1 })
// Unsubscribing handler
unsub()
// Destroying the store
api.destroy()
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

## Memoizing selectors, performance concerns, etc. (this is just additional info)

Zustand tries to be as performant as possible while still being flexible but there are limitations. This is an attempt to breakdown how Zustand works to enable better estimations of the computational cost.

A component is always subscribed to the part of the store that the latest selector returned:
```js
const foo = useStore(state => state.foo) // subscribed only to state.foo
```

The selector is called first to return the selected state and again on ANY modification to the store, even updates made to a different part of the store:
```js
const [useStore, { setState }] = create(() => ({ foo: 'foo', bar: 'bar' }))
function ComponentFoo() {
  return useStore(state => state.foo)
}
function ComponentBar() {
  return useStore(state => state.bar)
}
setState({ bar: 'new bar' }) // All selectors are called but only ComponentBar renders again
```

Zustand calls selectors to compare the selected state (the return value of the selector) with the previous selected state. An update is dispatched to the component if the new selected state is different. The comparison is done with a shallow equality check. The component will then render again with the new selected state. Zustand has to check if the selector is new during the re render because it can be changed at any time. If the selector is new, it's called and the return value is used instead of the selected state that was dispatched.

It's best to use selectors that are not computationally expensive as they are called on every update to the store. You can also skip the additional call to the selector by extracting the selector and passing it in as a static reference:
```js
const fooSelector = state => state.foo
const foo = useStore(fooSelector) // fooSelector only called on initialization and store updates
```

You can also pass an optional dependencies array to let Zustand know when the selector updates:
```js
// selector only called on initialization, store updates, and props.key updates
const part = useStore(state => state[props.key], [props.key])
```
