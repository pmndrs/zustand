---
title: TypeScript Guide
nav: 8
---

## Basic usage

The difference when using TypeScript is that instead of writing `create(...)`, you have to write `create<T>()(...)` (notice the extra parentheses `()` too along with the type parameter) where `T` is the type of the state to annotate it. For example:

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
```

<details>
  <summary>Why can't we simply infer the type from the initial state?</summary>

  <br/>

**TLDR**: Because state generic `T` is invariant.

Consider this minimal version `create`:

```ts
declare const create: <T>(f: (get: () => T) => T) => T

const x = create((get) => ({
  foo: 0,
  bar: () => get(),
}))
// `x` is inferred as `unknown` instead of
// interface X {
//   foo: number,
//   bar: () => X
// }
```

Here, if you look at the type of `f` in `create`, i.e. `(get: () => T) => T`, it "gives" `T` via return (making it covariant), but it also "takes" `T` via `get` (making it contravariant). "So where does `T` come from?" TypeScript wonders. It's like that chicken or egg problem. At the end TypeScript, gives up and infers `T` as `unknown`.

So, as long as the generic to be inferred is invariant (i.e. both covariant and contravariant), TypeScript will be unable to infer it. Another simple example would be this:

```ts
const createFoo = {} as <T>(f: (t: T) => T) => T
const x = createFoo((_) => 'hello')
```

Here again, `x` is `unknown` instead of `string`.

  <details>
    <summary>More about the inference (just for the people curious and interested in TypeScript)</summary>

In some sense this inference failure is not a problem because a value of type `<T>(f: (t: T) => T) => T` cannot be written. That is to say you can't write the real runtime implementation of `createFoo`. Let's try it:

```js
const createFoo = (f) => f(/* ? */)
```

`createFoo` needs to return the return value of `f`. And to do that we first have to call `f`. And to call it we have to pass a value of type `T`. And to pass a value of type `T` we first have to produce it. But how can we produce a value of type `T` when we don't even know what `T` is? The only way to produce a value of type `T` is to call `f`, but then to call `f` itself we need a value of type `T`. So you see it's impossible to actually write `createFoo`.

So what we're saying is, the inference failure in case of `createFoo` is not really a problem because it's impossible to implement `createFoo`. But what about the inference failure in case of `create`? That also is not really a problem because it's impossible to implement `create` too. Wait a minute, if it's impossible to implement `create` then how does Zustand implement it? The answer is, it doesn't.

Zustand lies that it implemented `create`'s type, it implemented only the most part of it. Here's a simple proof by showing unsoundness. Consider the following code:

```ts
import { create } from 'zustand'

const useBoundStore = create<{ foo: number }>()((_, get) => ({
  foo: get().foo,
}))
```

This code compiles. But if we run it, we'll get an exception: "Uncaught TypeError: Cannot read properties of undefined (reading 'foo')". This is because `get` would return `undefined` before the initial state is created (hence you shouldn't call `get` when creating the initial state). The types promise that `get` will never return `undefined` but it does initially, which means Zustand failed to implement it.

And of course Zustand failed because it's impossible to implement `create` the way types promise (in the same way it's impossible to implement `createFoo`). In other words we don't have a type to express the actual `create` we have implemented. We can't type `get` as `() => T | undefined` because it would cause inconveince and it still won't be correct as `get` is indeed `() => T` eventually, just if called synchronously it would be `() => undefined`. What we need is some kind of TypeScript feature that allows us to type `get` as `(() => T) & WhenSync<() => undefined>`, which of course is extremly far-fetched.

So we have two problems: lack of inference and unsoundness. Lack of inference can be solved if TypeScript can improves its inference for invariants. And unsoundness can be solved if TypeScript introduces something like `WhenSync`. To work around lack of inference we manually annotate the state type. And we can't work around unsoundness, but it's not a big deal because it's not much, calling `get` synchronously anyway doesn't make sense.

</details>

</details>

<details>
  <summary>Why the currying `()(...)`?</summary>

  <br/>

**TLDR**: It is a workaround for [microsoft/TypeScript#10571](https://github.com/microsoft/TypeScript/issues/10571).

Imagine you have a scenario like this:

```ts
declare const withError: <T, E>(
  p: Promise<T>,
) => Promise<[error: undefined, value: T] | [error: E, value: undefined]>
declare const doSomething: () => Promise<string>

