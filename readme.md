<p align="center">
  <img width="500" src="bear.png" />
</p>

![Bundle Size](https://badgen.net/bundlephobia/minzip/zustand) [![Build Status](https://travis-ci.org/react-spring/zustand.svg?branch=master)](https://travis-ci.org/react-spring/zustand) [![npm version](https://badge.fury.io/js/zustand.svg)](https://badge.fury.io/js/zustand) ![npm](https://img.shields.io/npm/dt/zustand.svg)

Small, fast and scaleable bearbones state-management solution. Has a comfy api based on hooks, that isn't boilerplatey or opinionated, but still just enough to be explicit and flux-like. Try a small live demo [here](https://codesandbox.io/s/v8pjv251w7).

    npm install zustand

### First create a store

Your store is a hook! You can put anything in it, atomics, objects, functions. The `set` function *merges* state.

```jsx
import create from 'zustand'

const useStore = create(set => ({
  count: 0,
  increase: () => set(state => ({ count: state.count + 1 })),
  reset: () => set({ count: 0 })
}))
```

### Then bind your components, that's it!

Use the hook anywhere, no providers needed. Select your state and the component will re-render on changes.

```jsx
function Counter() {
  const count = useStore(state => state.count)
  return <h1>{count}</h1>
}

function Controls() {
  const increase = useStore(state => state.increase)
  return <button onClick={increase}>one up</button>
}
```

#### Why zustand over react-redux?

* Simple and un-opinionated
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

It is generally recommended to memoize selectors with useCallback. This will prevent unnecessary computations each render. For larger scale apps this can make a real difference. It also allows React to optimize performance in concurrent mode.

```jsx
const foo = useStore(useCallback(state => state.foo[id], [id]))
```

*Note:* If a selector doesn't depend on props or other states, you can define it outside render function.

```jsx
// outside render
const selectFoo = state => state.foo

// inside render
const foo = useStore(selectFoo)
```

## Async actions

Just call `set` when you're ready, it doesn't care if your actions are async or not.

```jsx
const useStore = create(set => ({
  json: {},
  fetch: async url => {
    const response = await fetch(url)
    set({ json: await response.json() })
```

## Read from state in actions

`set` allows fn-updates `set(state => result)`, but you still have access to state outside of it through `get`.

```jsx
const useStore = create((set, get) => ({
  text: "hello",
  action: () => {
    const text = get().text
```

## Sick of reducers and changing nested state? Use Immer!

Reducing nested structures is tiresome. Have you tried [immer](https://github.com/mweststrate/immer)?

```jsx
import produce from 'immer'

const useStore = create(set => ({
  nested: { structure: { contains: { a: "value" } } },
  set: fn => set(produce(fn)),
}))

const set = useStore(state => state.set)
set(state => {
  state.nested.structure.contains = null
})
```

## Reading/writing state and reacting to changes outside of components

Sometimes you need to access the state in a non-reactive way, or act upon the store. For these cases the resulting hook has utility functions attached to its prototype.

```jsx
const useStore = create(() => ({ a: 1, b: 2, c: 3 }))

// Getting non-reactive fresh state
const a = useStore.getState().a
// Listening to all changes, fires on every change
const unsub1 = useStore.subscribe(console.log)
// Listening to selected changes, in this case when "a" changes
const unsub2 = useStore.subscribe(console.log, state => state.a)
// Updating state, will trigger listeners
useStore.setState({ a: 10 })
// Unsubscribe listeners
unsub1()
unsub2()
// Destroying the store (removing all listeners)
useStore.destroy()

// You can of course use the hook as you always would
function SomeComponent() {
  const a = useStore(state => state.a)
```

## Using zustand without React

Zustands core can be imported and used without the React dependency. The only difference is that the create function does not return a hook, but the api utilities.

```jsx
import create from 'zustand/vanilla'

const store = create(() => ({ ... }))
const { getState, setState, subscribe, destroy } = store
```

You can even consume an existing vanilla store with React:

```jsx
import create from 'zustand'
import vanillaStore from './vanillaStore'

const useStore = create(vanillaStore)
```

## Transient updates (for often occuring state-changes)

The subscribe function allows components to bind to a state-portion without forcing re-render on changes. Best combine it with useEffect for automatic unsubscribe on unmount. This can make a [drastic](https://codesandbox.io/s/peaceful-johnson-txtws) performance impact when you are allowed to mutate the view directly.

```jsx
const useStore = create(set => ({ elapsedTime: 0, ... }))

function Component() {
  // Fetch initial state
  const time = useRef(useStore.getState().elapsedTime)
  // Connect to the store on mount, disconnect on unmount, catch state-changes in a reference
  useEffect(() => useStore.subscribe(time => (time.current = time), state => elapsedTime), [])
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

const useStore = create(log(immer(set => ({
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

const useStore = create(set => ({
  count: 0,
  dispatch: args => set(state => reducer(state, args)),
}))

const dispatch = useStore(state => state.dispatch)
dispatch({ type: types.increase, by: 2 })
```

Or, just use our redux-middleware. It wires up your main-reducer, sets initial state, and adds a dispatch function to the state itself and the vanilla api. Try [this](https://codesandbox.io/s/amazing-kepler-swxol) example.

```jsx
import { redux } from 'zustand/middleware'

const useStore = create(redux(reducer, initialState))
```

## Redux devtools

```jsx
import { devtools } from 'zustand/middleware'

// Usage with a plain action store, it will log actions as "setState"
const useStore = create(devtools(store))
// Usage with a redux store, it will log full action types
const useStore = create(devtools(redux(reducer, initialState)))
```

devtools takes the store function as its first argument, optionally you can name the store with a second argument: `devtools(store, "MyStore")`, which will be prefixed to your actions.
