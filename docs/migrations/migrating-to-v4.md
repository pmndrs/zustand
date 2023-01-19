---
title: Migrating to v4
nav: 19
---

The only breaking changes are in types.
If you are using Zustand with TypeScript
or JSDoc type annotations,
this guide applies.
Otherwise, no migration is required.

Also, it's recommended to first read
the new [TypeScript Guide](../guides/typescript.md),
so that the migration is easier to understand.

In addition to this migration guide,
you can also check the
[diff](https://github.com/pmndrs/zustand/compare/v3.7.2...v4.0.0?short_path=37e5b4c#diff-c21e24854115b390eccde717da83f91feb2d5927a76c1485e5f0fdd0135c2afa)
of the test files in the Zustand repository from v3 to v4.

## `create`

**Applicable imports**

```ts
import create from 'zustand'
import create from 'zustand/vanilla'
```

**Change**

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

**Migration**

If you are not passing any type parameters to `create`,
no migration is required.

If you are using a "leaf" middleware like `combine` or `redux`,
remove all type parameters from `create`.

Else, replace `create<T, ...>(...)` with `create<T>()(...)`.

## `StateCreator`

**Applicable imports**

```ts
import type { StateCreator } from 'zustand'
import type { StateCreator } from 'zustand/vanilla'
```

**Change**

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

**Migration**

If you are using `StateCreator`,
you are likely authoring a middleware
or using the "slices" pattern.
For that check the
[Authoring middlewares and advanced usage](../guides/typescript.md#authoring-middlewares-and-advanced-usage)
and [Common recipes](../guides/typescript.md#common-recipes)
sections of the TypeScript Guide.

## `PartialState`

**Applicable imports**

```ts
import type { PartialState } from 'zustand'
import type { PartialState } from 'zustand/vanilla'
```

**Change**

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

**Migration**

Replace `PartialState<T, ...>` with `PartialState<T>`
and preferably turn on [`exactOptionalPropertyTypes`](https://www.typescriptlang.org/tsconfig#exactOptionalPropertyTypes)
in your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "exactOptionalPropertyTypes": true
  }
}
```

We're no longer using the trick to disallow `{ foo: undefined }`
to be assigned to `Partial<{ foo: string }>`.
Instead, we're relying on the users to turn on `exactOptionalPropertyTypes`.

## `useStore`

**Applicable imports**

```ts
import { useStore } from 'zustand'
import { useStore } from 'zustand/react'
```

**Change**

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

**Migration**

If you are not passing any type parameters to `useStore`,
no migration is required.

If you are,
it's recommended to remove all the type parameters,
or pass the **store** type instead of the **state** type as the first parameter.

## `UseBoundStore`

**Applicable imports**

```ts
import type { UseBoundStore } from 'zustand'
import type { UseBoundStore } from 'zustand/react'
```

**Change**

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

**Migration**

Replace `UseBoundStore<T>` with `UseBoundStore<StoreApi<T>>`,
and `UseBoundStore<T, S>` with `UseBoundStore<S>`

## `UseContextStore`

**Applicable imports**

```ts
import type { UseContextStore } from 'zustand/context'
```

**Change**

```diff
- type UseContextStore
```

**Migration**

Use `typeof MyContext.useStore` instead

## `createContext`

**Applicable imports**

```ts
import createContext from 'zustand/context'
```

**Change**

```diff
  createContext:
-   <State, Store = StoreApi<State>>() => ...
+   <Store>() => ...
```

**Migration**

Replace `createContext<T>()` with `createContext<StoreApi<T>>()`,
and `createContext<T, S>()` with `createContext<S>()`.

## `combine`, `devtools`, `subscribeWithSelector`

**Applicable imports**

```ts
import { combine } from 'zustand/middleware'
import { devtools } from 'zustand/middleware'
import { subscribeWithSelector } from 'zustand/middleware'
```

**Change**

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

**Migration**

If you are not passing any type parameters
to `combine`, `devtools`, or `subscribeWithSelector`,
no migration is required.

If you are,
remove all the type parameters,
as they are inferred automatically.

## `persist`

**Applicable imports**

```ts
import { persist } from 'zustand/middleware'
```

**Change**

```diff
- persist:
-   <T, U = Partial<T>>(...) => ...
+ persist:
+   <T, Mps, Mcs, U = T>(...) => ...
```

**Migration**

If you are passing any type parameters,
remove them as they are inferred automatically.

Next, if you are passing the `partialize` option,
there is no further steps required for migration.

If you are **not** passing the `partialize` option,
you might see some compilation errors.
If you do not see any,
there is no further migration required.

The type of partialized state is now `T` instead of `Partial<T>`,
which aligns with the runtime behavior of the default `partialize`,
which is an identity (`s => s`).

If you see some compilation errors,
you have to find and fix the errors yourself,
because they might be indicative of unsound code.
Alternatively, the workaround will be passing
`s => s as Partial<typeof s>` to `partialize`.
If your partialized state is truly `Partial<T>`,
you should not encounter any bugs.

The runtime behavior has not changed,
only the types are now correct.

## `redux`

**Applicable imports**

```ts
import { redux } from 'zustand/middleware'
```

**Change**

```diff
- redux:
-   <T, A>(...) => ...
+ redux:
+   <T, A, Mps, Mcs>(...) => ...
```

**Migration**

If you are not passing any type parameters to `redux`,
no migration is required.

If you are,
remove all the type parameters,
and annotate only the second (action) parameter.
That is, replace `redux<T, A>((state, action) => ..., ...)`
with `redux((state, action: A) => ..., ...)`.
