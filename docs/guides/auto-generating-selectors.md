---
title: Auto Generating Selectors
nav: 7
---

It is recommended to use selectors when using either the properties or actions from the store.

```typescript
const bears = useBearStore((state) => state.bears)
```

However, writing these could be tedious, but you can auto-generate them

## create the following function: `createSelectors`

```typescript
import { State, StoreApi, UseBoundStore } from 'zustand'

type WithSelectors<S> = S extends { getState: () => infer T }
  ? S & { use: { [K in keyof T]: () => T[K] } }
  : never

const createSelectors = <S extends UseBoundStore<StoreApi<State>>>(
  _store: S
) => {
  let store = _store as WithSelectors<typeof _store>
  store.use = {}
  for (let k of Object.keys(store.getState())) {
    ;(store.use as any)[k] = () => store((s) => s[k as keyof typeof s])
  }

  return store
}
```

## If you have a store like this:

```typescript
interface BearState {
  bears: number
  increase: (by: number) => void
  increment: () => void
}

const useBearStoreBase = create<BearState>()((set) => ({
  bears: 0,
  increase: (by) => set((state) => ({ bears: state.bears + by })),
  increment: () => set((state) => ({ bears: state.bears + 1 })),
}))
```

## Apply that function to your store:

```typescript
const useBearStore = createSelectors(useBearStoreBase)
```

## Now the selectors are auto generated:

```typescript
// get the property
const bears = useBearStore.use.bears()

// get the action
const increase = useBearStore.use.increment()
```

## Live Demo

for a working example of this, see the [Code Sandbox](https://codesandbox.io/s/zustand-auto-generate-selectors-9i0ob3?file=/src/store.ts:396-408)

## 3rd-party Libraries

- [auto-zustand-selectors-hook](https://github.com/Albert-Gao/auto-zustand-selectors-hook)
- [react-hooks-global-state](https://github.com/dai-shi/react-hooks-global-state)
- [zustood](https://github.com/udecode/zustood)
