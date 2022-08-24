---
title: TypeScript Guide
nav: 9
---

## Basic usage

The difference when using TypeScript is instead of writing `create(...)`, you have to write `create<T>()(...)` where `T` would be type of the state so as to annotate it. Example...

```ts
import create from 'zustand'

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
  <summary>Why can't we just simply infer the type from initial state?</summary>

  <br/>

**TLDR**: Because state generic `T` is invariant.

Consider this minimal version `create`...

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

Here if you look at the type of `f` in `create` ie `(get: () => T) => T` it "gives" `T` as it returns `T` but then it also "takes" `T` via `get` so where does `T` come from TypeScript thinks... It's a like that chicken or egg problem. At the end TypeScript gives up and infers `T` as `unknown`.

So as long as the generic to be inferred is invariant TypeScript won't be able to infer it. Another simple example would be this...

```ts
declare const createFoo: <T>(f: (t: T) => T) => T
const x = createFoo((_) => 'hello')
```

Here again `x` is `unknown` instead of `string`.

Now one can argue it's impossible to write an implementation for `createFoo`, and that's true. But then it's also impossible to write Zustand's `create`... Wait but Zustand exists? So what do I mean by that?

The thing is Zustand is lying in it's type, the simplest way to prove it by showing unsoundness. Consider this example...

```ts
import create from 'zustand/vanilla'

const useBoundStore = create<{ foo: number }>()((_, get) => ({
  foo: get().foo,
}))
```

This code compiles, but guess what happens when you run it? You'll get an exception "Uncaught TypeError: Cannot read properties of undefined (reading 'foo') because after all `get` would return `undefined` before the initial state is created (hence kids don't call `get` when creating the initial state). But the types tell that get is `() => { foo: number }` which is exactly the lie I was taking about, `get` is that eventually but first it's `() => undefined`.

Okay we're quite deep in the rabbit hole haha, long story short zustand has a bit crazy runtime behavior that can't be typed in a sound way and inferrable way. We could make it inferrable with the right TypeScript features that don't exist today. And hey that tiny bit of unsoundness is not a problem.

</details>

<details>
  <summary>Why that currying `()(...)`?</summary>

  <br/>
  
  **TLDR**: It's a workaround for [microsoft/TypeScript#10571](https://github.com/microsoft/TypeScript/issues/10571).

Imagine you have a scenario like this...

```ts
declare const withError: <T, E>(
  p: Promise<T>
) => Promise<[error: undefined, value: T] | [error: E, value: undefined]>
declare const doSomething: () => Promise<string>

const main = async () => {
  let [error, value] = await withError(doSomething())
}
```

Here `T` is inferred as `string` and `E` is inferred as `unknown`. Now for some reason you want to annotate `E` as `Foo` because you're certain what shape of error `doSomething()` would throw. But too bad you can't do that, you can either pass all generics or none. So now along with annotating `E` as `Foo` you'll also have to annotate `T` as `string` which gets inferred anyway. So what to do? What you do is make a curried version of `withError` that does nothing in runtime, it's purpose is to just allow you annotate `E`...

```ts
declare const withError: {
  <E>(): <T>(
    p: Promise<T>
  ) => Promise<[error: undefined, value: T] | [error: E, value: undefined]>
  <T, E>(p: Promise<T>): Promise<
    [error: undefined, value: T] | [error: E, value: undefined]
  >
}
declare const doSomething: () => Promise<string>
interface Foo {
  bar: string
}

const main = async () => {
  let [error, value] = await withError<Foo>()(doSomething())
}
```

And now `T` gets inferred and you get to annotate `E` too. Zustand has the same use case we want to annotate the state (the first type parameter) but allow the rest type parameters to get inferred.

</details>

Alternatively you can also use `combine` which infers the state instead of you having to type it...

```ts
import create from 'zustand'
import { combine } from 'zustand/middleware'

