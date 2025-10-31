---
title: Beginner TypeScript Guide
nav: 7
---

Zustand is a lightweight state manager, particularly used with React. Zustand avoids reducers, context, and boilerplate.
Paired with TypeScript, you get a strongly typed store-state, actions, and selectors-with autocomplete and compile-time safety.

In this basic guide we’ll cover:

- Creating a typed store (state + actions)
- Using the store in React components with type safety
- Resetting the store safely with types
- Extracting and reusing Store type (for props, tests, and utilities)
- Composing multiple selectors and building derived state (with type inference and without extra re-renders)
- Middlewares with TypeScript support (`combine`, `devtools`, `persist`)
- Async actions with typed API responses
- Working with `createWithEqualityFn` (enhanced `create` store function)
- Structuring and coordinating multiple stores

### Creating a Store with State & Actions

Here we describe state and actions using an Typescript interface. The `<BearState>` generic forces the store to match this shape.
This means if you forget a field or use the wrong type, TypeScript will complain. Unlike plain JS, this guarantees type-safe state management.
The `create` function uses the curried form, which results in a store of type `UseBoundStore<StoreApi<BearState>>`.

```ts
// store.ts
import { create } from 'zustand'

// Define types for state & actions
interface BearState {
  bears: number
  food: string
  feed: (food: string) => void
}

// Create store using the curried form of `create`
export const useBearStore = create<BearState>()((set) => ({
  bears: 2,
  food: 'honey',
  feed: (food) => set(() => ({ food })),
}))
```

### Using the Store in Components

Inside components, you can read state and call actions. Selectors `(s) => s.bears` subscribe to only what you need.
This reduces re-renders and improves performance. JS can do this too, but with TS your IDE autocompletes state fields.

```tsx
import { useBearStore } from './store'

function BearCounter() {
  // Select only 'bears' to avoid unnecessary re-renders
  const bears = useBearStore((s) => s.bears)
  return <h1>{bears} bears around</h1>
}
```

### Resetting the Store

Resetting is useful after logout or “clear session”. We use `typeof initialState` to avoid repeating property types.
TypeScript updates automatically if `initialState` changes. This is safer and cleaner compared to JS.

```tsx
import { create } from 'zustand'

const initialState = { bears: 0, food: 'honey' }

// Reuse state type dynamically
type BearState = typeof initialState & {
  increase: (by: number) => void
  reset: () => void
}

const useBearStore = create<BearState>()((set) => ({
  ...initialState,
  increase: (by) => set((s) => ({ bears: s.bears + by })),
  reset: () => set(initialState),
}))

function ResetZoo() {
  const { bears, increase, reset } = useBearStore()

  return (
    <div>
      <div>{bears}</div>
      <button onClick={() => increase(5)}>Increase by 5</button>
      <button onClick={reset}>Reset</button>
    </div>
  )
}
```

### Extracting Types

Zustand provides a built-in helper called `ExtractState`. This is useful for tests, utility functions, or component props.
It returns the full type of your store’s state and actions without having to manually redefine them. Extracting the Store type:

```ts
// store.ts
import { create, type ExtractState } from 'zustand'

export const useBearStore = create((set) => ({
  bears: 3,
  food: 'honey',
  increase: (by: number) => set((s) => ({ bears: s.bears + by })),
}))

// Extract the type of the whole store state
export type BearState = ExtractState<typeof useBearStore>
```

Using extracted type in tests:

```ts
// test.cy.ts
import { BearState } from './store.ts'

test('should reset store', () => {
  const snapshot: BearState = useBearStore.getState()
  expect(snapshot.bears).toBeGreaterThanOrEqual(0)
})
```

and in utility function:

```ts
// util.ts
import { BearState } from './store.ts'

function logBearState(state: BearState) {
  console.log(`We have ${state.bears} bears eating ${state.food}`)
}

logBearState(useBearStore.getState())
```

### Selectors

#### Multiple Selectors

