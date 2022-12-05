---
title: Persist middleware
nav: 17
---

The persist middleware enables you to store your Zustand state in a storage (e.g. `localStorage`, `AsyncStorage`, `IndexedDB`, etc...) thus persisting it's data.

Note that this middleware does support both synchronous storages (e.g. `localStorage`) and asynchronous storages (e.g. `AsyncStorage`), but using an asynchronous storage does come with a cost.
See [Hydration and asynchronous storages](#hydration-and-asynchronous-storages) for more details.

Quick example:

```ts
import create from 'zustand'
import { persist } from 'zustand/middleware'

export const useFishStore = create(
  persist(
    (set, get) => ({
      fishes: 0,
      addAFish: () => set({ fishes: get().fishes + 1 }),
    }),
    {
      name: 'food-storage', // name of item in the storage (must be unique)
      getStorage: () => sessionStorage, // (optional) by default the 'localStorage' is used
    }
  )
)
```

## Options

### `name`

This is the only required option.
The given name is going to be the key used to store your Zustand state in the storage, so it must be unique.

### `getStorage`

> Default: `() => localStorage`

Enables you to use your own storage.
Simply pass a function that returns the storage you want to use.

Example:

```ts
export const useBoundStore = create(
  persist(
    (set, get) => ({
      // ...
    }),
    {
      // ...
      getStorage: () => AsyncStorage,
    }
  )
)
```

The given storage must match the following interface:

```ts
interface Storage {
  getItem: (name: string) => string | null | Promise<string | null>
  setItem: (name: string, value: string) => void | Promise<void>
  removeItem: (name: string) => void | Promise<void>
}
```

### `serialize`

> Schema: `(state: Object) => string | Promise<string>`

> Default: `(state) => JSON.stringify(state)`

Since the only way to store an object in a storage is via a string, you can use this option to give a custom function to serialize your state to a string.

For example, if you want to store your state in base64:

```ts
export const useBoundStore = create(
  persist(
    (set, get) => ({
      // ...
    }),
    {
      // ...
      serialize: (state) => btoa(JSON.stringify(state)),
    }
  )
)
```

Note that you would also need a custom `deserialize` function to make this work properly. See below.

### `deserialize`

> Schema: `(str: string) => Object | Promise<Object>`

> Default: `(str) => JSON.parse(str)`

If you pass a custom serialize function, you will most likely need to pass a custom deserialize function as well.

To continue the example above, you could deserialize the base64 value using the following:

```ts
export const useBoundStore = create(
  persist(
    (set, get) => ({
      // ...
    }),
    {
      // ...
      deserialize: (str) => JSON.parse(atob(str)),
    }
  )
)
```

### `partialize`

> Schema: `(state: Object) => Object`

> Default: `(state) => state`

Enables you to omit some of the state's fields to be stored in the storage.

You could omit multiple fields using the following:

```ts
export const useBoundStore = create(
  persist(
    (set, get) => ({
      foo: 0,
      bar: 1,
    }),
    {
      // ...
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(([key]) => !['foo'].includes(key))
        ),
    }
  )
)
```

Or you could allow only specific fields using the following:

```ts
export const useBoundStore = create(
  persist(
    (set, get) => ({
      foo: 0,
      bar: 1,
    }),
    {
      // ...
      partialize: (state) => ({ foo: state.foo }),
    }
  )
)
```

### `onRehydrateStorage`

> Schema: `(state: Object) => ((state?: Object, error?: Error) => void) | void`

This option enables you to pass a listener function that will be called when the storage is hydrated.

Example:

```ts
export const useBoundStore = create(
  persist(
    (set, get) => ({
      // ...
    }),
    {
      // ...
      onRehydrateStorage: (state) => {
        console.log('hydration starts')

        // optional
        return (state, error) => {
          if (error) {
            console.log('an error happened during hydration', error)
          } else {
            console.log('hydration finished')
          }
        }
      },
    }
  )
)
```

### `version`

> Schema: `number`

> Default: `0`

If you want to introduce a breaking change in your storage (e.g. renaming a field), you can specify a new version number.
By default, if the version in the storage does not match the version in the code, the stored value won't be used.
You can use the `migrate` option to handle breaking changes in order to persist previously stored data.

### `migrate`

> Schema: `(persistedState: Object, version: number) => Object | Promise<Object>`

> Default: `(persistedState) => persistedState`

You can use this option to handle versions migration.
The migrate function takes the persisted state and the version number as arguments. It must return a state that is compliant to the latest version (the version in the code).

For instance, if you want to rename a field, you can use the following:

```ts
export const useBoundStore = create(
  persist(
    (set, get) => ({
      newField: 0, // let's say this field was named otherwise in version 0
    }),
    {
      // ...
      version: 1, // a migration will be triggered if the version in the storage mismatches this one
      migrate: (persistedState, version) => {
        if (version === 0) {
          // if the stored value is in version 0, we rename the field to the new name
          persistedState.newField = persistedState.oldField
          delete persistedState.oldField
        }

        return persistedState
      },
    }
  )
)
```

### `merge`

> Schema: `(persistedState: Object, currentState: Object) => Object`

> Default: `(persistedState, currentState) => ({ ...currentState, ...persistedState })`

In some cases, you might want to use a custom merge function to merge the persisted value with the current state.

By default, the middleware does a shallow merge.
The shallow merge might not be enough if you have partially persisted nested objects.
For instance, if the storage contains the following:

```ts
{
  foo: {
    bar: 0,
  }
}
```

But your Zustand store contains:

```ts
{
  foo: {
    bar: 0,
    baz: 1,
  }
}
```

The shallow merge will erase the `baz` field from the `foo` object.
One way to fix this would be to give a custom deep merge function:

```ts
export const useBoundStore = create(
  persist(
    (set, get) => ({
      foo: {
        bar: 0,
        baz: 1,
      },
    }),
    {
      // ...
      merge: (persistedState, currentState) =>
        deepMerge(currentState, persistedState),
    }
  )
)
```

## API

> Version: >=3.6.3

The persist api enables you to do numbers of interactions with the persist middleware from inside or outside a React component.

### `getOptions`

> Schema: `() => Partial<PersistOptions>`

This method can you get the options of the middleware.

For example, it can be used to obtain the storage name:

```ts
useBoundStore.persist.getOptions().name
```

### `setOptions`

> Schema: `(newOptions: PersistOptions) => void`

This method enables you to change the middleware options. Note that the new options will be merged with the current ones.

For instance, this can be used to change the storage name:

```ts
useBoundStore.persist.setOptions({
  name: 'new-name',
})
```

Or even to change the storage engine:

```ts
useBoundStore.persist.setOptions({
  getStorage: () => sessionStorage,
})
```

### `clearStorage`

> Schema: `() => void`

This can be used to fully clear the persisted value in the storage.

```ts
useBoundStore.persist.clearStorage()
```

### `rehydrate`

> Schema: `() => Promise<void>`

In some cases, you might want to trigger a rehydration manually.
This can be done by calling the `rehydrate` method.

```ts
await useBoundStore.persist.rehydrate()
```

### `hasHydrated`

> Schema: `() => boolean`

This is a non-reactive getter to know if the storage has been hydrated (note that this does update when calling `useBoundStore.persist.rehydrate()`).

```ts
useBoundStore.persist.hasHydrated()
```

### `onHydrate`

> Schema: `(listener: (state) => void) => () => void`

The given listener will be called when the hydration process starts.

```ts
const unsub = useBoundStore.persist.onHydrate((state) => {
  console.log('hydration starts')
})

// later on...
unsub()
```

### `onFinishHydration`

> Schema: `(listener: (state) => void) => () => void`

The given listener will be called when the hydration process ends.

```ts
const unsub = useBoundStore.persist.onFinishHydration((state) => {
  console.log('hydration finished')
})

// later on...
unsub()
```

## Hydration and asynchronous storages

To explain what's the "cost" of asynchronous storages, you need to understand what's hydration.
In a nutshell, hydration is the process of retrieving the persisted state from the storage and merging it with the current state.

The persist middleware does two kinds of hydration: synchronous and asynchronous.
If the given storage is synchronous (e.g. `localStorage`), hydration will be done synchronously. On the other hand, if the given storage is asynchronous (e.g. `AsyncStorage`), hydration will be done ... 🥁 asynchronously.

But what's the catch?
With synchronous hydration, the Zustand store will have been hydrated at its creation.
While with asynchronous hydration, the Zustand store will be hydrated later on, in a microtask.

Why does it matter?
Asynchronous hydration can cause some unexpected behaviors.
For instance, if you use Zustand in a React app, the store will _not_ be hydrated at the initial render. In cases where you app depends on the persisted value at page load, you might want to wait until the store has been hydrated before showing anything (e.g. your app might think the user is not logged in because it's the default, while in reality the store has not been hydrated yet).

If your app does depends on the persisted state at page load, see **_How can I check if my store has been hydrated?_** in the Q/A section.

## Q/A

### How can I check if my store has been hydrated?

There's a few different ways to do this.

You can use the `onRehydrateStorage` option to update a field in the store:

```ts
const useBoundStore = create(
  persist(
    (set, get) => ({
      // ...
      _hasHydrated: false,
      setHasHydrated: (state) => {
        set({
          _hasHydrated: state
        });
      }
    }),
    {
      // ...
      onRehydrateStorage: () => (state) => {
        state.setHasHydrated(true)
      }
    }
  )
);

export default function App() {
  const hasHydrated = useBoundStore(state => state._hasHydrated);

  if (!hasHydrated) {
    return <p>Loading...</p>
  }

  return (
    // ...
  );
}
```

You can also create a custom `useHydration` hook:

```ts
const useBoundStore = create(persist(...))

const useHydration = () => {
  const [hydrated, setHydrated] = useState(useBoundStore.persist.hasHydrated)

  useEffect(() => {
    const unsubHydrate = useBoundStore.persist.onHydrate(() => setHydrated(false)) // Note: this is just in case you want to take into account manual rehydrations. You can remove this if you don't need it/don't want it.
    const unsubFinishHydration = useBoundStore.persist.onFinishHydration(() => setHydrated(true))

    setHydrated(useBoundStore.persist.hasHydrated())

    return () => {
      unsubHydrate()
      unsubFinishHydration()
    }
  }, [])

  return hydrated
}
```

### How can I use a custom storage engine?

If the storage you want to use does not match the expected API, you can create your own storage:

```ts
import create from 'zustand'
import { persist, StateStorage } from 'zustand/middleware'
import { get, set, del } from 'idb-keyval' // can use anything: IndexedDB, Ionic Storage, etc.

// Custom storage object
const storage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    console.log(name, 'has been retrieved')
    return (await get(name)) || null
  },
  setItem: async (name: string, value: string): Promise<void> => {
    console.log(name, 'with value', value, 'has been saved')
    await set(name, value)
  },
  removeItem: async (name: string): Promise<void> => {
    console.log(name, 'has been deleted')
    await del(name)
  },
}

export const useBoundStore = create(
  persist(
    (set, get) => ({
      fishes: 0,
      addAFish: () => set({ fishes: get().fishes + 1 }),
    }),
    {
      name: 'food-storage', // unique name
      getStorage: () => storage,
    }
  )
)
```

### How can I rehydrate on storage event?

You can use the `persist` api to create your own implementation, similar to what we see below

```ts

type StoreWithPersist = Mutate<StoreApi<State>, [["zustand/persist", unknown]]>

export const withStorageDOMEvents = (store: StoreWithPersist) => {
  const storageEventCallback = (e: StorageEvent) => {
    if (e.key === store.persist.getOptions().name && e.newValue) {
      store.persist.rehydrate()
    }
  }

  window.addEventListener('storage', storageEventCallback)

  return () => {
    window.removeEventListener('storage', storageEventCallback)
  }
}

const useBoundStore = create(persist(...))
withStorageDOMEvents(useBoundStore)
```

### How do I use with TypeScript?

Basic typescript usage doesn't require anything special except for writing `create<State>()(...)` instead of `create(...)`.

```tsx
import create from 'zustand'
import { persist } from 'zustand/middleware'

interface MyState {
  fishes: number
  addAFish: () => void
}

export const useFishStore = create<MyState>()(
  persist(
    (set, get) => ({
      fishes: 0,
      addAFish: () => set({ fishes: get().fishes + 1 }),
    }),
    {
      name: 'food-storage', // name of item in the storage (must be unique)
      getStorage: () => sessionStorage, // (optional) by default the 'localStorage' is used
      partialize: (state) => ({ fishes: state.fishes }),
    }
  )
)
```
