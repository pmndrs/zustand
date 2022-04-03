<p align="center">
  <img src="bear.jpg" />
</p>

[![Build Status](https://img.shields.io/github/workflow/status/pmndrs/zustand/Lint?style=flat&colorA=000000&colorB=000000)](https://github.com/pmndrs/zustand/actions?query=workflow%3ALint)
[![Build Size](https://img.shields.io/bundlephobia/minzip/zustand?label=bundle%20size&style=flat&colorA=000000&colorB=000000)](https://bundlephobia.com/result?p=zustand)
[![Version](https://img.shields.io/npm/v/zustand?style=flat&colorA=000000&colorB=000000)](https://www.npmjs.com/package/zustand)
[![Downloads](https://img.shields.io/npm/dt/zustand.svg?style=flat&colorA=000000&colorB=000000)](https://www.npmjs.com/package/zustand)
[![Discord Shield](https://img.shields.io/discord/740090768164651008?style=flat&colorA=000000&colorB=000000&label=discord&logo=discord&logoColor=ffffff)](https://discord.gg/poimandres)

A small, fast and scalable bearbones state-management solution using simplified flux principles. Has a comfy api based on hooks, isn't boilerplatey or opinionated.

Don't disregard it because it's cute. It has quite the claws, lots of time was spent to deal with common pitfalls, like the dreaded [zombie child problem](https://react-redux.js.org/api/hooks#stale-props-and-zombie-children), [react concurrency](https://github.com/bvaughn/rfcs/blob/useMutableSource/text/0000-use-mutable-source.md), and [context loss](https://github.com/facebook/react/issues/13332) between mixed renderers. It may be the one state-manager in the React space that gets all of these right.

You can try a live demo [here](https://githubbox.com/pmndrs/zustand/tree/main/examples).

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

### Why zustand over redux?

* Simple and un-opinionated
* Makes hooks the primary means of consuming state
* Doesn't wrap your app in context providers
* [Can inform components transiently (without causing render)](#transient-updates-for-often-occuring-state-changes)

### Why zustand over context?

* Less boilerplate
* Renders components only on changes
* Centralized, action-based state management

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
// Listening to all changes, fires synchronously on every change
const unsub1 = useStore.subscribe(console.log)
// Updating state, will trigger listeners
useStore.setState({ paw: false })
// Unsubscribe listeners
unsub1()
// Destroying the store (removing all listeners)
useStore.destroy()

// You can of course use the hook as you always would
function Component() {
  const paw = useStore(state => state.paw)
```

### Using subscribe with selector

If you need to subscribe with selector,
`subscribeWithSelector` middleware will help.

With this middleware `subscribe` accepts an additional signature:
```ts
subscribe(selector, callback, options?: { equalityFn, fireImmediately }): Unsubscribe
```

```js
import { subscribeWithSelector } from 'zustand/middleware'
const useStore = create(subscribeWithSelector(() => ({ paw: true, snout: true, fur: true })))

// Listening to selected changes, in this case when "paw" changes
const unsub2 = useStore.subscribe(state => state.paw, console.log)
// Subscribe also exposes the previous value
const unsub3 = useStore.subscribe(state => state.paw, (paw, previousPaw) => console.log(paw, previousPaw))
// Subscribe also supports an optional equality function
const unsub4 = useStore.subscribe(state => [state.paw, state.fur], console.log, { equalityFn: shallow })
// Subscribe and fire immediately
const unsub5 = useStore.subscribe(state => state.paw, console.log, { fireImmediately: true })
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
    state => (scratchRef.current = state.scratches)
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
    getStorage: () => sessionStorage, // (optional) by default, 'localStorage' is used
  }
))
```

[See the full documentation for this middleware.](https://github.com/pmndrs/zustand/wiki/Persisting-the-store's-data)

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

devtools takes the store function as its first argument, optionally you can name the store or configure [serialize](https://github.com/zalmoxisus/redux-devtools-extension/blob/master/docs/API/Arguments.md#serialize) options with a second argument.  
  
Name store: `devtools(store, {name: "MyStore"})`, which will create a seperate instance named "MyStore" in the devtools.

Serialize options: `devtools(store, { serialize: { options: true } })`.
  
#### Logging Actions

devtools will only log actions from each separated store unlike in a typical *combined reducers* redux store. See an approach to combining stores https://github.com/pmndrs/zustand/issues/163

You can log a specific action type for each `set` function by passing a third parameter:

```jsx
const createBearSlice = (set, get) => ({
  eatFish: () =>
    set(
      (prev) => ({ fishes: prev.fishes > 1 ? prev.fishes - 1 : 0 }),
      false,
      "bear/eatFish"
    ),
})
```

If an action type is not provided, it is defaulted to "anonymous". You can customize this default value by providing an `anonymousActionType` parameter: 

```jsx
devtools(..., { anonymousActionType: 'unknown', ... })
```

## React context

The store created with `create` doesn't require context providers. In some cases, you may want to use contexts for dependency injection or if you want to initialize your store with props from a component. Because the normal store is a hook, passing it as a normal context value may violate rules of hooks.

The flexible method available since v4 is to use vanilla store.

```jsx
import { createContext, useContext } from 'react'
import { createStore, useStore } from 'zustand'

const store = createStore(...) // vanilla store without hooks

const StoreContext = createContext()

const App = () => (
  <StoreContext.Provider value={store}>
    ...
  </StoreContext.Provider>
)

const Component = () => {
  const store = useContext(StoreContext)
  const slice = useStore(store, selector)
  ...
}
```

Alternatively, a special `createContext` is provided since v3.5,
which avoid misusing the store hook.

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

<details>
  <summary>createContext usage with initialization from props (in TypeScript)</summary>

  ```tsx
  import create from "zustand";
  import createContext from "zustand/context";

  type BearState = {
    bears: number
    increase: () => void
  }

  // pass the type to `createContext` rather than to `create`
  const { Provider, useStore } = createContext<BearState>();

  export default function App({ initialBears }: { initialBears: number }) {
    return (
      <Provider
        createStore={() =>
          create((set) => ({
            bears: initialBears,
            increase: () => set((state) => ({ bears: state.bears + 1 })),
          }))
        }
      >
        <Button />
      </Provider>
  )
}
  ```
</details>

## TypeScript Usage

### Basic usage

When using TypeScript you just have to make a tiny change that instead of writing `create(...)` you'll have to write `create<T>()(...)` where `T` would be type of the state so as to annotate it. Example...

```ts
import create from "zustand";

interface BearState {
  bears: number
  increase: (by: number) => void
}

const useStore = create<BearState>()((set) => ({
  bears: 0,
  increase: (by) => set((state) => ({ bears: state.bears + by })),
}))
```

<details>
  <summary>Why can't we just simply infer the type from initial state?</summary>

  **TLDR**: Because state generic `T` is invariant.
  
  Consider this minimal version `create`...

  ```ts
  declare const create: <T>(f: (get: () => T) => T) => T

  const x = create(get => ({
    foo: 0,
    bar: () => get()
  }))
  // `x` is inferred as `unknown` instead of
  // interface X {
  //   foo: number,
  //   bar: () => X
  // }
  ```

  Here if you look at the type of `f` in `create` ie `(get: () => T) => T` it "gives" `T` as it returns `T` but then it also "takes" `T` via `get` so where does `T` come from TypeScript thinks... It's a like that chicken or egg problem. At the end TypeScript gives up and infers `T` as `unknown`.

  So as long as the generic to be inferred is invariant TypeScript won't be able to infer it. Another simple example would be this...

  ```ts
  declare const createFoo: <T>(f: (t: T) => T) => T
  const x = createFoo(_ => "hello")
  ```

  Here again `x` is `unknown` instead of `string`.
  
  Now one can argue it's impossible to write an implementation for `createFoo`, and that's true. But then it's also impossible to write Zustand's `create`... Wait but Zustand exists? So what do I mean by that?

  The thing is Zustand is lying in it's type, the simplest way to prove it by showing unsoundness. Consider this example...

  ```ts
  import create from "zustand/vanilla"

  const useStore = create<{ foo: number }>()((_, get) => ({
    foo: get().foo,
  }))
  ```

  This code compiles, but guess what happens when you run it? You'll get an exception "Uncaught TypeError: Cannot read properties of undefined (reading 'foo') because after all `get` would return `undefined` before the initial state is created (hence kids don't call `get` when creating the initial state). But the types tell that get is `() => { foo: number }` which is exactly the lie I was taking about, `get` is that eventually but first it's `() => undefined`.

  Okay we're quite deep in the rabbit hole haha, long story short zustand has a bit crazy runtime behavior that can't be typed in a sound way and inferrable way. We could make it inferrable with the right TypeScript features that don't exist today. And hey that tiny bit of unsoundness is not a problem.
</details>

<details>
  <summary>Why that currying `()(...)`?</summary>
  
  **TLDR**: It's a workaround for [microsoft/TypeScript#10571](https://github.com/microsoft/TypeScript/issues/10571).

  Imagine you have a scenario like this...

  ```ts
  declare const withError: <T, E>(p: Promise<T>) =>
    Promise<[error: undefined, value: T] | [error: E, value: undefined]>
  declare const doSomething: () => Promise<string>

  const main = async () => {
    let [error, value] = await withError(doSomething())
  }
  ```

  Here `T` is inferred as `string` and `E` is inferred as `unknown`. Now for some reason you want to annotate `E` as `Foo` because you're certain what shape of error `doSomething()` would throw. But too bad you can't do that, you can either pass all generics or none. So now along with annotating `E` as `Foo` you'll also have to annotate `T` as `string` which gets inferred anyway. So what to do? What you do is make a curried version of `withError` that does nothing in runtime, it's purpose is to just allow you annotate `E`...

  ```ts
  declare const withError: {
    <E>(): <T>(p: Promise<T>) =>
      Promise<[error: undefined, value: T] | [error: E, value: undefined]>
    <T, E>(p: Promise<T>):
      Promise<[error: undefined, value: T] | [error: E, value: undefined]>
  }
  declare const doSomething: () => Promise<string>
  interface Foo { bar: string }

  const main = async () => {
    let [error, value] = await withError<Foo>()(doSomething())
  }
  ```

  And now `T` gets inferred and you get to annotate `E` too. Zustand has the same use case we want to annotate the state (the first type parameter) but allow the rest type parameters to get inferred.
</details>

### Using middlewares

You don't have to do anything special to use middlewares in TypeScript.

```ts
import create from "zustand"
import { devtools, persist } from "zustand/middleware"

interface BearState {
  bears: number
  increase: (by: number) => void
}

const useStore = create<BearState>()(devtools(persist((set) => ({
  bears: 0,
  increase: (by) => set((state) => ({ bears: state.bears + by })),
}))))
```

Just make sure you're using them immediately inside `create` so as to make the contextual inference work. Doing something even remotely fancy like the following `myMiddlewares` would require more advanced types.

```ts
import create from "zustand"
import { devtools, persist } from "zustand/middleware"

const myMiddlewares = f => devtools(persist(f))

interface BearState {
  bears: number
  increase: (by: number) => void
}

const useStore = create<BearState>()(myMiddlewares((set) => ({
  bears: 0,
  increase: (by) => set((state) => ({ bears: state.bears + by })),
})))
```

### Authoring middlewares and advanced usage

Imagine you had to write this hypothetical middleware...

```js
import create from "zustand"

const foo = (f, bar) => (set, get, store) => {
  store.foo = bar
  return f(set, get, store);
}

const useStore = create(foo(() => ({ bears: 0 }), "hello"))
console.log(store.foo.toUpperCase())
```

Yes, if you didn't know Zustand middlewares do and are allowed to mutate the store. But how could we possibly encode the mutation on the type-level? That is to say how could do we type `foo` so that this code compiles?

For an usual statically typed language this is impossible, but thanks to TypeScript, Zustand has something called an "higher kinded mutator" that makes this possible. If you're dealing with complex type problems like typing a middleware or using the `StateCreator` type, then you'll have to understand this implementation detail, for that check out [#710](https://github.com/pmndrs/zustand/issues/710).

<details>
  <summary>If you're eager to know what the answer is to this particular problem then it's the following...</summary>

  ```js
  import create, { State, StateCreator, StoreMutatorIdentifier, Mutate, StoreApi } from "zustand"

  type Foo =
    < T extends State
    , A
    , Mps extends [StoreMutatorIdentifier, unknown][] = []
    , Mcs extends [StoreMutatorIdentifier, unknown][] = []
    >
      ( f: StateCreator<T, [...Mps, ['foo', A]], Mcs>
      , bar: A
      ) =>
        StateCreator<T, Mps, [['foo', A], ...Mcs]>

  declare module 'zustand' {
    interface StoreMutators<S, A> {
      foo: Write<Cast<S, object> { foo: A }>
    }
  }

  type FooImpl =
    <T extends State, A>
      ( f: PopArgument<StateCreator<T, [], []>>
      , bar: A
      ) => PopArgument<StateCreator<T, [], []>>

  const fooImpl: FooImpl = (f, bar) => (set, get, _store) => {
    type T = ReturnType<typeof f>
    type A = typeof bar

    const store = _store as Mutate<StoreApi<T>, [['foo', A]]>
    store.foo = bar
    return f(set, get, _store)
  }

  export const foo = fooImpl as unknown as Foo

  type PopArgument<T extends (...a: never[]) => unknown> =
    T extends (...a: [...infer A, infer _]) => infer R
      ? (...a: A) => R
      : never

  type Write<T extends object, U extends object> =
    Omit<T, keyof U> & U

  type Cast<T, U> =
    T extends U ? T : U;

  // ---

  const useStore = create(foo(() => ({ bears: 0 }), "hello"))
  console.log(store.foo.toUpperCase())
  ```
</details>

## Best practices
  
* You may wonder how to organize your code for better maintenance: [Splitting the store into seperate slices](https://github.com/pmndrs/zustand/wiki/Splitting-the-store-into-separate-slices).
  
* Recommended usage for this unopinionated library: [Flux inspired practice](https://github.com/pmndrs/zustand/wiki/Flux-inspired-practice).
  
## Testing

For information regarding testing with Zustand, visit the dedicated [Wiki page](https://github.com/pmndrs/zustand/wiki/Testing).

## 3rd-Party Libraries

Some users may want to extends Zustand's feature set which can be done using 3rd-party libraries made by the community. For information regarding 3rd-party libraries with Zustand, visit the dedicated [Wiki page](https://github.com/pmndrs/zustand/wiki/3rd-Party-Libraries).

## Comparison with other libraries

- [Difference between zustand and valtio](https://github.com/pmndrs/zustand/wiki/Difference-between-zustand-and-valtio)
