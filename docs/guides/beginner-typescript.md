---
title: TypeScript beginner guide
nav: 7
---

Zustand is a lightweight state manager, particularly used with React. Zustand avoids reducers, context, and boilerplate.
Paired with TypeScript, you get a strongly typed store-state, actions, and selectors-with autocomplete and compile-time safety.

In this basic guide we’ll cover:

- Creating a typed store (state + actions)
- Using the store in React components with type safety
- Structuring and coordinating multiple stores
- Resetting the store safely with types
- Extracting and reusing Store type (for props, tests, and utilities)
- Composing multiple selectors and building derived state (with type inference and without extra re-renders)
- Middlewares with TypeScript support (`persist`, `devtools`, `immer`)
- Async actions with typed API responses
- Using `useStore`, `useStoreWithEqualityFn` and `useShallow` hooks with Typescript
- Additional API (`createStore`, `createWithEqualityFn`)

### Creating a Store with State & Actions

Here we describe state and actions using an Typescript interface. The `<BearState>` generic forces the store to match this shape.
This means if you forget a field or use the wrong type, TypeScript will complain. Unlike plain JS, this guarantees type-safe state management.

```ts
import { create } from 'zustand'

// Define types for state & actions
interface BearState {
  bears: number
  food: string
  increase: (by: number) => void
  feed: (food: string) => void
}

// Create store with explicit generic <BearState>
export const useBearStore = create<BearState>((set) => ({
  bears: 2,
  food: 'honey',
  increase: (by) => set((state) => ({ bears: state.bears + by })),
  feed: (food) => set(() => ({ food })),
}))
```

`create` also supports a curried version. It's useful when you want to fix the state type first and initialize later (for example, inside a factory).

```ts
import { create } from 'zustand'

// Define types for state & actions
interface BearState {
  bears: number
  food: string
  increase: (by: number) => void
  feed: (food: string) => void
}

// Fix the type with create<BearState>()
const createBearStore = create<BearState>()

// Initialize the store separately
export const useBearStore = createBearStore((set) => ({
  bears: 2,
  food: 'honey',
  increase: (by) => set((state) => ({ bears: state.bears + by })),
  feed: (food) => set(() => ({ food })),
}))
```

Both forms are functionally identical. They produce the same store type `UseBoundStore<StoreApi<BearState>>`.
The curried form is just syntactic sugar for scenarios where you want more flexibility in how and when you define your initializer.

### Using the Store in Components

Inside components, you can read state and call actions. Selectors `(s) => s.bears` subscribe to only what you need.
This reduces re-renders and improves performance. JS can do this too, but with TS your IDE autocompletes state fields.

```ts
import { useBearStore } from './store'

function BearCounter() {
  // Select only "bears" to avoid unnecessary re-renders
  const bears = useBearStore((s) => s.bears)
  return <h1>{bears} bears around</h1>
}

function BearFeeder() {
  // Destructure multiple fields if needed
  const { food, feed } = useBearStore()
  return (
    <button onClick={() => feed("berries")}>
		Feed bears {food}
		</button>
	)
}
```

### Multiple Stores

You can create more than one store for different domains. For example, `BearStore` manages bears and `FishStore` manages fish.  
This keeps state isolated and easier to maintain in larger apps. With TypeScript, each store has its own strict type - you can’t accidentally mix bears and fish.

```ts
import { create } from 'zustand'

// Bear store with explicit types
interface BearState {
  bears: number
  addBear: () => void
}

export const useBearStore = create<BearState>((set) => ({
  bears: 2,
  addBear: () => set((s) => ({ bears: s.bears + 1 })),
}))

// Fish store with explicit types
interface FishState {
  fish: number
  addFish: () => void
}

export const useFishStore = create<FishState>((set) => ({
  fish: 5,
  addFish: () => set((s) => ({ fish: s.fish + 1 })),
}))

// In components you can use both stores safely
function Zoo() {
  const bears = useBearStore((s) => s.bears)
  const fish = useFishStore((s) => s.fish)

  return <div>{bears} bears and {fish} fish</div>
}
```

### Resetting the Store

Resetting is useful after logout or “clear session”. We use `typeof initialState` to avoid repeating property types.
TypeScript updates automatically if `initialState` changes. This is safer and cleaner compared to JS.

```ts
import { create } from 'zustand'

const initialState = { bears: 0, food: 'honey' }

// Reuse state type dynamically
type BearState = typeof initialState & {
  increase: (by: number) => void
  reset: () => void
}

export const useBearStore = create<BearState>((set) => ({
  ...initialState,
  increase: (by) => set((s) => ({ bears: s.bears + by })),
  reset: () => set(initialState),
}))
```

### Extracting Types

With TS you can extract store types automatically. This is great for tests, utility functions, or component props.

There are two main ways:

- TypeScript ReturnType: built-in, extracts the return type of a function.
- Zustand ExtractState: a convenience helper that does the same thing but reads more clearly in a Zustand context.

Both produce the same result. Zustand just added `ExtractState` because `ReturnType<typeof store.getState>` looked a bit “too TypeScript-heavy”.

```ts
import { ExtractState } from 'zustand'

type BearState = ExtractState<typeof useBearStore>
// or
type BearSnapshot = ReturnType<typeof useBearStore.getState>
```

Extracting the Store type:

