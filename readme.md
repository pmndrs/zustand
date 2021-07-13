<p align="center">
  <img src="bear.jpg" />
</p>

[![Build Status](https://img.shields.io/github/workflow/status/pmndrs/zustand/Lint?style=flat&colorA=000000&colorB=000000)](https://github.com/pmndrs/zustand/actions?query=workflow%3ALint)
[![Build Size](https://img.shields.io/bundlephobia/min/zustand?label=bundle%20size&style=flat&colorA=000000&colorB=000000)](https://bundlephobia.com/result?p=zustand)
[![Version](https://img.shields.io/npm/v/zustand?style=flat&colorA=000000&colorB=000000)](https://www.npmjs.com/package/zustand)
[![Downloads](https://img.shields.io/npm/dt/zustand.svg?style=flat&colorA=000000&colorB=000000)](https://www.npmjs.com/package/zustand)
[![Discord Shield](https://img.shields.io/discord/740090768164651008?style=flat&colorA=000000&colorB=000000&label=discord&logo=discord&logoColor=ffffff)](https://discord.gg/poimandres)

A small, fast and scalable bearbones state-management solution using simplified flux principles. Has a comfy api based on hooks, isn't boilerplatey or opinionated.

Don't disregard it because it's cute. It has quite the claws, lots of time was spent to deal with common pitfalls, like the dreaded [zombie child problem](https://react-redux.js.org/api/hooks#stale-props-and-zombie-children), [react concurrency](https://github.com/bvaughn/rfcs/blob/useMutableSource/text/0000-use-mutable-source.md), and [context loss](https://github.com/facebook/react/issues/13332) between mixed renderers. It may be the one state-manager in the React space that gets all of these right.

You can try a live demo [here](https://codesandbox.io/s/dazzling-moon-itop4).

```bash
npm install zustand # or yarn add zustand
```

## First create a store

Your store is a hook! You can put anything in it: primitives, objects, functions. The `set` function *merges* state.

```jsx
import create from 'zustand'

const useStore = create(set => ({
  bears: 0,
  increasePopulation: () => set(state => ({ bears: state.bears + 1 })),
  removeAllBears: () => set({ bears: 0 })
}))
```

## Then bind your components, and that's it!

Use the hook anywhere, no providers needed. Select your state and the component will re-render on changes.

```jsx
function BearCounter() {
  const bears = useStore(state => state.bears)
  return <h1>{bears} around here ...</h1>
}

function Controls() {
  const increasePopulation = useStore(state => state.increasePopulation)
  return <button onClick={increasePopulation}>one up</button>
}
```

### Why zustand over react-redux?

* Simple and un-opinionated
* Makes hooks the primary means of consuming state
* Doesn't wrap your app in context providers
* [Can inform components transiently (without causing render)](#transient-updates-for-often-occuring-state-changes)

---

# Recipes

## Fetching everything

You can, but bear in mind that it will cause the component to update on every state change!

```jsx
const state = useStore()
```

## Selecting multiple state slices

It detects changes with strict-equality (old === new) by default, this is efficient for atomic state picks.

```jsx
const nuts = useStore(state => state.nuts)
const honey = useStore(state => state.honey)
```

If you want to construct a single object with multiple state-picks inside, similar to redux's mapStateToProps, you can tell zustand that you want the object to be diffed shallowly by passing the `shallow` equality function.

```jsx
import shallow from 'zustand/shallow'

// Object pick, re-renders the component when either state.nuts or state.honey change
const { nuts, honey } = useStore(state => ({ nuts: state.nuts, honey: state.honey }), shallow)

// Array pick, re-renders the component when either state.nuts or state.honey change
const [nuts, honey] = useStore(state => [state.nuts, state.honey], shallow)

// Mapped picks, re-renders the component when state.treats changes in order, count or keys
const treats = useStore(state => Object.keys(state.treats), shallow)
```

For more control over re-rendering, you may provide any custom equality function.

```jsx
const treats = useStore(
  state => state.treats,
  (oldTreats, newTreats) => compare(oldTreats, newTreats)
)
```

## Memoizing selectors

It is generally recommended to memoize selectors with useCallback. This will prevent unnecessary computations each render. It also allows React to optimize performance in concurrent mode.

```jsx
const fruit = useStore(useCallback(state => state.fruits[id], [id]))
```

If a selector doesn't depend on scope, you can define it outside the render function to obtain a fixed reference without useCallback.

```jsx
const selector = state => state.berries

function Component() {
  const berries = useStore(selector)
```

## Overwriting state

The `set` function has a second argument, `false` by default. Instead of merging, it will replace the state model. Be careful not to wipe out parts you rely on, like actions.

```jsx
import omit from "lodash-es/omit"

const useStore = create(set => ({
  salmon: 1,
  tuna: 2,
  deleteEverything: () => set({ }, true), // clears the entire store, actions included
  deleteTuna: () => set(state => omit(state, ['tuna']), true)
}))
```

## Async actions

Just call `set` when you're ready, zustand doesn't care if your actions are async or not.

```jsx
const useStore = create(set => ({
  fishies: {},
  fetch: async pond => {
    const response = await fetch(pond)
    set({ fishies: await response.json() })
  }
}))
```

## Read from state in actions

`set` allows fn-updates `set(state => result)`, but you still have access to state outside of it through `get`.

```jsx
const useStore = create((set, get) => ({
  sound: "grunt",
  action: () => {
    const sound = get().sound
    // ...
  }
})
```

## Reading/writing state and reacting to changes outside of components

Sometimes you need to access state in a non-reactive way, or act upon the store. For these cases the resulting hook has utility functions attached to its prototype.

```jsx
const useStore = create(() => ({ paw: true, snout: true, fur: true }))

// Getting non-reactive fresh state
const paw = useStore.getState().paw
// Listening to all changes, fires on every change
const unsub1 = useStore.subscribe(console.log)
// Listening to selected changes, in this case when "paw" changes
const unsub2 = useStore.subscribe(console.log, state => state.paw)
// Subscribe also supports an optional equality function
const unsub3 = useStore.subscribe(console.log, state => [state.paw, state.fur], shallow)
// Subscribe also exposes the previous value
const unsub4 = useStore.subscribe((paw, previousPaw) => console.log(paw, previousPaw), state => state.paw)
// Updating state, will trigger listeners
useStore.setState({ paw: false })
// Unsubscribe listeners
unsub1()
unsub2()
unsub3()
unsub4()
// Destroying the store (removing all listeners)
useStore.destroy()

// You can of course use the hook as you always would
function Component() {
  const paw = useStore(state => state.paw)
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

:warning: Note that middlewares that modify `set` or `get` are not applied to `getState` and `setState`.

## Transient updates (for often occuring state-changes)

The subscribe function allows components to bind to a state-portion without forcing re-render on changes. Best combine it with useEffect for automatic unsubscribe on unmount. This can make a [drastic](https://codesandbox.io/s/peaceful-johnson-txtws) performance impact when you are allowed to mutate the view directly.

```jsx
const useStore = create(set => ({ scratches: 0, ... }))

function Component() {
  // Fetch initial state
  const scratchRef = useRef(useStore.getState().scratches)
  // Connect to the store on mount, disconnect on unmount, catch state-changes in a reference
  useEffect(() => useStore.subscribe(
    scratches => (scratchRef.current = scratches),
    state => state.scratches
  ), [])
```

## Sick of reducers and changing nested state? Use Immer!

Reducing nested structures is tiresome. Have you tried [immer](https://github.com/mweststrate/immer)?

```jsx
import produce from 'immer'

const useStore = create(set => ({
  lush: { forest: { contains: { a: "bear" } } },
  clearForest: () => set(produce(state => {
    state.lush.forest.contains = null
  }))
}))

const clearForest = useStore(state => state.clearForest)
clearForest();
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
const immer = config => (set, get, api) => config((partial, replace) => {
  const nextState = typeof partial === 'function'
      ? produce(partial)
      : partial
  return set(nextState, replace)
}, get, api)

const useStore = create(
  log(
    immer((set) => ({
      bees: false,
      setBees: (input) => set((state) => void (state.bees = input)),
    })),
  ),
)
```

<details>
<summary>How to pipe middlewares</summary>

```js
import create from "zustand"
import produce from "immer"
import pipe from "ramda/es/pipe"

/* log and immer functions from previous example */
/* you can pipe as many middlewares as you want */
const createStore = pipe(log, immer, create)

const useStore = createStore(set => ({
  bears: 1,
  increasePopulation: () => set(state => ({ bears: state.bears + 1 }))
}))

export default useStore
```
For a TS example see the following [discussion](https://github.com/pmndrs/zustand/discussions/224#discussioncomment-118208)
</details>

<details>
<summary>How to type immer middleware in TypeScript</summary>

```ts
import { State, StateCreator } from 'zustand'
import produce, { Draft } from 'immer'

const immer = <T extends State>(config: StateCreator<T>): StateCreator<T> => 
  (set, get, api) => config((partial, replace) => {
    const nextState =
      typeof partial === 'function'
        ? produce(partial as (state: T) => T)
        : partial as T
    return set(nextState, replace)
  }, get, api)
```

</details>

## Persist middleware

You can persist your store's data using any kind of storage.

```jsx
import create from "zustand"
import { persist } from "zustand/middleware"

export const useStore = create(persist(
  (set, get) => ({
    fishes: 0,
    addAFish: () => set({ fishes: get().fishes + 1 })
  }),
  {
    name: "food-storage", // unique name
    getStorage: () => sessionStorage, // (optional) by default the 'localStorage' is used
  }
))
```

<details>
<summary>How to use custom storage engines</summary>

You can use other storage methods outside of `localStorage` and `sessionStorage` by defining your own `StateStorage`. A custom `StateStorage` object also allows you to write middlware for the persisted store when getting or setting store data.

```tsx
import create from "zustand"
import { persist, StateStorage } from "zustand/middleware"
import { get, set } from 'idb-keyval' // can use anything: IndexedDB, Ionic Storage, etc.

// Custom storage object
const storage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    console.log(name, "has been retrieved");
    return await get(name) || null
  },
  setItem: async (name: string, value: string): Promise<void> => {
    console.log(name, "with value", value, "has been saved");
    set(name, value)
  }
}

export const useStore = create(persist(
  (set, get) => ({
    fishes: 0,
    addAFish: () => set({ fishes: get().fishes + 1 })
  }),
  {
    name: "food-storage", // unique name
    getStorage: () => storage,
  }
))
```

</details>

## Can't live without redux-like reducers and action types?

```jsx
const types = { increase: "INCREASE", decrease: "DECREASE" }

const reducer = (state, { type, by = 1 }) => {
  switch (type) {
    case types.increase: return { grumpiness: state.grumpiness + by }
    case types.decrease: return { grumpiness: state.grumpiness - by }
  }
}

const useStore = create(set => ({
  grumpiness: 0,
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

## Calling actions outside a React event handler

Because React handles `setState` synchronously if it's called outside an event handler. Updating the state outside an event handler will force react to update the components synchronously, therefore adding the risk of encountering the zombie-child effect.
In order to fix this, the action needs to be wrapped in `unstable_batchedUpdates`

```jsx
import { unstable_batchedUpdates } from 'react-dom' // or 'react-native'

const useStore = create((set) => ({
  fishes: 0,
  increaseFishes: () => set((prev) => ({ fishes: prev.fishes + 1 }))
}))

const nonReactCallback = () => {
  unstable_batchedUpdates(() => {
    useStore.getState().increaseFishes()
  })
}
```

More details: https://github.com/pmndrs/zustand/issues/302

## Redux devtools

```jsx
import { devtools } from 'zustand/middleware'

// Usage with a plain action store, it will log actions as "setState"
const useStore = create(devtools(store))
// Usage with a redux store, it will log full action types
const useStore = create(devtools(redux(reducer, initialState)))
```

devtools takes the store function as its first argument, optionally you can name the store with a second argument: `devtools(store, "MyStore")`, which will be prefixed to your actions.
devtools will only log actions from each separated store unlike in a typical *combined reducers* redux store. See an approach to combining stores https://github.com/pmndrs/zustand/issues/163

## React context

The store created with `create` doesn't require context providers. In some cases, you may want to use contexts for dependency injection. Because the store is a hook, passing it as a normal context value may violate rules of hooks. To avoid misusage, a special `createContext` is provided.

```jsx
import create from 'zustand'
import createContext from 'zustand/context'

const { Provider, useStore } = createContext()

const createStore = () => create(...)

const App = () => (
  <Provider createStore={createStore}>
    ...
  </Provider>
)

const Component = () => {
  const state = useStore()
  const slice = useStore(selector)
  ...
}
```
<details>
  <summary>createContext usage in real components</summary>

  ```jsx
  import create from "zustand";
  import createContext from "zustand/context";

  // Best practice: You can move the below createContext() and createStore to a separate file(store.js) and import the Provider, useStore here/wherever you need.

  const { Provider, useStore } = createContext();

  const createStore = () =>
    create((set) => ({
      bears: 0,
      increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
      removeAllBears: () => set({ bears: 0 })
    }));

  const Button = () => {
    return (
        {/** store() - This will create a store for each time using the Button component instead of using one store for all components **/}
      <Provider createStore={createStore}> 
        <ButtonChild />
      </Provider>
    );
  };

  const ButtonChild = () => {
    const state = useStore();
    return (
      <div>
        {state.bears}
        <button
          onClick={() => {
            state.increasePopulation();
          }}
        >
          +
        </button>
      </div>
    );
  };

  export default function App() {
    return (
      <div className="App">
        <Button />
        <Button />
      </div>
    );
  }
  ```
</details>

## TypeScript

```tsx
// You can use `type`
type BearState = {
  bears: number
  increase: (by: number) => void
}

// Or `interface`
interface BearState {
  bears: number
  increase: (by: number) => void
}

// And it is going to work for both
const useStore = create<BearState>(set => ({
  bears: 0,
  increase: (by) => set(state => ({ bears: state.bears + by })),
}))
```

Or, use `combine` and let tsc infer types. This merges two states shallowly.

```tsx
import { combine } from 'zustand/middleware'

const useStore = create(
  combine(
    { bears: 0 },
    (set) => ({ increase: (by: number) => set((state) => ({ bears: state.bears + by })) })
  ),
)
```

## Testing

For information regarding testing with Zustand, visit the dedicated [Wiki page](https://github.com/pmndrs/zustand/wiki/Testing).

## 3rd-Party Libraries

Some users may want to extends Zustand's feature set which can be done using 3rd-party libraries made by the community. For information regarding 3rd-party libraries with Zustand, visit the dedicated [Wiki page](https://github.com/pmndrs/zustand/wiki/3rd-Party-Libraries).

## Comparison with other libraries

- [Difference between zustand and valtio](https://github.com/pmndrs/zustand/wiki/Difference-between-zustand-and-valtio)