Sometimes you need more than one property. Returning an object from the selector lets you access multiple fields at once.
However, directly destructuring properties from that object can cause unnecessary re-renders.
To avoid this, it’s recommended to wrap the selector with `useShallow`, which prevents re-renders when the selected values remain shallowly equal.
This is more efficient than subscribing to the whole store. TypeScript ensures you can’t accidentally misspell `bears` or `food`.
See the [API documentation](https://zustand.docs.pmnd.rs/hooks/use-shallow) for more details on `useShallow`.

```tsx
import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'

// Bear store with explicit types
interface BearState {
  bears: number
  food: number
}

const useBearStore = create<BearState>()(() => ({
  bears: 2,
  food: 10,
}))

// In components, you can use both stores safely
function MultipleSelectors() {
  const { bears, food } = useBearStore(
    useShallow((state) => ({ bears: state.bears, food: state.food })),
  )

  return (
    <div>
      We have {food} units of food for {bears} bears
    </div>
  )
}
```

#### Derived State with Selectors

Not all values need to be stored directly - some can be computed from existing state. You can derive values using selectors.
This avoids duplication and keeps the store minimal. TypeScript ensures `bears` is a number, so math is safe.

```tsx
import { create } from 'zustand'

interface BearState {
  bears: number
  foodPerBear: number
}

const useBearStore = create<BearState>()(() => ({
  bears: 3,
  foodPerBear: 2,
}))

function TotalFood() {
  // Derived value: required amount food for all bears
  const totalFood = useBearStore((s) => s.bears * s.foodPerBear) // don't need to have extra property `{ totalFood: 6 }` in your Store

  return <div>We need ${totalFood} jars of honey</div>
}
```

### Middlewares

#### `combine` middleware

This middleware separates initial state and actions, making the code cleaner.
TS automatically infers types from the state and actions, no interface needed.
This is different from JS, where type safety is missing. It’s a very popular style in TypeScript projects.
See the [API documentation](https://zustand.docs.pmnd.rs/middlewares/combine) for more details.

```ts
import { create } from 'zustand'
import { combine } from 'zustand/middleware'

interface BearState {
  bears: number
  increase: () => void
}

// State + actions are separated
export const useBearStore = create<BearState>()(
  combine({ bears: 0 }, (set) => ({
    increase: () => set((s) => ({ bears: s.bears + 1 })),
  })),
)
```

#### `devtools` middleware

This middleware connects Zustand to Redux DevTools. You can inspect changes, time-travel, and debug state.
It’s extremely useful in development. TS ensures your actions and state remain type-checked even here.
See the [API documentation](https://zustand.docs.pmnd.rs/middlewares/devtools) for more details.

```ts
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface BearState {
  bears: number
  increase: () => void
}

export const useBearStore = create<BearState>()(
  devtools((set) => ({
    bears: 0,
    increase: () => set((s) => ({ bears: s.bears + 1 })),
  })),
)
```

#### `persist` middleware

This middleware keeps your store in `localStorage` (or another storage). This means your bears survive a page refresh.
Great for apps where persistence matters. In TS, the state type stays consistent, so no runtime surprises.
See the [API documentation](https://zustand.docs.pmnd.rs/middlewares/persist) for more details.

```ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface BearState {
  bears: number
  increase: () => void
}

export const useBearStore = create<BearState>()(
  persist(
    (set) => ({
      bears: 0,
      increase: () => set((s) => ({ bears: s.bears + 1 })), // <-- тип явно
    }),
    { name: 'bear-storage' }, // localStorage key
  ),
)
```

### Async Actions

Actions can be async to fetch remote data. Here we fetch bears count and update state.
TS enforces correct API response type (`BearData`). In JS you might misspell `count` - TS prevents that.

```ts
import { create } from 'zustand'

interface BearData {
  count: number
}

interface BearState {
  bears: number
  fetchBears: () => Promise<void>
}

export const useBearStore = create<BearState>()((set) => ({
  bears: 0,
  fetchBears: async () => {
    const res = await fetch('/api/bears')
    const data: BearData = await res.json()

    set({ bears: data.count })
  },
}))
```

### `createWithEqualityFn`

Variant of `create` with equality built-in. Useful if you always want custom equality checks.
Not common, but shows Zustand’s flexibility. TS still keeps full type inference.
See the [API documentation](https://zustand.docs.pmnd.rs/apis/create-with-equality-fn) for more details.

```ts
import { createWithEqualityFn } from 'zustand/traditional'
import { shallow } from 'zustand/shallow'

const useBearStore = createWithEqualityFn(() => ({
  bears: 0,
}))

const bears = useBearStore((s) => s.bears, Object.is)
// or
const bears = useBearStore((s) => ({ bears: s.bears }), shallow)
```

### Multiple Stores

You can create more than one store for different domains. For example, `BearStore` manages bears and `FishStore` manages fish.
This keeps state isolated and easier to maintain in larger apps. With TypeScript, each store has its own strict type - you can’t accidentally mix bears and fish.

```tsx
import { create } from 'zustand'

// Bear store with explicit types
interface BearState {
  bears: number
  addBear: () => void
}

const useBearStore = create<BearState>()((set) => ({
  bears: 2,
  addBear: () => set((s) => ({ bears: s.bears + 1 })),
}))

// Fish store with explicit types
interface FishState {
  fish: number
  addFish: () => void
}

const useFishStore = create<FishState>()((set) => ({
  fish: 5,
  addFish: () => set((s) => ({ fish: s.fish + 1 })),
}))

// In components, you can use both stores safely
function Zoo() {
  const { bears, addBear } = useBearStore()
  const { fish, addFish } = useFishStore()

  return (
    <div>
      <div>
        {bears} bears and {fish} fish
      </div>
      <button onClick={addBear}>Add bear</button>
      <button onClick={addFish}>Add fish</button>
    </div>
  )
}
```

### Conclusion

Zustand together with TypeScript provides a balance: you keep the simplicity of small, minimalistic stores, while gaining the safety of strong typing.
You don’t need boilerplate or complex patterns - state and actions live side by side, fully typed, and ready to use.
Start with a basic store to learn the pattern, then expand gradually: use `combine` for cleaner inference, `persist` for storage, and `devtools` for debugging.