const useBearStore = create(
  combine({ bears: 0 }, (set) => ({
    increase: (by: number) => set((state) => ({ bears: state.bears + by })),
  }))
)
```

<details>
  <summary>But be a little careful...</summary>

  <br/>

We achieve the inference by lying a little in the types of `set`, `get` and `store` that you receive as parameters. The lie is that they're typed in a way as if the state is the first parameter only when in fact the state is the shallow-merge (`{ ...a, ...b }`) of both first parameter and the second parameter's return. So for example `get` from the second parameter has type `() => { bears: number }` and that's a lie as it should be `() => { bears: number, increase: (by: number) => void }`. And `useBearStore` still has the correct type, ie for example `useBearStore.getState` is typed as `() => { bears: number, increase: (by: number) => void }`.

It's not a lie lie because `{ bears: number }` is still a subtype `{ bears: number, increase: (by: number) => void }`, so in most cases there won't be a problem. Just you have to be careful while using replace. For eg `set({ bears: 0 }, true)` would compile but will be unsound as it'll delete the `increase` function. (If you set from "outside" ie `useBearStore.setState({ bears: 0 }, true)` then it won't compile because the "outside" store knows that `increase` is missing.) Another instance where you should be careful you're doing `Object.keys`, `Object.keys(get())` will return `["bears", "increase"]` and not `["bears"]` (the return type of `get` can make you fall for this).

So `combine` trades-off a little type-safety for the convenience of not having to write a type for state. Hence you should use `combine` accordingly, usually it's not a big deal and it's okay to use it.

</details>

Also note that we're not using the curried version when using `combine` because `combine` "creates" the state. When using a middleware that creates the state, it's not necessary to use the curried version because the state now can be inferred. Another middleware that creates state is `redux`. So when using `combine`, `redux` or any other custom middleware that creates the state, it's not recommended to use the curried version.

## Using middlewares

You don't have to do anything special to use middlewares in TypeScript.

```ts
import create from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface BearState {
  bears: number
  increase: (by: number) => void
}

const useBearStore = create<BearState>()(
  devtools(
    persist((set) => ({
      bears: 0,
      increase: (by) => set((state) => ({ bears: state.bears + by })),
    }))
  )
)
```

Just make sure you're using them immediately inside `create` so as to make the contextual inference work. Doing something even remotely fancy like the following `myMiddlewares` would require more advanced types.

```ts
import create from 'zustand'
import { devtools, persist } from 'zustand/middleware'

const myMiddlewares = (f) => devtools(persist(f))

interface BearState {
  bears: number
  increase: (by: number) => void
}

const useBearStore = create<BearState>()(
  myMiddlewares((set) => ({
    bears: 0,
    increase: (by) => set((state) => ({ bears: state.bears + by })),
  }))
)
```

Also it's recommended to use `devtools` middleware as last as possible, in particular after `immer` middleware, ie it should be `immer(devtools(...))` and not `devtools(immer(...))`. The reason being that `devtools` mutates the `setState` and adds a type parameter on it, which could get lost if other middlewares (like `immer`) mutate `setState` before `devtools`.

## Authoring middlewares and advanced usage

Imagine you had to write this hypothetical middleware...

```ts
import create from 'zustand'

const foo = (f, bar) => (set, get, store) => {
  store.foo = bar
  return f(set, get, store)
}

const useBearStore = create(foo(() => ({ bears: 0 }), 'hello'))
console.log(useBearStore.foo.toUpperCase())
```

Yes, if you didn't know Zustand middlewares do and are allowed to mutate the store. But how could we possibly encode the mutation on the type-level? That is to say how could do we type `foo` so that this code compiles?

For an usual statically typed language this is impossible, but thanks to TypeScript, Zustand has something called an "higher kinded mutator" that makes this possible. If you're dealing with complex type problems like typing a middleware or using the `StateCreator` type, then you'll have to understand this implementation detail, for that check out [#710](https://github.com/pmndrs/zustand/issues/710).

If you're eager to know what the answer is to this particular problem then it's [here](#middleware-that-changes-the-store-type).

## Common recipes

### Middleware that does not change the store type

```ts
import create, { State, StateCreator, StoreMutatorIdentifier } from 'zustand'

type Logger = <
  T extends State,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = []
>(
  f: StateCreator<T, Mps, Mcs>,
  name?: string
) => StateCreator<T, Mps, Mcs>

