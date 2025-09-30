---
title: TypeScript Guide
nav: 7
---

## Basic usage

When you create a Store with TypeScript, you should use a small variation of the `create` function call. Instead of `create(...)`, write `create<T>()(...)`.

> [!NOTE]
>
> - The `<T>` is the type describing your state.
> - The extra pair of parentheses.

Two different jobs:

1. The first call `create<T>()` is only for typing. The `<T>` tells TypeScript: “My store will look like type `T`.”
2. The second call `(...)` is where you give Zustand the function that builds the store (`initial state` + `actions`).

So you’re really saying: “Create a typed store of type `T`, and here is the function that creates everything necessary.”

```ts
import { create } from 'zustand'

// Describe the shape of your state and actions
interface BearState {
  bears: number
  increase: (by: number) => void
}

// Pass the interface as a generic type <BearState>
const useBearStore = create<BearState>()((set) => ({
  bears: 0,
  increase: (by) => set((state) => ({ bears: state.bears + by })),
}))
```

<details>
  <summary>Why can't we simply infer the type from the initial state?</summary>
  <br/>

> [!NOTE]  
> If you’d like to dig into the underlying reason, check out the advanced details below. Otherwise, you can skip this section.

**TLDR**: the generic `T` is used in 2 opposite ways, so TypeScript can’t safely guess it.

Imagine we declare a minimal version of `create`:

- `create` takes a function `f` as an argument
- &nbsp;&nbsp;&nbsp;&nbsp;`f` receives a `get` function
- &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`get` returns the current state of type `T`
- &nbsp;&nbsp;&nbsp;&nbsp;`f` returns a value of type `T`
- `create` returns the same type `T`

```ts
declare const create: <T>(f: (get: () => T) => T) => T

// call `create` without specifying the store type directly
const x = create((get) => ({
  // Some numeric data (as the initial state)
  foo: 0,

  // Method that calls `get()` to read and returns the latest state.
  // This allows the state to reference itself
  bar: () => get(),
}))
```

You would expect `x` to have a type like:

```ts
interface X {
  foo: number
  bar: () => X
}
```

But TypeScript gives it the type `unknown`. Why?

- The function you pass `(get) => ({ foo: 0, bar: ... })` returns `T` => that’s a producer (covariant).
- It also accepts `T` through `get: () => T`=> that’s a consumer (contravariant).

TypeScript sees both directions and concludes:

> “Hold on - who decides what `T` is? I can’t safely pick a type that works for both giving and taking.”

It’s a chicken-and-egg situation... So TypeScript falls back to `unknown`. That’s why Zustand forces you to write the type yourself with
`create<MyState>()(...)`. In this way, you provide the answer instead of letting TypeScript guess.

</details>

<details>
	<summary>More about the TypeScript inference</summary>
	<br/>

> [!NOTE]  
> If you’d like to dig into the underlying reason, check out the advanced details below. Otherwise, you can skip this section.

Why TypeScript “fails” here is actually fine? TypeScript can’t infer the type in a function like this:

```ts
// Hypothetical helper
type CreateFoo = <T>(f: (t: T) => T) => T
```

To return the value from `f`, you’d first have to call `f`. But to call `f`, you must supply a value of type `T`.
To supply that value, you’d have to create one and the only way to create one is… to call `f` again.
It’s a loop with no starting point. So a real runtime implementation of `CreateFoo` is impossible.

That means the inference failure isn’t really a “bug”: there’s no actual JavaScript function that can match this perfect type anyway.

How this relates to the `create` function in Zustand?
Zustand’s `create` has a very similar type signature, so it faces the same theoretical problem.
The library pretends to satisfy the full type, but only implements the practical parts.

This example code compiles, but will throw an error at runtime:

```ts
import { create } from 'zustand'

const useBoundStore = create<{ foo: number }>()((_, get) => ({
  foo: get().foo, // Uncaught TypeError: Cannot read properties of undefined (reading 'foo')
}))
```

Why?
At the moment the initializer runs, `get()` still returns undefined, even though the type says it always returns `{ foo: number }`.  
So the type is a little “unsound”:
TypeScript thinks `get` always has a full store, but at runtime it’s temporarily empty.

Takeaways - there are two issues:

- Inference gap - TypeScript can’t deduce `T` because of the circular dependency. We solve this by manually writing `create<MyState>()(...)`.
- Minor unsoundness - `get()` can be `undefined` during setup. Not a big deal, because calling `get() `synchronously at creation time
  doesn’t make sense in real apps.

Fixing either would require new TypeScript features that don’t exist yet. The types look stricter than reality, but that’s acceptable and safe in everyday Zustand use.

</details>

<details>
	<summary>Be a little careful</summary>
	<br/>

