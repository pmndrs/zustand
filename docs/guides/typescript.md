---
title: TypeScript Guide
nav: 9
---

## Basic usage

The difference when using TypeScript is that instead of typing `create(...)`, you have to type `create<T>()(...)`. `T` would have a type of the state to annotate it. For example:

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
  <summary>Why can we not simply infer the type from the initial state?</summary>

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

Here, if you look at the type of `f` in `create`, i.e. `(get: () => T) => T`, it returns `T`. However, it also "takes" `T` via `get`. Typescript wonders where `T` comes from, like that chicken or egg problem. At the end TypeScript, gives up and infers `T` as `unknown`.

So, as long as the generic to be inferred is invariant, TypeScript will be unable to infer it. Another simple example would be this:

```ts
declare const createFoo: <T>(f: (t: T) => T) => T
const x = createFoo((_) => 'hello')
```

Here again, `x` is `unknown` instead of `string`.

One could argue that it is impossible to write an implementation for `createFoo`, and that would be true. But then it is also impossible to write Zustand's `create(...)`. However, Zustand exists.

The thing is Zustand is lying in its type. The simplest way to prove it is by showing unsoundness. Consider this example:

```ts
import create from 'zustand/vanilla'

const useBoundStore = create<{ foo: number }>()((_, get) => ({
  foo: get().foo,
}))
```

This code compiles. However, you will get an exception when you run it: "Uncaught TypeError: Cannot read properties of undefined (reading 'foo')". This is because `get` would return `undefined` before the initial state is created (hence you should not call `get` when creating the initial state). But the types tell that get is `() => { foo: number }`, which is exactly the lie I was taking about. That value is eventually `get`, but first it is `() => undefined`.

Long story short, Zustand has a strange runtime behavior that can not be typed in a sound and inferrable way. We could make it inferrable with the right TypeScript features. However, those do not exist yet. And the strange behaviour is not a problem.

</details>

