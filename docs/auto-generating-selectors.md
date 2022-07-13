# Auto Generating Selectors

It is recommended to use selectors when using either the properties or actions from the store.

```typescript
const bears = useBearStore((state) => state.bears)
```

However, writing these could be tedious, but you can auto-generate them

## create the following function: `createSelectors`

```typescript
import { State, StoreApi, UseBoundStore } from 'zustand'

interface Selectors<StoreType> {
  use: {
    [key in keyof StoreType]: () => StoreType[key]
  }
}

export default function createSelectors<StoreType extends State>(
  store: UseBoundStore<StoreType, StoreApi<StoreType>>
) {
  // Casting to any to allow adding a new property
  ;(store as any).use = {}

  Object.keys(store.getState()).forEach((key) => {
    const selector = (state: StoreType) => state[key as keyof StoreType]
    ;(store as any).use[key] = () => store(selector)
  })

  return store as UseBoundStore<StoreType, StoreApi<StoreType>> &
    Selectors<StoreType>
}
```

## If you have a store like this:

```typescript
interface BearState {
  bears: number
  increase: (by: number) => void
  increment: () => void
}

const useStoreBase = create<BearState>((set) => ({
  bears: 0,
  increase: (by) => set((state) => ({ bears: state.bears + by })),
  increment: () => set((state) => state.increase(1)),
}))
```

## Apply that function to your store:

```typescript
const useStore = createSelectors(useStoreBase)
```

## Now the selectors are auto generated:

```typescript
// get the property
const bears = useStore.use.bears()

// get the action
const increase = useStore.use.increment()
```

## Live Demo

for a working example of this, see the [Code Sandbox](https://codesandbox.io/s/zustand-auto-generate-selectors-9i0ob3?file=/src/store.ts:396-408)

## 3rd-party Libraries

- [auto-zustand-selectors-hook](https://github.com/Albert-Gao/auto-zustand-selectors-hook)
- [react-hooks-global-state](https://github.com/dai-shi/react-hooks-global-state)
- [zustood](https://github.com/udecode/zustood)