```ts
// store.ts
import { create, ExtractState } from 'zustand'

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

Sometimes you need more than one property. Returning an object from the selector gives you both.
This is more efficient than subscribing to the whole store. TypeScript ensures you can’t accidentally misspell `bears` or `food`.

```ts
import { useBearStore } from './store'

const { bears, food } = useBearStore((s) => ({
  bears: s.bears,
  food: s.food,
}))
```

#### Derived State with Selectors

Not all values need to be stored directly - some can be computed from existing state. You can derive values using selectors.
This avoids duplication and keeps the store minimal. TypeScript ensures `bears` is a number, so math is safe.

```ts
interface BearState {
  bears: number
  foodPerBear: number
}

export const useBearStore = create<BearState>(() => ({
  bears: 3,
  foodPerBear: 2,
}))

// Derived value: required amount food for all bears
const totalFood = useBearStore((s) => s.bears * s.foodPerBear) // don't need to have extra property `{ totalFood: 6 }` in your Store

// Usage
console.log(`We need ${totalFood} jars of honey`)
```

### Middlewares

#### `combine` middleware

This middleware separates initial state and actions, making the code cleaner.
TS automatically infers types from the state and actions, no interface needed.
This is different from JS, where type safety is missing. It’s a very popular style in TypeScript projects.

```ts
import { create } from 'zustand'
import { combine } from 'zustand/middleware'

// State + actions are separated
export const useBearStore = create(
  combine({ bears: 0 as number, food: 'honey' as string }, (set) => ({
    increase: () => set((s) => ({ bears: s.bears + 1 })),
    reset: () => set({ bears: 0, food: 'honey' }),
  })),
)
```

#### `devtools` middleware

This middleware connects Zustand to Redux DevTools. You can inspect changes, time-travel, and debug state.
It’s extremely useful in development. TS ensures your actions and state remain type-checked even here.

```ts
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface BearState {
  bears: number
  increase: () => void
}

const bearCreator: StateCreator<BearState> = (set) => ({
  bears: 0,
  increase: () => set((s) => ({ bears: s.bears + 1 })),
})

const bearStoreCreator = devtools(bearCreator)

export const useBearStore = create<BearState>()(bearStoreCreator)
```

#### `persist` middleware

This middleware keeps your store in `localStorage` (or another storage). This means your bears survive a page refresh.
Great for apps where persistence matters. In TS, the state type stays consistent, so no runtime surprises.

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

export const useBearStore = create<BearState>((set) => ({
  bears: 0,
  fetchBears: async () => {
    const res = await fetch('/api/bears')
    const data: BearData = await res.json()

    set({ bears: data.count })
  },
}))
```

### Hooks

#### `useStore`

It works with `createStore` for explicit store instances. This is useful in tests or non-React contexts.
With TS you get proper type inference for `bearStore`. In JS, you’d have no guarantee what shape the store has.

```ts
import { createStore, useStore } from 'zustand'

interface BearState {
  bears: number
}

const bearStore = createStore<BearState>(() => ({ bears: 1 }))

function Zoo() {
  const bears = useStore(bearStore, (s) => s.bears)
  return <div>{bears} bears</div>
}
```

#### `useStoreWithEqualityFn`

This adds a custom equality check for selectors. It’s useful if you select nested objects or want deep comparison.
TS ensures your selector matches store state. For most apps it’s optional, but good to know.

```ts
import { useStoreWithEqualityFn } from 'zustand/traditional'

const bears = useStoreWithEqualityFn(useBearStore, (s) => s.bears, Object.is)
```

#### `useShallow`

By default, Zustand compares selected state with **shallow equality** only when you select a single field.  
If you return an object with multiple fields, Zustand compares by reference, which can cause unnecessary re-renders.  
The `useShallow` helper fixes this by doing a shallow equality check on objects or arrays.

```ts
import { create } from "zustand"
import { useShallow } from "zustand/react/shallow"

interface BearState {
  bears: number
  location: string
  increase: () => void
}

const useBearStore = create<BearState>((set) => ({
  bears: 5,
  location: "forest",
  increase: () => set((s) => ({ bears: s.bears + 1 })),
}))

function BearAmount() {
  const { bears } = useBearStore(
    useShallow((s) => ({ bears: s.bears })) // With useShallow: re-renders only if "bears" changes
  )

  console.log("BearAmount rendered") // helps to see re-renders

  return <p>There are {bears} bears!</p>
}

function App() {
  const increase = useBearStore((s) => s.increase)

  return (
    <>
      <BearAmount />
    <button onClick={increase}>Increase bears</button>
  <button onClick={() => useBearStore.setState({ location: "mountains" })}>
  Change location
  </button>
  </>
)
}
```

### Additional API

#### `createStore (non-React use)`

Used for logic outside React (e.g., Node.js). TS guarantees store shape even without React.
Rare in apps, but handy for testing.

```ts
import { createStore } from 'zustand'

const store = createStore(() => ({ bears: 1 }))
```

#### `createWithEqualityFn`

Variant of `create` with equality built-in. Useful if you always want custom equality checks.
Not common, but shows Zustand’s flexibility. TS still keeps full type inference.

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

### Conclusion

Zustand together with TypeScript provides a balance: you keep the simplicity of small, minimalistic stores, while gaining the safety of strong typing.
You don’t need boilerplate or complex patterns - state and actions live side by side, fully typed, and ready to use.
Start with a basic store to learn the pattern, then expand gradually: use `combine` for cleaner inference, `persist` for storage, and `devtools` for debugging.
