<p align="center">
  <img width="500" src="bear.png" />
</p>

![Bundle Size](https://badgen.net/bundlephobia/minzip/zustand) [![Build Status](https://travis-ci.org/react-spring/zustand.svg?branch=master)](https://travis-ci.org/react-spring/zustand) [![npm version](https://badge.fury.io/js/zustand.svg)](https://badge.fury.io/js/zustand) ![npm](https://img.shields.io/npm/dt/zustand.svg)

Small, fast and scaleable bearbones state-management solution. Has a comfy api based on hooks, that isn't boilerplatey or opinionated, but still just enough to be explicit and flux-like. Try a small live demo [here](https://codesandbox.io/s/v8pjv251w7).

    npm install zustand

### First create a store

Your store is a hook! You can put anything in it, atomics, objects, functions. Like Reacts setState, `set` *merges* state.

```jsx
import create from 'zustand'

const [useStore] = create(set => ({
  count: 0,
  increase: () => set(state => ({ count: state.count + 1 })),
  reset: () => set({ count: 0 })
}))
```

### Then bind your components, that's it!

Use the hook anywhere, no providers needed. Once you have selected state your component will re-render on changes.

```jsx
function Counter() {
  const count = useStore(state => state.count)
  return <h1>{count}</h1>
}

function Controls() {
  const increase = useStore(state => state.increase)
  return <button onClick={increase}>up</button>
}
```

#### Why zustand over react-redux?

* Simpler and un-opinionated
* Makes hooks the primary means of consuming state
* Doesn't wrap your app into context providers
* Can inform components transiently (without causing render)

---

# Recipes

## Fetching everything

You can, but remember that it will cause the component to update on every state change!

```jsx
const state = useStore()
```

## Selecting multiple state slices

zustand defaults to strict-equality (old === new) to detect changes, this is efficient for atomic state picks.

```jsx
const foo = useStore(state => state.foo)
const bar = useStore(state => state.bar)
```

If you want to construct a single object with multiple state-picks inside, similar to redux's mapStateToProps, you can tell zustand that you want the object to be diffed shallowly by passing an alternative equality function.

```jsx
import shallow from 'zustand/shallow'

// Object pick, re-renders the component when either foo or bar change
const { foo, bar } = useStore(state => ({ foo: state.foo, bar: state.bar }), shallow)

// Array pick, re-renders the component when either foo or bar change
const [foo, bar] = useStore(state => [state.foo, state.bar], shallow)

// Mapped picks, re-renders the component when state.objects changes in order, count or keys
const keys = useStore(state => Object.keys(state.objects), shallow)
```

## Fetching from multiple stores

Since you can create as many stores as you like, forwarding results to succeeding selectors is as natural as it gets.

```jsx
const currentUser = useCredentialsStore(state => state.currentUser)
const person = usePersonStore(state => state.persons[currentUser])
```

## Memoizing selectors

Selectors run on state changes, as well as when the component renders. If you give zustand a fixed reference it will only run on state changes, or when the selector changes. Don't worry about this, unless your selector is expensive.

```js
const fooSelector = useCallback(state => state.foo[props.id], [props.id])
const foo = useStore(fooSelector)
```

## Async actions

Just call `set` when you're ready, it doesn't care if your actions are async or not.

```jsx
const [useStore] = create(set => ({
  json: {},
  fetch: async url => {
    const response = await fetch(url)
    set({ json: await response.json() })
```

## Read from state in actions

`set` allows fn-updates `set(state => result)`, but you still have access to state outside of it through `get`.

```jsx
const [useStore] = create((set, get) => ({
  text: "hello",
  action: () => {
    const text = get().text
```

## Sick of reducers and changing nested state? Use Immer!

Reducing nested structures is tiresome. Have you tried [immer](https://github.com/mweststrate/immer)?

```jsx
import produce from "immer"

const [useStore] = create(set => ({
  nested: { structure: { contains: { a: "value" } } },
  set: fn => set(produce(fn)),
}))

const set = useStore(state => state.set)
set(state => void state.nested.structure.contains = null)
```

## Reading/writing state and reacting to changes outside of components

You can use it with or without React out of the box.

```jsx
const [, api] = create(() => ({ a: 1, b: 2, c: 3 }))

// Getting fresh state
const a = api.getState().a
// Listening to all changes, fires on every dispatch
const unsub1 = api.subscribe(state => console.log("state changed", state))
// Listening to selected changes
const unsub2 = api.subscribe(a => console.log("a changed", a), state => state.a)
// Updating state, will trigger listeners
api.setState({ a: 1 })
// Unsubscribe listeners
unsub1()
unsub2()
// Destroying the store (removing all listeners)
api.destroy()
```

## Transient updates (for often occuring state-changes)

The api signature of subscribe(callback, selector):unsub allows you to easily bind a component to a store without forcing it to re-render on state changes, you will be notified in a callback instead. Best combine it with useEffect for automatic unsubscribe on unmount. This can make a [drastic](https://codesandbox.io/s/peaceful-johnson-txtws) performance difference when you are allowed to mutate the view directly.

```jsx
const [useStore, api] = create(set => ({ "0": [-10, 0], "1": [10, 5], ... }))

function Component({ id }) {
  // Fetch initial state
  const xy = useRef(api.getState()[id])
  // Connect to the store on mount, disconnect on unmount, catch state-changes in a callback
  useEffect(() => api.subscribe(coords => (xy.current = coords), state => state[id]), [id])
```

## Middleware

You can functionally compose your store any way you like.

```jsx
// Log every time state is changed
const log = config => (set, get, api) => config(args => {
  console.log("  applying", args)
  set(args)
  console.log("  new state", get())
}, get, api)

// Turn the set method into an immer proxy
const immer = config => (set, get, api) => config(fn => set(produce(fn)), get, api)

const [useStore] = create(log(immer(set => ({
  text: "hello",
  setText: input => set(state => {
    state.text = input
  })
}))))
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

Or, just use our redux-middleware. It wires up your main-reducer, sets initial state, and adds a dispatch function to the state itself and the vanilla api. Try [this](https://codesandbox.io/s/amazing-kepler-swxol) example.

```jsx
import { redux } from 'zustand/middleware'

const [useStore] = create(redux(reducer, initialState))
```

## Redux devtools

```jsx
import { devtools } from 'zustand/middleware'

// Usage with a plain action store, it will log actions as "setState"
const [useStore] = create(devtools(store))
// Usage with a redux store, it will log full action types
const [useStore] = create(devtools(redux(reducer, initialState)))
```

devtools takes the store function as its first argument, optionally you can name the store with a second argument: `devtools(store, "MyStore")`, which will be prefixed to your actions.
