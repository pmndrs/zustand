---
title: Persisting store data
nav: 17
---

The Persist middleware enables you to store
your Zustand state in a storage
(e.g., `localStorage`, `AsyncStorage`, `IndexedDB`, etc.),
thus persisting its data.

Note that this middleware supports both
synchronous storages, like `localStorage`,
and asynchronous storages, like `AsyncStorage`,
but using an asynchronous storage does come with a cost.
See [Hydration and asynchronous storages](#hydration-and-asynchronous-storages)
for more details.

## Simple example

```ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export const useBearStore = create(
  persist(
    (set, get) => ({
      bears: 0,
      addABear: () => set({ bears: get().bears + 1 }),
    }),
    {
      name: 'food-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => sessionStorage), // (optional) by default, 'localStorage' is used
    },
  ),
)
```

## Options

### `name`

This is the only required option.
The given name is going to be the key
used to store your Zustand state in the storage,
so it must be unique.

### `storage`

> Type: `() => StateStorage`

The `StateStorage` can be imported with:

```ts
import { StateStorage } from 'zustand/middleware'
```

> Default: `createJSONStorage(() => localStorage)`

Enables you to use your own storage. Simply pass a function that returns the storage you want to use. It's recommended to use the [`createJSONStorage`](#createjsonstorage) helper function to create a `storage` object that is compliant with the `StateStorage` interface.

Example:

```ts
import { persist, createJSONStorage } from 'zustand/middleware'

export const useBoundStore = create(
  persist(
    (set, get) => ({
      // ...
    }),
    {
      // ...
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
)
```

### `partialize`

> Type: `(state: Object) => Object`

> Default: `(state) => state`

Enables you to pick some of the state's fields to be stored in the storage.

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
          Object.entries(state).filter(([key]) => !['foo'].includes(key)),
        ),
    },
  ),
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
    },
  ),
)
```

### `onRehydrateStorage`

> Type: `(state: Object) => ((state?: Object, error?: Error) => void) | void`

This option enables you to pass a listener function
that will be called when the storage is hydrated.

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
    },
  ),
)
```

### `version`

> Type: `number`

> Default: `0`

If you want to introduce a breaking change in your storage
(e.g. renaming a field), you can specify a new version number.
By default, if the version in the storage
does not match the version in the code,
the stored value won't be used.
You can use the [migrate](#migrate) function (see below)
to handle breaking changes in order to persist previously stored data.

### `migrate`

> Type: `(persistedState: Object, version: number) => Object | Promise<Object>`

> Default: `(persistedState) => persistedState`

You can use this option to handle versions migration.
The migrate function takes the persisted state
and the version number as arguments.
It must return a state that is compliant
to the latest version (the version in the code).

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
    },
  ),
)
```

### `merge`

> Type: `(persistedState: Object, currentState: Object) => Object`

> Default: `(persistedState, currentState) => ({ ...currentState, ...persistedState })`

In some cases, you might want to use a custom merge function
to merge the persisted value with the current state.

By default, the middleware does a shallow merge.
The shallow merge might not be enough
if you have partially persisted nested objects.
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
    },
  ),
)
```

### `skipHydration`

> Type: `boolean | undefined`

> Default: `undefined`

By default the store will be hydrated on initialization.

In some applications you may need to control when the first hydration occurs.
For example, in server-rendered apps.

If you set `skipHydration`, the initial call for hydration isn't called,
and it is left up to you to manually call `rehydrate()`.

```ts
export const useBoundStore = create(
  persist(
    () => ({
      count: 0,
      // ...
    }),
    {
      // ...
      skipHydration: true,
    },
  ),
)
```

```tsx
import { useBoundStore } from './path-to-store';

export function StoreConsumer() {
  // hydrate persisted store after on mount
  useEffect(() => {
    useBoundStore.persist.rehydrate();
  }, [])

  return (
    //...
  )
}
```

## API

> Version: >=3.6.3

The Persist API enables you to do a number of interactions
with the Persist middleware
from inside or outside of a React component.

### `getOptions`

> Type: `() => Partial<PersistOptions>`

> Returns: Options of the Persist middleware

For example, it can be used to obtain the storage name:

```ts
useBoundStore.persist.getOptions().name
```

### `setOptions`

> Type: `(newOptions: Partial<PersistOptions>) => void`

Changes the middleware options.
Note that the new options will be merged with the current ones.

For instance, this can be used to change the storage name:

```ts
useBoundStore.persist.setOptions({
  name: 'new-name',
})
```

Or even to change the storage engine:

