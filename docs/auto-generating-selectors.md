# Auto Generating Selectors

It is recommended to use selectors when using either the properties or actions from the store.

```javascript
const bears = useBearStore((state) => state.bears)
```

However, writing these could be tedious, but you can auto-generate them

## create the following function: `createSelectors`

```typescript
import create, { StateCreator, State, StoreApi, UseStore } from 'zustand'

interface Selectors<StoreType> {
  use: {
    [key in keyof StoreType]: () => StoreType[key]
  }
}

function createSelectors<StoreType extends State>(store: UseStore<StoreType>) {
  ;(store as any).use = {}

  Object.keys(store.getState()).forEach((key) => {
    const selector = (state: StoreType) => state[key as keyof StoreType]
    ;(store as any).use[key] = () => store(selector)
  })

  return store as UseStore<StoreType> & Selectors<StoreType>
}
```

## If you have a store like this:

```typescript
interface BearState {
  bears: number
  increase: (by: number) => void
}

const useStoreBase = create<BearState>((set) => ({
  bears: 0,
  increase: (by) => set((state) => ({ bears: state.bears + by })),
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
const increase = useStore.use.increase()
```

## Libraries

- Or you can just `npm i auto-zustand-selectors-hook`
- [auto-zustand-selectors-hook](https://github.com/Albert-Gao/auto-zustand-selectors-hook)
- [zustood](https://github.com/udecode/zustood)