We achieve the inference by lying a little in the types of `set`, `get`, and `store` that you receive as parameters.  
The lie is that they're typed as if the state is only the first parameter, when in fact the state is the shallow-merge `({ ...initialState, ...actions })`

```ts
import { create } from 'zustand'
import { combine } from 'zustand/middleware'

const useBearStore = create(
  combine(
    { bears: 0 },

    // Type "lie": inside this factory TS treats:
    // `set()`, `get()` and `store` as `{ bears: number }`
    // But at runtime the state is the shallow merge of all properties and all actions
    (set, get, store) => ({
      increase: (by: number) => {
        // Here TS only knows `{ bears }`. Runtime exists, type doesn't.
        get().increase // Error TS2339: Property "increase" does not exist on type `{ bears: number; }`

        set((s) => ({ bears: s.bears + by }))
      },

      // Pitfall: `Object.keys(get())` returns merged keys at runtime,
      // not just those from the first arg.
      logKeys: () => {
        const keys = Object.keys(get()) // typed as string[], not narrowed
        console.log(keys) // ["bears", "increase", "logKeys"]
      },
    }),
  ),
)

// Outside, the hook exposes the merged state (the "truth").
const bearState = useBearStore.getState() // { bears: number; increase: (by: number) => void; logKeys: () => void }
```

It isn't really a lie because `{ bears: number }` is still a subtype of `{ bears: number, increase: (by: number) => void }`.
Therefore, there will be no problem in most cases. You should just be careful while using `replace` flag.
Using `replace` mode in `set` inside `combine` will remove all actions. You should avoid this.

```ts
import { create } from 'zustand'
import { combine } from 'zustand/middleware'

// State shape at runtime (after shallow-merge) is:
// { bears: number, increase: (by: number) => void }
const useBearStore = create(
  combine({ bears: 0 }, (set) => ({
    increase: (by: number) => set((s) => ({ bears: s.bears + by })),

    // Safe: merge (by default replace = false). Methods stay intact.
    safeReset: () => set({ bears: 0 }),

    // Dangerous: replace the whole state (replace = true).
    // Compiles because `{ bears }` is a subtype of `{ bears, increase }`,
    // but at runtime this "erases" methods like `increase`.
    unsafeReplace: () => set({ bears: 0 }, true),
  })),
)

useBearStore.getState().increase(1) // Works as expected
useBearStore.getState().unsafeReplace() // After unsafe replace, the runtime object no longer has `increase`
useBearStore.getState().increase(1) // TypeError: "useBearStore.getState(...).increase is not a function". Now `increase` is `undefined`
```

`combine` trades off a little type-safety for the convenience of not having to write a type for state. Hence, you should use combine accordingly. It is fine in most cases and you can use it conveniently.

</details>

> [!NOTE]  
> We don't use the curried version when using `combine`.

The `combine` "creates" the state. When you use a middleware that creates the state, it isn't necessary to use the curried version because the state now can be inferred.
Another middleware that creates state is `redux`.  
So when using `combine`, `redux`, or any other custom middleware that creates the state, we don't recommend using the curried version.

If you want to infer state type also outside of state declaration, you can use the `ExtractState`.  
`ExtractState` is a TypeScript helper type provided by Zustand.
It takes your store (e.g. `typeof useBearStore`) and pulls out the shape of its state so you can reuse that type elsewhere without repeating it.

```ts
import { create, ExtractState } from 'zustand'
import { combine } from 'zustand/middleware'

// If you need the state type elsewhere, extract it from the store hook
export type BearState = ExtractState<typeof useBearStore>

// Store hook
const useBearStore = create(
  combine(
    { bears: 0 }, // initial state
    (set) => ({
      // set-callback with actions
      increase: (by: number) => set((state) => ({ bears: state.bears + by })),
    }),
  ),
)
```

## Using middlewares

You do not have to do anything special to use middlewares in TypeScript.

```ts
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface BearState {
  bears: number
  increase: (by: number) => void
}

const useBearStore = create<BearState>()(
  devtools(
    persist(
      (set) => ({
        bears: 0,
        increase: (by) => set((state) => ({ bears: state.bears + by })),
      }),
      { name: 'bearStore' },
    ),
  ),
)
```

Just make sure you are using them immediately inside `create` so as to make the contextual inference work. Doing something even remotely fancy like the following `myMiddlewares` would require more advanced types.

```ts
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

const myMiddlewares = (f) => devtools(persist(f, { name: 'bearStore' }))

interface BearState {
  bears: number
  increase: (by: number) => void
}

const useBearStore = create<BearState>()(
  myMiddlewares((set) => ({
    bears: 0,
    increase: (by) => set((state) => ({ bears: state.bears + by })),
  })),
)
```