```ts
useBoundStore.persist.setOptions({
  storage: createJSONStorage(() => sessionStorage),
})
```

### `clearStorage`

> Type: `() => void`

Clears everything stored under the [name](#name) key.

```ts
useBoundStore.persist.clearStorage()
```

### `rehydrate`

> Type: `() => Promise<void>`

In some cases, you might want to trigger the rehydration manually.
This can be done by calling the `rehydrate` method.

```ts
await useBoundStore.persist.rehydrate()
```

### `hasHydrated`

> Type: `() => boolean`

This is a non-reactive getter to check
if the storage has been hydrated
(note that it updates when calling [`rehydrate`](#rehydrate)).

```ts
useBoundStore.persist.hasHydrated()
```

### `onHydrate`

> Type: `(listener: (state) => void) => () => void`

> Returns: Unsubscribe function

This listener will be called when the hydration process starts.

```ts
const unsub = useBoundStore.persist.onHydrate((state) => {
  console.log('hydration starts')
})

// later on...
unsub()
```

### `onFinishHydration`

> Type: `(listener: (state) => void) => () => void`

> Returns: Unsubscribe function

This listener will be called when the hydration process ends.

```ts
const unsub = useBoundStore.persist.onFinishHydration((state) => {
  console.log('hydration finished')
})

// later on...
unsub()
```

### `createJSONStorage`

> Type: `(getStorage: () => StateStorage, options?: JsonStorageOptions) => StateStorage`

> Returns: `PersistStorage`

This helper function enables you to create a [`storage`](#storage) object which is useful when you want to use a custom storage engine.

`getStorage` is a function that returns the storage engine with the properties `getItem`, `setItem`, and `removeItem`.

`options` is an optional object that can be used to customize the serialization and deserialization of the data. `options.reviver` is a function that is passed to `JSON.parse` to deserialize the data. `options.replacer` is a function that is passed to `JSON.stringify` to serialize the data.

```ts
import { createJSONStorage } from 'zustand/middleware'

const storage = createJSONStorage(() => sessionStorage, {
  reviver: (key, value) => {
    if (value && value.type === 'date') {
      return new Date(value)
    }
    return value
  },
  replacer: (key, value) => {
    if (value instanceof Date) {
      return { type: 'date', value: value.toISOString() }
    }
    return value
  },
})
```

## Hydration and asynchronous storages

To explain what is the "cost" of asynchronous storages,
you need to understand what is hydration.

In a nutshell, hydration is a process
of retrieving persisted state from the storage
and merging it with the current state.

The Persist middleware does two kinds of hydration:
synchronous and asynchronous.
If the given storage is synchronous (e.g., `localStorage`),
hydration will be done synchronously.
On the other hand, if the given storage is asynchronous (e.g., `AsyncStorage`),
hydration will be done asynchronously (shocking, I know!).

But what's the catch?
With synchronous hydration,
the Zustand store will already have been hydrated at its creation.
In contrast, with asynchronous hydration,
the Zustand store will be hydrated later on, in a microtask.

Why does it matter?
Asynchronous hydration can cause some unexpected behaviors.
For instance, if you use Zustand in a React app,
the store will **not** be hydrated at the initial render.
In cases where your app depends on the persisted value at page load,
you might want to wait until
the store has been hydrated before showing anything.
For example, your app might think the user
is not logged in because it's the default,
but in reality the store has not been hydrated yet.

If your app does depends on the persisted state at page load,
see [_How can I check if my store has been hydrated_](#how-can-i-check-if-my-store-has-been-hydrated)
in the [FAQ](#faq) section below.

### Usage in Next.js

NextJS uses Server Side Rendering, and it will compare the rendered component on the server with the one rendered on client.
But since you are using data from browser to change your component, the two renders will differ and Next will throw a warning at you.

The errors usually are:

- Text content does not match server-rendered HTML
- Hydration failed because the initial UI does not match what was rendered on the server
- There was an error while hydrating. Because the error happened outside of a Suspense boundary, the entire root will switch to client rendering

To solve these errors, create a custom hook so that Zustand waits a little before changing your components.

Create a file with the following:

```ts
// useStore.ts
import { useState, useEffect } from 'react'

const useStore = <T, F>(
  store: (callback: (state: T) => unknown) => unknown,
  callback: (state: T) => F,
) => {
  const result = store(callback) as F
  const [data, setData] = useState<F>()

  useEffect(() => {
    setData(result)
  }, [result])

  return data
}

export default useStore
```

Now in your pages, you will use the hook a little bit differently:

```ts
// useBearStore.ts

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// the store itself does not need any change
export const useBearStore = create(
  persist(
    (set, get) => ({
      bears: 0,
      addABear: () => set({ bears: get().bears + 1 }),
    }),
    {
      name: 'food-storage',
    },
  ),
)
```

```ts
// yourComponent.tsx

import useStore from './useStore'
import { useBearStore } from './stores/useBearStore'

const bears = useStore(useBearStore, (state) => state.bears)
```

Credits: [This reply to an issue](https://github.com/pmndrs/zustand/issues/938#issuecomment-1481801942), which points to [this blog post](https://dev.to/abdulsamad/how-to-use-zustands-persist-middleware-in-nextjs-4lb5).

## FAQ

### How can I check if my store has been hydrated

There are a few different ways to do this.

You can use the [`onRehydrateStorage`](#onrehydratestorage)
listener function to update a field in the store:

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
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    // Note: This is just in case you want to take into account manual rehydration.
    // You can remove the following line if you don't need it.
    const unsubHydrate = useBoundStore.persist.onHydrate(() => setHydrated(false))

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

### How can I use a custom storage engine

If the storage you want to use does not match the expected API, you can create your own storage:

```ts
import { create } from 'zustand'
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware'
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
      bears: 0,
      addABear: () => set({ bears: get().bears + 1 }),
    }),
    {
      name: 'food-storage', // unique name
      storage: createJSONStorage(() => storage),
    },
  ),
)
```

If you're using a type that `JSON.stringify()` doesn't support, you'll need to write your own serialization/deserialization code. However, if this is tedious, you can use third-party libraries to serialize and deserialize different types of data.

For example, [Superjson](https://github.com/blitz-js/superjson) can serialize data along with its type, allowing the data to be parsed back to its original type upon deserialization

```ts
import superjson from 'superjson' //  can use anything: serialize-javascript, devalue, etc.
import { PersistStorage } from 'zustand/middleware'

interface BearState {
  bear: Map<string, string>
  fish: Set<string>
  time: Date
  query: RegExp
}

const storage: PersistStorage<BearState> = {
  getItem: (name) => {
    const str = localStorage.getItem(name)
    if (!str) return null
    return superjson.parse(str)
  },
  setItem: (name, value) => {
    localStorage.setItem(name, superjson.stringify(value))
  },
  removeItem: (name) => localStorage.removeItem(name),
}

const initialState: BearState = {
  bear: new Map(),
  fish: new Set(),
  time: new Date(),
  query: new RegExp(''),
}

export const useBearStore = create<BearState>()(
  persist(
    (set) => ({
      ...initialState,
      // ...
    }),
    {
      name: 'food-storage',
      storage,
    },
  ),
)
```

### How can I rehydrate on storage event

You can use the Persist API to create your own implementation,
similar to the example below:

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

### How do I use it with TypeScript

Basic typescript usage doesn't require anything special
except for writing `create<State>()(...)` instead of `create(...)`.

```tsx
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface MyState {
  bears: number
  addABear: () => void
}

export const useBearStore = create<MyState>()(
  persist(
    (set, get) => ({
      bears: 0,
      addABear: () => set({ bears: get().bears + 1 }),
    }),
    {
      name: 'food-storage', // name of item in the storage (must be unique)
      storage: createJSONStorage(() => sessionStorage), // (optional) by default the 'localStorage' is used
      partialize: (state) => ({ bears: state.bears }),
    },
  ),
)
```

### How do I use it with Map and Set

In order to persist object types such as `Map` and `Set`, they will need to be converted to JSON-serializable types such as an `Array` which can be done by defining a custom `storage` engine.

Let's say your state uses `Map` to handle a list of `transactions`,
then you can convert the `Map` into an `Array` in the `storage` prop which is shown below:

```ts

interface BearState {
  .
  .
  .
  transactions: Map<any>
}

  storage: {
    getItem: (name) => {
      const str = localStorage.getItem(name);
      if (!str) return null;
      const { state } = JSON.parse(str);
      return {
        state: {
          ...state,
          transactions: new Map(state.transactions),
        },
      }
    },
    setItem: (name, newValue: StorageValue<BearState>) => {
      // functions cannot be JSON encoded
      const str = JSON.stringify({
        state: {
          ...newValue.state,
          transactions: Array.from(newValue.state.transactions.entries()),
        },
      })
      localStorage.setItem(name, str)
    },
    removeItem: (name) => localStorage.removeItem(name),
  },
```