type LoggerImpl = <T extends State>(
  f: PopArgument<StateCreator<T, [], []>>,
  name?: string
) => PopArgument<StateCreator<T, [], []>>

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

type PopArgument<T extends (...a: never[]) => unknown> = T extends (
  ...a: [...infer A, infer _]
) => infer R
  ? (...a: A) => R
  : never

// ---

const useBearStore = create<BearState>()(
  logger(
    (set) => ({
      bears: 0,
      increase: (by) => set((state) => ({ bears: state.bears + by })),
    }),
    'bear-store'
  )
)
```

### Middleware that changes the store type

```ts
import create, {
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
  Mcs extends [StoreMutatorIdentifier, unknown][] = []
>(
  f: StateCreator<T, [...Mps, ['foo', A]], Mcs>,
  bar: A
) => StateCreator<T, Mps, [['foo', A], ...Mcs]>

declare module 'zustand' {
  interface StoreMutators<S, A> {
    foo: Write<Cast<S, object>, { foo: A }>
  }
}

type FooImpl = <T extends State, A>(
  f: PopArgument<StateCreator<T, [], []>>,
  bar: A
) => PopArgument<StateCreator<T, [], []>>

const fooImpl: FooImpl = (f, bar) => (set, get, _store) => {
  type T = ReturnType<typeof f>
  type A = typeof bar

  const store = _store as Mutate<StoreApi<T>, [['foo', A]]>
  store.foo = bar
  return f(set, get, _store)
}

export const foo = fooImpl as unknown as Foo

type PopArgument<T extends (...a: never[]) => unknown> = T extends (
  ...a: [...infer A, infer _]
) => infer R
  ? (...a: A) => R
  : never

type Write<T extends object, U extends object> = Omit<T, keyof U> & U

type Cast<T, U> = T extends U ? T : U

// ---

const useBearStore = create(foo(() => ({ bears: 0 }), 'hello'))
console.log(useBearStore.foo.toUpperCase())
```

### `create` without curried workaround

The recommended way to use `create` is using the curried workaround ie `create<T>()(...)` because this enabled you to infer the store type. But for some reason if you don't want to use the workaround then you can pass the type parameters like the following. Note that in some cases this acts as an assertion instead of annotation, so it's not recommended.

```ts
import create from "zustand"

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
})))
```

### Slices pattern

```ts
import create, { StateCreator } from 'zustand'

interface BearSlice {
  bears: number
  addBear: () => void
  eatFish: () => void
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

interface FishSlice {
  fishes: number
  addFish: () => void
}
const createFishSlice: StateCreator<
  BearSlice & FishSlice,
  [],
  [],
  FishSlice
> = (set) => ({
  fishes: 0,
  addFish: () => set((state) => ({ fishes: state.fishes + 1 })),
})

const useBoundStore = create<BearSlice & FishSlice>()((...a) => ({
  ...createBearSlice(...a),
  ...createFishSlice(...a),
}))
```

If you have some middlewares then replace `StateCreator<MyState, [], [], MySlice>` with `StateCreator<MyState, Mutators, [], MySlice>`. Eg if you're using `devtools` then it'll be `StateCreator<MyState, [["zustand/devtools", never]], [], MySlice>`. See the ["Middlewares and their mutators reference"](#middlewares-and-their-mutators-reference) section for a list of all mutators.

## Middlewares and their mutators reference

- `devtools` — `["zustand/devtools", never]`
- `persist` — `["zustand/persist", YourPersistedState]`<br/>
  `YourPersistedState` is the type of state you're going to persist, ie the return type of `options.partialize`, if you're not passing `partialize` options the `YourPersistedState` becomes `Partial<YourState>`. Also [sometimes](https://github.com/pmndrs/zustand/issues/980#issuecomment-1162289836) passing actual `PersistedState` won't work, in those cases try passing `unknown`.
- `immer` — `["zustand/immer", never]`
- `subscribeWithSelector` — `["zustand/subscribeWithSelector", never]`
- `redux` — `["zustand/redux", YourAction]`
- `combine` — no mutator as `combine` doesn't mutate the store