Also, we recommend using `devtools` middleware as last as possible. For example, when you use it with `immer` as a middleware, it should be `devtools(immer(...))` and not `immer(devtools(...))`. This is because`devtools` mutates the `setState` and adds a type parameter on it, which could get lost if other middlewares (like `immer`) also mutate `setState` before `devtools`. Hence using `devtools` at the end makes sure that no middlewares mutate `setState` before it.

## Authoring middlewares and advanced usage

Imagine you had to write this hypothetical middleware.

```ts
import { create } from 'zustand'

const foo = (f, bar) => (set, get, store) => {
  store.foo = bar
  return f(set, get, store)
}

const useBearStore = create(foo(() => ({ bears: 0 }), 'hello'))
console.log(useBearStore.foo.toUpperCase())
```

Zustand middlewares can mutate the store. But how could we possibly encode the mutation on the type-level? That is to say how could we type `foo` so that this code compiles?

For a usual statically typed language, this is impossible. But thanks to TypeScript, Zustand has something called a "higher-kinded mutator" that makes this possible. If you are dealing with complex type problems, like typing a middleware or using the `StateCreator` type, you will have to understand this implementation detail. For this, you can [check out #710](https://github.com/pmndrs/zustand/issues/710).

If you are eager to know what the answer is to this particular problem then you can [see it here](#middleware-that-changes-the-store-type).

### Handling Dynamic `replace` Flag

If the value of the `replace` flag is not known at compile time and is determined dynamically, you might face issues. To handle this, you can use a workaround by annotating the `replace` parameter with the parameters of the `setState` function:

```ts
const replaceFlag = Math.random() > 0.5
const args = [{ bears: 5 }, replaceFlag] as Parameters<
  typeof useBearStore.setState
>
store.setState(...args)
```

#### Example with `as Parameters` Workaround

```ts
import { create } from 'zustand'

interface BearState {
  bears: number
  increase: (by: number) => void
}

const useBearStore = create<BearState>()((set) => ({
  bears: 0,
  increase: (by) => set((state) => ({ bears: state.bears + by })),
}))

const replaceFlag = Math.random() > 0.5
const args = [{ bears: 5 }, replaceFlag] as Parameters<
  typeof useBearStore.setState
>
useBearStore.setState(...args) // Using the workaround
```

By following this approach, you can ensure that your code handles dynamic `replace` flags without encountering type issues.

## Common recipes

### Middleware that doesn't change the store type

```ts
import { create, StateCreator, StoreMutatorIdentifier } from 'zustand'

type Logger = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
>(
  f: StateCreator<T, Mps, Mcs>,
  name?: string,
) => StateCreator<T, Mps, Mcs>

type LoggerImpl = <T>(
  f: StateCreator<T, [], []>,
  name?: string,
) => StateCreator<T, [], []>

const loggerImpl: LoggerImpl = (f, name) => (set, get, store) => {
  const loggedSet: typeof set = (...a) => {
    set(...(a as Parameters<typeof set>))
    console.log(...(name ? [`${name}:`] : []), get())
  }
  const setState = store.setState
  store.setState = (...a) => {
    setState(...(a as Parameters<typeof setState>))
    console.log(...(name ? [`${name}:`] : []), store.getState())
  }

  return f(loggedSet, get, store)
}

export const logger = loggerImpl as unknown as Logger

// ---

const useBearStore = create<BearState>()(
  logger(
    (set) => ({
      bears: 0,
      increase: (by) => set((state) => ({ bears: state.bears + by })),
    }),
    'bear-store',
  ),
)
```

### Middleware that changes the store type

```ts
import {
  create,
  StateCreator,
  StoreMutatorIdentifier,
  Mutate,
  StoreApi,
} from 'zustand'

type Foo = <
  T,
  A,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
>(
  f: StateCreator<T, [...Mps, ['foo', A]], Mcs>,
  bar: A,
) => StateCreator<T, Mps, [['foo', A], ...Mcs]>

declare module 'zustand' {
  interface StoreMutators<S, A> {
    foo: Write<Cast<S, object>, { foo: A }>
  }
}

type FooImpl = <T, A>(
  f: StateCreator<T, [], []>,
  bar: A,
) => StateCreator<T, [], []>

const fooImpl: FooImpl = (f, bar) => (set, get, _store) => {
  type T = ReturnType<typeof f>
  type A = typeof bar

  const store = _store as Mutate<StoreApi<T>, [['foo', A]]>
  store.foo = bar
  return f(set, get, _store)
}

export const foo = fooImpl as unknown as Foo

type Write<T extends object, U extends object> = Omit<T, keyof U> & U

type Cast<T, U> = T extends U ? T : U

// ---

const useBearStore = create(foo(() => ({ bears: 0 }), 'hello'))
console.log(useBearStore.foo.toUpperCase())
```

### `create` without curried workaround

The recommended way to use `create` is using the curried workaround like so: `create<T>()(...)`. This is because it enables you to infer the store type. But if for some reason you do not want to use the workaround, you can pass the type parameters like the following. Note that in some cases, this acts as an assertion instead of annotation, so we don't recommend it.

```ts
import { create } from "zustand"

interface BearState {
  bears: number
  increase: (by: number) => void
}

const useBearStore = create<
        BearState,
        [
          ['zustand/persist', BearState],
          ['zustand/devtools', never]
        ]
>(devtools(persist((set) => ({
  bears: 0,
  increase: (by) => set((state) => ({ bears: state.bears + by })),
}), { name: 'bearStore' }))
```

### Slices pattern

```ts
import { create, StateCreator } from 'zustand'

interface BearSlice {
  bears: number
  addBear: () => void
  eatFish: () => void
}

interface FishSlice {
  fishes: number
  addFish: () => void
}

interface SharedSlice {
  addBoth: () => void
  getBoth: () => number
}

const createBearSlice: StateCreator<
  BearSlice & FishSlice,
  [],
  [],
  BearSlice
> = (set) => ({
  bears: 0,
  addBear: () => set((state) => ({ bears: state.bears + 1 })),
  eatFish: () => set((state) => ({ fishes: state.fishes - 1 })),
})

const createFishSlice: StateCreator<
  BearSlice & FishSlice,
  [],
  [],
  FishSlice
> = (set) => ({
  fishes: 0,
  addFish: () => set((state) => ({ fishes: state.fishes + 1 })),
})

const createSharedSlice: StateCreator<
  BearSlice & FishSlice,
  [],
  [],
  SharedSlice
> = (set, get) => ({
  addBoth: () => {
    // you can reuse previous methods
    get().addBear()
    get().addFish()
    // or do them from scratch
    // set((state) => ({ bears: state.bears + 1, fishes: state.fishes + 1 })
  },
  getBoth: () => get().bears + get().fishes,
})

const useBoundStore = create<BearSlice & FishSlice & SharedSlice>()((...a) => ({
  ...createBearSlice(...a),
  ...createFishSlice(...a),
  ...createSharedSlice(...a),
}))
```

A detailed explanation on the slices pattern can be found [here](./slices-pattern.md).

If you have some middlewares then replace `StateCreator<MyState, [], [], MySlice>` with `StateCreator<MyState, Mutators, [], MySlice>`. For example, if you are using `devtools` then it will be `StateCreator<MyState, [["zustand/devtools", never]], [], MySlice>`. See the ["Middlewares and their mutators reference"](#middlewares-and-their-mutators-reference) section for a list of all mutators.

### Bounded `useStore` hook for vanilla stores

```ts
import { useStore } from 'zustand'
import { createStore } from 'zustand/vanilla'

interface BearState {
  bears: number
  increase: (by: number) => void
}

const bearStore = createStore<BearState>()((set) => ({
  bears: 0,
  increase: (by) => set((state) => ({ bears: state.bears + by })),
}))

function useBearStore(): BearState
function useBearStore<T>(selector: (state: BearState) => T): T
function useBearStore<T>(selector?: (state: BearState) => T) {
  return useStore(bearStore, selector!)
}
```

You can also make an abstract `createBoundedUseStore` function if you need to create bounded `useStore` hooks often and want to DRY things up...

```ts
import { useStore, StoreApi } from 'zustand'
import { createStore } from 'zustand/vanilla'

interface BearState {
  bears: number
  increase: (by: number) => void
}

const bearStore = createStore<BearState>()((set) => ({
  bears: 0,
  increase: (by) => set((state) => ({ bears: state.bears + by })),
}))

const createBoundedUseStore = ((store) => (selector) =>
  useStore(store, selector)) as <S extends StoreApi<unknown>>(
  store: S,
) => {
  (): ExtractState<S>
  <T>(selector: (state: ExtractState<S>) => T): T
}

type ExtractState<S> = S extends { getState: () => infer X } ? X : never

const useBearStore = createBoundedUseStore(bearStore)
```

## Middlewares and their mutators reference

- `devtools` — `["zustand/devtools", never]`
- `persist` — `["zustand/persist", YourPersistedState]`<br/>
  `YourPersistedState` is the type of state you are going to persist, ie the return type of `options.partialize`, if you're not passing `partialize` options the `YourPersistedState` becomes `Partial<YourState>`. Also [sometimes](https://github.com/pmndrs/zustand/issues/980#issuecomment-1162289836) passing actual `PersistedState` won't work. In those cases, try passing `unknown`.
- `immer` — `["zustand/immer", never]`
- `subscribeWithSelector` — `["zustand/subscribeWithSelector", never]`
- `redux` — `["zustand/redux", YourAction]`
- `combine` — no mutator as `combine` does not mutate the store
