---
title: How to Migrate to v5 from v4
nav: 23
---

# How to Migrate to v5 from v4

We highly recommend to update to the latest version of v4, before migrating to v5. It will show all deprecation warnings without breaking your app.

## Changes in v5

- Drop default exports
- Drop deprecated features
- Make React 18 the minimum required version
- Make use-sync-external-store a peer dependency (required for `createWithEqualityFn` and `useStoreWithEqualityFn` in `zustand/traditional`)
- Make TypeScript 4.5 the minimum required version
- Drop UMD/SystemJS support
- Organize entry points in the package.json
- Drop ES5 support
- Stricter types when setState's replace flag is set
- Persist middleware behavioral change
- Other small improvements (technically breaking changes)

## Migration Guide

### Using custom equality functions such as `shallow`

The `create` function in v5 does not support customizing equality function.

If you use custom equality function such as `shallow`,
the easiest migration is to use `createWithEqualityFn`.

```js
// v4
import { create } from 'zustand'
import { shallow } from 'zustand/shallow'

const useCountStore = create((set) => ({
  count: 0,
  text: 'hello',
  // ...
}))

const Component = () => {
  const { count, text } = useCountStore(
    (state) => ({
      count: state.count,
      text: state.text,
    }),
    shallow,
  )
  // ...
}
```

That can be done with `createWithEqualityFn` in v5:

```bash
npm install use-sync-external-store
```

```js
// v5
import { createWithEqualityFn as create } from 'zustand/traditional'

// The rest is the same as v4
```

Alternatively, for the `shallow` use case, you can use `useShallow` hook:

```js
// v5
import { create } from 'zustand'
import { useShallow } from 'zustand/shallow'

const useCountStore = create((set) => ({
  count: 0,
  text: 'hello',
  // ...
}))

const Component = () => {
  const { count, text } = useCountStore(
    useShallow((state) => ({
      count: state.count,
      text: state.text,
    })),
  )
  // ...
}
```

### Requiring stable selector outputs

There is a behavioral change in v5 to match React default behavior.
If a selector returns a new reference, it may cause infinite loops.

For example, this may cause infinite loops.

```js
// v4
const [searchValue, setSearchValue] = useStore((state) => [
  state.searchValue,
  state.setSearchValue,
])
```

The error message will be something like this:

```plaintext
Uncaught Error: Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate. React limits the number of nested updates to prevent infinite loops.
```

To fix it, use the `useShallow` hook, which will return a stable reference.

```js
// v5
import { useShallow } from 'zustand/shallow'

const [searchValue, setSearchValue] = useStore(
  useShallow((state) => [state.searchValue, state.setSearchValue]),
)
```

Here's another example that may cause infinite loops.

```js
// v4
const action = useMainStore((state) => {
  return state.action ?? () => {}
})
```

To fix it, make sure the selector function returns a stable reference.

```js
// v5

const FALLBACK_ACTION = () => {}

const action = useMainStore((state) => {
  return state.action ?? FALLBACK_ACTION
})
```

Alternatively, if you need v4 behavior, `createWithEqualityFn` will do.

```js
// v5
import { createWithEqualityFn as create } from 'zustand/traditional'
```

### Stricter types when setState's replace flag is set (Typescript only)

```diff
- setState:
-   (partial: T | Partial<T> | ((state: T) => T | Partial<T>), replace?: boolean | undefined) => void;
+ setState:
+   (partial: T | Partial<T> | ((state: T) => T | Partial<T>), replace?: false) => void;
+   (state: T | ((state: T) => T), replace: true) => void;
```

If you are not using the `replace` flag, no migration is required.

If you are using the `replace` flag and it's set to `true`, you must provide a complete state object.
This change ensures that `store.setState({}, true)` (which results in an invalid state) is no longer considered valid.

**Examples:**

```ts
// Partial state update (valid)
store.setState({ key: 'value' })

// Complete state replacement (valid)
store.setState({ key: 'value' }, true)

// Incomplete state replacement (invalid)
store.setState({}, true) // Error
```

#### Handling Dynamic `replace` Flag

If the value of the `replace` flag is dynamic and determined at runtime, you might face issues. To handle this, you can use a workaround by annotating the `replace` parameter with the parameters of the `setState` function:

```ts
const replaceFlag = Math.random() > 0.5
const args = [{ bears: 5 }, replaceFlag] as Parameters<
  typeof useBearStore.setState
>
store.setState(...args)
```

#### Persist middleware no longer stores item at store creation

Previously, the `persist` middleware stored the initial state during store creation. This behavior has been removed in v5 (and v4.5.5).

For example, in the following code, the initial state is stored in the storage.

```js
// v4
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useCountStore = create(
  persist(
    () => ({
      count: Math.floor(Math.random() * 1000),
    }),
    {
      name: 'count',
    },
  ),
)
```

In v5, this is no longer the case, and you need to explicitly set the state after store creation.

```js
// v5
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useCountStore = create(
  persist(
    () => ({
      count: 0,
    }),
    {
      name: 'count',
    },
  ),
)
useCountStore.setState({
  count: Math.floor(Math.random() * 1000),
})
```

## Links

- https://github.com/pmndrs/zustand/pull/2138
- https://github.com/pmndrs/zustand/pull/2580
