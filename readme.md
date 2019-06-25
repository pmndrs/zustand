<p align="center">
  <img width="700" src="bear.png" />
</p>

[![Build Status](https://travis-ci.org/react-spring/zustand.svg?branch=master)](https://travis-ci.org/react-spring/zustand) [![npm version](https://badge.fury.io/js/zustand.svg)](https://badge.fury.io/js/zustand)

    npm install zustand

Small, fast and scaleable bearbones state-management solution. Has a comfy api based on hooks, isn't that boilerplatey or opinionated, but still just enough to be explicit and flux-like. Try a small live demo [here](https://codesandbox.io/s/v8pjv251w7).

### How to use it

#### First create a store (or multiple, up to you...)

Your store is a hook! There are no rules, you can put anything in it, atomics, objects, functions. Like Reacts setState, `set` *merges* state, and it has the exact same semantics.

```jsx
import create from 'zustand'

const [useStore] = create(set => ({
  count: 0,
  increase: () => set(state => ({ count: state.count + 1 })),
  reset: () => set({ count: 0 })
}))
```

#### Then bind components with the resulting hook, that's it!

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

### Why zustand over react-redux? This lib ...

1. is simpler and un-opinionated
2. makes hooks the primary means of consuming state
3. isn't strictly dependent on actions, types & dispatch
4. doesn't wrap your app into context providers (which allows it to support [mixed reconcilers](https://github.com/konvajs/react-konva/issues/188))
5. can access state outside of components (and even React)
6. has a solution for rapid state changes (look below for transient updates)
7. is (or can be made) compatible with the redux api

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

If you want to construct a single object with multiple state-picks inside, similar to redux's mapStateToProps, you can tell zustand that you want the object to be diffed shallowly.

```jsx
import { shallowEqual } from 'zustand'

const { foo, bar } = useStore(state => ({ foo: state.foo, bar: state.bar }), shallowEqual)
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
const [, api] = create({ a: 1, b: 2, c: 3 })

// Getting fresh state
const num = api.getState().n
// Listening to all changes, fires on every dispatch
const unsub1 = api.subscribe(state => console.log("state changed", state))
// Listening to selected changes
const unsub2 = api.subscribe(state => state.a, a => console.log("a changed", a))
// Updating state, will trigger listeners
api.setState({ a: 1 })
// Unsubscribe listeners
unsub1()
unsub2()
// Destroying the store (removing all listeners)
api.destroy()
```

## Transient updates (for often occuring state-changes)

The api signature of subscribe([selector,] callback):unsub allows you to easily bind a component to a store without forcing it to re-render on state changes, you will be notified in a callback instead. Best combine it with useEffect. This can make a [drastic](https://codesandbox.io/s/peaceful-johnson-txtws) performance difference when you are allowed to mutate the view directly.

```jsx
const [useStore, api] = create(set => ({ [0]: [-10, 0], [1]: [10, 5], ... }))

function Component({ id }) {
  // Fetch initial state
  const xy = useRef(api.getState()[id])
  // Connect to the store on mount, disconnect on unmount, catch state-changes in a callback
  useEffect(() => api.subscribe(state => state[id], coords => (xy.current = coords)), [id])
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

## Devtools

```jsx
import { devtools } from 'zustand/middleware'

// Usage with a plain action store, it will log actions as "setState"
const [useStore] = create(devtools((set, get => ({ ... })))))
// Usage with a redux store, it will log full action types
const [useStore] = create(devtools(redux(reducer, initialState)))
```
