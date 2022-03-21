# v4.0.0

## At a glance

### TypeScript Improvements

Imagine you want to have a store that uses `devtools` and `persist` middleware. In v3.7.x you'd write this something like...

```typescript
import create, { GetState, SetState } from "zustand"
import { devtools, persist, StoreApiWithDevtools, StoreApiWithPersist } from "zustand/middleware"

interface BearState {
  count: number,
  reset: () => void,
  clearPersistStorage: () => void
}

let useStore = create<
  BearState,
  SetState<BearState>,
  GetState<BearState>,
  StoreApiWithDevtools<BearState> & StoreApiWithPersist<BearState>
  // or in v3.7.x as...
  // Mutate<StoreApi<BearState>, [["zustand/persist", BearState], ["zustand/devtools", never]]>
>(
  persist(
    devtools(
      (set, get, store) =>
        ({
          count: 0,
          reset: () => set({ count: 0 }, false, "reset"),
          clearPersistStorage: () => store.persist.clearStorage()
        })
    ),
    { name: "temp" }
  )
)
let bearState = useStore()
//  ^?
```

But now all you have to annotate is your state...

```typescript
import create, { GetState, SetState } from "zustand"
import { devtools, persist, StoreApiWithDevtools, StoreApiWithPersist } from "zustand/middleware"

interface BearState {
  count: number,
  reset: () => void,
  clearPersistStorage: () => void
}

let useStore = create<BearState>()(
  persist(
    devtools(
      (set, get, store) =>
        ({
          count: 0,
          reset: () => set({ count: 0 }, false, "reset"),
          clearPersistStorage: () => store.persist.clearStorage()
        })
    ),
    { name: "temp" }
  )
)
let bearState = useStore()
//  ^?
```

Middlewares in zustand can and do mutate the store, which makes it almost impossible to type them correctly and make the inference work. But nonetheless @devanshj pulled it off in [#725](https://github.com/pmndrs/zustand/pull/725), if you're curious how it works you can read [#710](https://github.com/pmndrs/zustand/issues/710).

### React 18

something something `useSyncExternalStore` something something

### Some other feature

whatever

## Breaking changes and migration

If you're not using the typed version (either via TypeScript or via JSDoc) then there are no breaking changes for you and hence no migration is needed either.

### `create` (from `zustand`, `zustand/vanilla`, or `zustand/react`)

#### Change

```diff
  // Pseudo diff
- create:
-   < TState
-   , TStoreSetState = StoreApi<State>["set"]
-   , TStoreGetState = StoreApi<State>["get"]
-   , TStore = StoreApi<State>
-   >
-     (f: ...) => ...
+ create:
+   { <TState>(): (f: ...) => ...
+   , <TState, TStore>(f: ...) => ...
+   }
```

#### Migration

If you're passing zero generics to `create` then there is no migration needed. Else do one of these two things...

- (Recommended) Write `create<T>()(...)` instead of `create<T, ...>(...)`
    We use currying (that doesn't do anything in the runtime) as a workaround for [microsoft/TypeScript#10571](https://github.com/microsoft/TypeScript/issues/10571)
- Write `create<T, MyStore>(...)` instead of `create<T, ...>()`.

### `StateCreator`

#### Change

```diff
  // Pseudo diff
- type StateCreator
-   < TState
-   , TStoreSetState = StoreApi<State>["set"]
-   , TStoreGetState = StoreApi<State>["get"]
-   , TStore = StoreApi<State>
-   > =
-     ...
+ type StateCreator
+   < TState
+   , TInMutators extends [StoreMutatorIdentifier, unknown][] = []
+   , TOutMutators extends [StoreMutatorIdentifier, unknown][] = []
+   , TReturn = TState
+   > =
+     ...
```

#### Migration

If you're not using `StateCreator` for authoring middlewares then you likely won't be using `StateCreator`. But in any case if you still are, then can try the following things or open an issue for help...

- Replace `StateCreator<T, ...>` with `StateCreator<T>`
- Replace `StateCreator<T, ...>` with `StateCreator<T, Mutators>` where `Mutators` that the store will have eg `StateCreator<MyState, [["zustand/devtools", never]]>`. You can learn more about how to write mutators in the updated readme.

If you're using `StateCreator` to author middlewares then please check the updated readme to see a guide on how to author a middleware.
