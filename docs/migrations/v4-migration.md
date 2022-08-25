---
title: v4 Migrations
nav: 17
---

If you're not using the typed version (either via TypeScript or via JSDoc) then there are no breaking changes for you and hence no migration is needed either.

Also it's recommended to first read the new [TypeScript Guide](./typescript.md), it'll be easier to understand the migration.

In addition to this migration guide you can also check the diff of the test files in the repo from v3 to v4.

## `create` (from `zustand` and `zustand/vanilla`)

### Change

```diff
- create:
-   < State
-   , StoreSetState = StoreApi<State>["set"]
-   , StoreGetState = StoreApi<State>["get"]
-   , Store = StoreApi<State>
-   >
-     (f: ...) => ...
+ create:
+   { <State>(): (f: ...) => ...
+   , <State, Mutators>(f: ...) => ...
+   }
```

### Migration

If you're not passing any type parameters to `create` then there is no migration needed. If you're using a "leaf" middleware like `combine` or `redux` then remove all type parameters from `create`. Else replace `create<T, ...>(...)` with `create<T>()(...)`.

## `StateCreator` (from `zustand` and `zustand/vanilla`)

### Change

```diff
- type StateCreator
-   < State
-   , StoreSetState = StoreApi<State>["set"]
-   , StoreGetState = StoreApi<State>["get"]
-   , Store = StoreApi<State>
-   > =
-     ...
+ type StateCreator
+   < State
+   , InMutators extends [StoreMutatorIdentifier, unknown][] = []
+   , OutMutators extends [StoreMutatorIdentifier, unknown][] = []
+   , Return = State
+   > =
+     ...
```

### Migration

If you're using `StateCreator` you're likely authoring a middleware or using the "slices" pattern, for that check the TypeScript Guide's ["Authoring middlewares and advanced usage"](https://github.com/pmndrs/zustand/blob/main/docs/typescript.md#authoring-middlewares-and-advanced-usage) and ["Common recipes"](https://github.com/pmndrs/zustand/blob/main/docs/typescript.md#common-recipes) sections.

## `PartialState` (from `zustand` and `zustand/vanilla`)

### Change

```diff
- type PartialState
-   < T extends State
-   , K1 extends keyof T = keyof T
-   , K2 extends keyof T = K1
-   , K3 extends keyof T = K2
-   , K4 extends keyof T = K3
-   > =
-   | (Pick<T, K1> | Pick<T, K2> | Pick<T, K3> | Pick<T, K4> | T)
-   | ((state: T) => Pick<T, K1> | Pick<T, K2> | Pick<T, K3> | Pick<T, K4> | T)
+ type PartialState<T> =
+   | Partial<T>
+   | ((state: T) => Partial<T>)
```

### Migration

Replace `PartialState<T, ...>` with `PartialState<T>` and preferably turn on [`--exactOptionalPropertyTypes`](https://www.typescriptlang.org/tsconfig#exactOptionalPropertyTypes).

We're no longer using the trick to disallow `{ foo: undefined }` to be assigned to `Partial<{ foo: string }>` instead now we're relying on the users to turn on `--exactOptionalPropertyTypes`.

## `useStore` (from `zustand` and `zustand/react`)

### Change

```diff
- useStore:
-   { <State>(store: StoreApi<State>): State
-   , <State, StateSlice>
-       ( store: StoreApi<State>
-       , selector: StateSelector<State, StateSlice>,
-       , equals?: EqualityChecker<StateSlice>
-       ): StateSlice
-   }
+ useStore:
+   <Store, StateSlice = ExtractState<Store>>
+     ( store: Store
+     , selector?: StateSelector<State, StateSlice>,
+     , equals?: EqualityChecker<StateSlice>
+     )
+       => StateSlice
```

### Migration

If you're not passing any type parameters to `useStore` then there is no migration needed. If you are then it's recommended to remove them, or pass the store type instead of the state type as the first parameter.

## `UseBoundStore` (from `zustand` and `zustand/react`)

### Change

```diff
- type UseBoundStore<
-   State,
-   Store = StoreApi<State>
- > =
-   & { (): T
-     , <StateSlice>
-         ( selector: StateSelector<State, StateSlice>
-         , equals?: EqualityChecker<StateSlice>
-         ): U
-     }
-   & Store
+ type UseBoundStore<Store> =
+   & (<StateSlice = ExtractState<S>>
+       ( selector?: (state: ExtractState<S>) => StateSlice
+       , equals?: (a: StateSlice, b: StateSlice) => boolean
+       ) => StateSlice
+     )
+   & S
```

### Migration

Replace `UseBoundStore<T>` with `UseBoundStore<StoreApi<T>>` and `UseBoundStore<T, S>` with `UseBoundStore<S>`

## `UseContextStore` (from `zustand/context`)

### Change

```diff
- type UseContextStore
```

### Migration

Use `typeof MyContext.useStore` instead

## `createContext` (from `zustand/context`)

### Change

```diff
  createContext:
-   <State, Store = StoreApi<State>>() => ...
+   <Store>() => ...
```

### Migration

Replace `createContext<T>()` with `createContext<StoreApi<T>>()` and `createContext<T, S>()` with `createContext<S>()`.

## `combine`, `devtools`, `subscribeWithSelector` (from `zustand/middleware`)

### Change

```diff
- combine:
-   <T, U>(...) => ...
+ combine:
+   <T, U, Mps, Mcs>(...) => ...

- devtools:
-   <T>(...) => ...
+ devtools:
+   <T, Mps, Mcs>(...) => ...

- subscribeWithSelector:
-   <T>(...) => ...
+ subscribeWithSelector:
+   <T, Mps, Mcs>(...) => ...
```

### Migration

If you're not passing any type parameters then there is no migration needed. If you're passing any type parameters, remove them as are inferred.

## `persist` (from `zustand/middleware`)

### Change

```diff
- persist:
-   <T, U = Partial<T>>(...) => ...
+ persist:
+   <T, Mps, Mcs, U = T>(...) => ...
```

### Migration

If you're passing any type parameters, then remove them because they will be inferred. Next, if you're passing the `partialize` option then there's no further steps required for migration.

But if you're not passing the `partialize` option then you might be seeing some compilation errors. If you're not seeing any compilation errors then there's no further steps requierd for migration.

But if you're seeing some compilation errors—because now the type of partialized state is `T` instead of `Partial<T>` which is in alignment with the runtime behavior of default `partialize` being `s => s`—then in that case you should fix the errors because they might be indicative of unsound code. To be clear the runtime behavior has not changed, the types have gotten more correct, but if your partialised state is truly `Partial<T>` then you can pass the `partialize` option as `s => s as Partial<typeof s>`. You can do this for a quickfix too.

## `redux` (from `zustand/middleware`)

### Change

```diff
- redux:
-   <T, A>(...) => ...
+ redux:
+   <T, A, Mps, Mcs>(...) => ...
```

### Migration

If you're not passing any type parameters then there is no migration needed. If you're passing type parameters them remove them and annotate the second (action) parameter. That is replace `redux<T, A>((state, action) => ..., ...)` with `redux((state, action: A) => ..., ...)`.