const main = async () => {
  let [error, value] = await withError(doSomething())
}
```

Here, `T` is inferred to be a `string` and `E` is inferred to be `unknown`. You might want to annotate `E` as `Foo`, because you are certain of the shape of error `doSomething()` would throw. However, you can't do that. You can either pass all generics or none. Along with annotating `E` as `Foo`, you will also have to annotate `T` as `string` even though it gets inferred anyway. The solution is to make a curried version of `withError` that does nothing at runtime. Its purpose is to just allow you annotate `E`.

```ts
declare const withError: {
  <E>(): <T>(
    p: Promise<T>,
  ) => Promise<[error: undefined, value: T] | [error: E, value: undefined]>
  <T, E>(
    p: Promise<T>,
  ): Promise<[error: undefined, value: T] | [error: E, value: undefined]>
}
declare const doSomething: () => Promise<string>
interface Foo {
  bar: string
}

const main = async () => {
  let [error, value] = await withError<Foo>()(doSomething())
}
```

This way, `T` gets inferred and you get to annotate `E`. Zustand has the same use case when we want to annotate the state (the first type parameter) but allow other parameters to get inferred.

</details>

Alternatively, you can also use `combine`, which infers the state so that you do not need to type it.

```ts
import { create } from 'zustand'
import { combine } from 'zustand/middleware'

const useBearStore = create(
  combine({ bears: 0 }, (set) => ({
    increase: (by: number) => set((state) => ({ bears: state.bears + by })),
  })),
)
```

<details>
  <summary>Be a little careful</summary>

  <br/>

We achieve the inference by lying a little in the types of `set`, `get`, and `store` that you receive as parameters. The lie is that they're typed as if the state is the first parameter, when in fact the state is the shallow-merge (`{ ...a, ...b }`) of both first parameter and the second parameter's return. For example, `get` from the second parameter has type `() => { bears: number }` and that is a lie as it should be `() => { bears: number, increase: (by: number) => void }`. And `useBearStore` still has the correct type; for example, `useBearStore.getState` is typed as `() => { bears: number, increase: (by: number) => void }`.

It isn't really a lie because `{ bears: number }` is still a subtype of `{ bears: number, increase: (by: number) => void }`. Therefore, there will be no problem in most cases. You should just be careful while using replace. For example, `set({ bears: 0 }, true)` would compile but will be unsound as it will delete the `increase` function. Another instance where you should be careful is if you use `Object.keys`. `Object.keys(get())` will return `["bears", "increase"]` and not `["bears"]`. The return type of `get` can make you fall for these mistakes.

`combine` trades off a little type-safety for the convenience of not having to write a type for state. Hence, you should use `combine` accordingly. It is fine in most cases and you can use it conveniently.

</details>

Note that we don't use the curried version when using `combine` because `combine` "creates" the state. When using a middleware that creates the state, it isn't necessary to use the curried version because the state now can be inferred. Another middleware that creates state is `redux`. So when using `combine`, `redux`, or any other custom middleware that creates the state, we don't recommend using the curried version.

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

Also, we recommend using `devtools` middleware as last as possible. For example, when you use it with `immer` as a middleware, it should be `immer(devtools(...))` and not `devtools(immer(...))`. This is because`devtools` mutates the `setState` and adds a type parameter on it, which could get lost if other middlewares (like `immer`) also mutate `setState` before `devtools`. Hence using `devtools` at the end makes sure that no middlewares mutate `setState` before it.

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

Zustand middlewares can mutate the store. But how could we possibly encode the mutation on the type-level? That is to say how could do we type `foo` so that this code compiles?

For a usual statically typed language, this is impossible. But thanks to TypeScript, Zustand has something called a "higher-kinded mutator" that makes this possible. If you are dealing with complex type problems, like typing a middleware or using the `StateCreator` type, you will have to understand this implementation detail. For this, you can [check out #710](https://github.com/pmndrs/zustand/issues/710).

If you are eager to know what the answer is to this particular problem then you can [see it here](#middleware-that-changes-the-store-type).

## Common recipes

### Middleware that doesn't change the store type

```ts
import { create, State, StateCreator, StoreMutatorIdentifier } from 'zustand'

type Logger = <
  T extends State,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
>(
  f: StateCreator<T, Mps, Mcs>,
  name?: string,
) => StateCreator<T, Mps, Mcs>

type LoggerImpl = <T extends State>(
  f: StateCreator<T, [], []>,
  name?: string,
) => StateCreator<T, [], []>

const loggerImpl: LoggerImpl = (f, name) => (set, get, store) => {
  type T = ReturnType<typeof f>
  const loggedSet: typeof set = (...a) => {
    set(...a)
    console.log(...(name ? [`${name}:`] : []), get())
  }
  store.setState = loggedSet

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
  State,
  StateCreator,
  StoreMutatorIdentifier,
  Mutate,
  StoreApi,
} from 'zustand'

type Foo = <
  T extends State,
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

type FooImpl = <T extends State, A>(
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
  getBoth: () => void
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

const createBoundedUseStore = ((store) => (selector) => useStore(store)) as <
  S extends StoreApi<unknown>,
>(
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