<details>
  <summary>Why that currying `()(...)`?</summary>

  <br/>
  
  **TLDR**: It is a workaround for [microsoft/TypeScript#10571](https://github.com/microsoft/TypeScript/issues/10571).

Imagine you have a scenario like this:

```ts
declare const withError: <T, E>(
  p: Promise<T>
) => Promise<[error: undefined, value: T] | [error: E, value: undefined]>
declare const doSomething: () => Promise<string>

const main = async () => {
  let [error, value] = await withError(doSomething())
}
```

Here, `T` is inferred to be a `string` and `E` is inferred to be `unknown`. You might want to annotate `E` as `Foo`, because you are certain of the shape of error `doSomething()` would throw. However, you can not do that. You can either pass all generics or none. Along with annotating `E` as `Foo`, you will also have to annotate `T` as `string` even though it gets inferred anyway. The solution is to make a curried version of `withError` that does nothing at runtime. Its purpose is to just allow you annotate `E`.

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

This way, `T` gets inferred and you get to annotate `E`. Zustand has the same use case when we want to annotate the state (the first type parameter) but allow other parameters to get inferred.

</details>

Alternatively, you can also use `combine`, which infers the state so that you do not need to type it.

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
  <summary>Be a little careful</summary>

  <br/>

We achieve the inference by lying a little in the types of `set`, `get`, and `store` that you receive as parameters. The lie is that they are typed as if the state is the first parameter. In fact, the state is the shallow-merge (`{ ...a, ...b }`) of both first parameter and the second parameter's return. For example, `get` from the second parameter has type `() => { bears: number }` and that is a lie as it should be `() => { bears: number, increase: (by: number) => void }`. And `useBearStore` still has the correct type; for example, `useBearStore.getState` is typed as `() => { bears: number, increase: (by: number) => void }`.

It is technically not lie because `{ bears: number }` is still a subtype of `{ bears: number, increase: (by: number) => void }`. Therefore, there will be no problem in most cases. You should just be careful while using replace. For example, `set({ bears: 0 }, true)` would compile but will be incorrect as it will delete the `increase` function. If you set from "outside" i.e. `useBearStore.setState({ bears: 0 }, true)` then it will not compile because the "outside" store knows that `increase` is missing. Another instance where you should be careful is if you use `Object.keys`. `Object.keys(get())` will return `["bears", "increase"]` and not `["bears"]` (the return type of `get` can make you fall for this).

`combine` trades off a little type-safety for the convenience of not having to write a type for state. Hence, you should use `combine` accordingly. It is fine in most cases and you can use it conveniently.

</details>

Note that we do not use the curried version when using `combine` because `combine` "creates" the state. When using a middleware that creates the state, it is not necessary to use the curried version because the state now can be inferred. Another middleware that creates state is `redux`. So when using `combine`, `redux`, or any other custom middleware that creates the state, we do not recommend using the curried version.

## Using middlewares

You do not have to do anything special to use middlewares in TypeScript.

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

Just make sure you are using them immediately inside `create` so as to make the contextual inference work. Doing something even remotely fancy like the following `myMiddlewares` would require more advanced types.

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

Also, we recommend using `devtools` middleware as an argument, rather than passing arguments to it. For example, when you use it with `immer` as a middleware, it should be `immer(devtools(...))` and not `devtools(immer(...))`. This is because`devtools` mutates the `setState` and adds a type parameter on it, which could get lost if other middlewares (like `immer`) mutates `setState` before `devtools`.

## Authoring middlewares and advanced usage

Imagine you had to write this hypothetical middleware.

```ts
import create from 'zustand'

const foo = (f, bar) => (set, get, store) => {
  store.foo = bar
  return f(set, get, store)
}

const useBearStore = create(foo(() => ({ bears: 0 }), 'hello'))
console.log(useBearStore.foo.toUpperCase())
```

Zustand middlewares can mutate the store. But how could we possibly encode the mutation on the type-level? That is to say how could do we type `foo` so that this code compiles?

For a usual statically typed language, this is impossible. However, with TypeScript, Zustand has something called a "higher kind mutator" that makes this possible. If you are dealing with complex type problems, like typing a middleware or using the `StateCreator` type, you will have to understand this implementation detail. For this, you can [check out #710](https://github.com/pmndrs/zustand/issues/710).

If you are eager to know what the answer is to this particular problem then you can [see it here](#middleware-that-changes-the-store-type).

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

The recommended way to use `create` is using the curried workaround like so: `create<T>()(...)`. This is because it enables you to infer the store type. But if for some reason you do not want to use the workaround, you can pass the type parameters like the following. Note that in some cases, this acts as an assertion instead of annotation, so we do not recommend it.

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

If you have some middlewares then replace `StateCreator<MyState, [], [], MySlice>` with `StateCreator<MyState, Mutators, [], MySlice>`. For example, if you are using `devtools` then it will be `StateCreator<MyState, [["zustand/devtools", never]], [], MySlice>`. See the ["Middlewares and their mutators reference"](#middlewares-and-their-mutators-reference) section for a list of all mutators.

## Middlewares and their mutators reference

- `devtools` — `["zustand/devtools", never]`
- `persist` — `["zustand/persist", YourPersistedState]`<br/>
  `YourPersistedState` is the type of state you are going to persist, ie the return type of `options.partialize`, if you're not passing `partialize` options the `YourPersistedState` becomes `Partial<YourState>`. Also [sometimes](https://github.com/pmndrs/zustand/issues/980#issuecomment-1162289836) passing actual `PersistedState` won't work. In those cases, try passing `unknown`.
- `immer` — `["zustand/immer", never]`
- `subscribeWithSelector` — `["zustand/subscribeWithSelector", never]`
- `redux` — `["zustand/redux", YourAction]`
- `combine` — no mutator as `combine` does not mutate the store
