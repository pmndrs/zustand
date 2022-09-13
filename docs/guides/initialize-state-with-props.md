---
title: initialize-state-with-props
# nav: N
---

In cases that model [dependency injection](), such as when a store should be initialized with props from a component, the recommended approach is to use a vanilla store with React.context.

> **Note**: *Because the store returned by* `create` *is a hook, passing it to a context provider may violate the* [Rules of Hooks](https://reactjs.org/docs/hooks-rules.html).

## Store creator with `createStore`

```ts
import { createStore } from 'zustand';

interface BearProps {
  bears: number;
}

interface BearState extends BearProps {
  addBear: () => void;
}

type BearStore = ReturnType<typeof createBearStore>;

const createBearStore = (initProps?: Partial<BearProps>) => {
  const DEFAULT_PROPS: BearProps = {
    bears: 0,
  };
  return createStore<BearState>()((set) => ({
    ...DEFAULT_PROPS,
    ...initProps,
    addBear: () => set((state) => ({ bears: ++state.bears })),
  }));
};
```

## Basic component usage

```tsx
// Provider implementation
import { useRef } from 'react';

function App() {
  const store = useRef(createBearStore()).current;
  return (
    <BearContext.Provider value={store}>
      <BasicConsumer />
    </BearContext.Provider>
  );
}
```
```tsx
// Consumer component
import { useContext } from 'react';
import { useStore } from 'zustand';

function BasicConsumer() {
  const store = useContext(BearContext);
  if (!store) throw new Error('Missing BearContext.Provider in the tree');
  const bears = useStore(store, (s) => s.bears);
  const addBear = useStore(store, (s) => s.addBear);
  return (
    <>
      <div>{bears} Bears.</div>
      <button onClick={addBear}>Add bear</button>
    </>
  );
}
```

## Common patterns

### Wrapping the context provider
```tsx
// Provider Wraper
import { useRef } from 'react';

type BearProviderProps = React.PropsWithChildren<BearProps>;

function BearProvider({ children, ...props }: BearProviderProps) {
  const storeRef = useRef<BearStore>();
  if (!storeRef.current) {
    storeRef.current = createBearStore(props);
  }
  return <BearContext.Provider value={storeRef.current} children={children} />;
}
```
### Extracting context logic into custom hook
```tsx
// Mimic the hook returned by `create`
import { useContext } from 'react';
import { useStore } from 'zustand';

function useBearContext<T>(
  selector: (state: BearState) => T,
  equalityFn?: (left: T, right: T) => boolean
): T {
  const store = useContext(BearContext);
  if (!store) throw new Error('Missing BearContext.Provider in the tree');
  return useStore(store, selector, equalityFn);
}
```
```tsx
// Consumer usage with hook
function CommonConsumer() {
  const bears = useBearContext((s) => s.bears);
  const addBear = useBearContext((s) => s.addBear);
  return (
    <>
      <div>{bears} Bears.</div>
      <button onClick={addBear}>Add bear</button>
    </>
  );
}
```
### Complete example
```tsx
// Provider Wrapper usage with Hook
function App2() {
  return (
    <BearProvider bears={2}>
      <HookConsumer />
    </BearProvider>
  );
}
```
