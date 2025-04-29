---
title: createWithEqualityFn ⚛️
description: How to create efficient stores
nav: 25
---

`createWithEqualityFn` lets you create a React Hook with API utilities attached, just like `create`.
However, it offers a way to define a custom equality check. This allows for more granular control
over when components re-render, improving performance and responsiveness.

> [!IMPORTANT]
> In order to use `createWithEqualityFn` from `zustand/traditional` you need to install
> `use-sync-external-store` library due to `zustand/traditional` relies on `useSyncExternalStoreWithSelector`.

```js
const useSomeStore = createWithEqualityFn(stateCreatorFn, equalityFn)
```

- [Types](#types)
  - [Signature](#createwithequalityfn-signature)
- [Reference](#reference)
- [Usage](#usage)
  - [Updating state based on previous state](#updating-state-based-on-previous-state)
  - [Updating Primitives in State](#updating-primitives-in-state)
  - [Updating Objects in State](#updating-objects-in-state)
  - [Updating Arrays in State](#updating-arrays-in-state)
  - [Updating state with no store actions](#updating-state-with-no-store-actions)
  - [Subscribing to state updates](#subscribing-to-state-updates)
- [Troubleshooting](#troubleshooting)
  - [I’ve updated the state, but the screen doesn’t update](#ive-updated-the-state-but-the-screen-doesnt-update)

## Types

### Signature

```ts
createWithEqualityFn<T>()(stateCreatorFn: StateCreator<T, [], []>, equalityFn?: (a: T, b: T) => boolean): UseBoundStore<StoreApi<T>>
```

## Reference

### `createWithEqualityFn(stateCreatorFn)`

#### Parameters

- `stateCreatorFn`: A function that takes `set` function, `get` function and `store` as arguments.
  Usually, you will return an object with the methods you want to expose.
- **optional** `equalityFn`: Defaults to `Object.is`. A function that lets you skip re-renders.

#### Returns

`createWithEqualityFn` returns a React Hook with API utilities attached, just like `create`. It
lets you return data that is based on current state, using a selector function, and lets you skip
re-renders using an equality function. It should take a selector function, and an equality function
as arguments.

## Usage

### Updating state based on previous state

To update a state based on previous state we should use **updater functions**. Read more
about that [here](https://react.dev/learn/queueing-a-series-of-state-updates).

This example shows how you can support **updater functions** within **actions**.

```tsx
import { createWithEqualityFn } from 'zustand/traditional'
import { shallow } from 'zustand/vanilla/shallow'

type AgeStoreState = { age: number }

type AgeStoreActions = {
  setAge: (
    nextAge:
      | AgeStoreState['age']
      | ((currentAge: AgeStoreState['age']) => AgeStoreState['age']),
  ) => void
}

type AgeStore = AgeStoreState & AgeStoreActions

const useAgeStore = createWithEqualityFn<AgeStore>()(
  (set) => ({
    age: 42,
    setAge: (nextAge) =>
      set((state) => ({
        age: typeof nextAge === 'function' ? nextAge(state.age) : nextAge,
      })),
  }),
  shallow,
)

export default function App() {
  const age = useAgeStore((state) => state.age)
  const setAge = useAgeStore((state) => state.setAge)

  function increment() {
    setAge((currentAge) => currentAge + 1)
  }

  return (
    <>
      <h1>Your age: {age}</h1>
      <button
        type="button"
        onClick={() => {
          increment()
          increment()
          increment()
        }}
      >
        +3
      </button>
      <button
        type="button"
        onClick={() => {
          increment()
        }}
      >
        +1
      </button>
    </>
  )
}
```

### Updating Primitives in State

State can hold any kind of JavaScript value. When you want to update built-in primitive values like
numbers, strings, booleans, etc. you should directly assign new values to ensure updates are applied
correctly, and avoid unexpected behaviors.

> [!NOTE]
> By default, `set` function performs a shallow merge. If you need to completely replace
> the state with a new one, use the `replace` parameter set to `true`

```tsx
import { createWithEqualityFn } from 'zustand/traditional'
import { shallow } from 'zustand/vanilla/shallow'

type XStore = number

const useXStore = createWithEqualityFn<XStore>()(() => 0, shallow)

export default function MovingDot() {
  const x = useXStore()
  const setX = (nextX: number) => {
    useXStore.setState(nextX, true)
  }
  const position = { y: 0, x }

  return (
    <div
      onPointerMove={(e) => {
        setX(e.clientX)
      }}
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
      }}
    >
      <div
        style={{
          position: 'absolute',
          backgroundColor: 'red',
          borderRadius: '50%',
          transform: `translate(${position.x}px, ${position.y}px)`,
          left: -10,
          top: -10,
          width: 20,
          height: 20,
        }}
      />
    </div>
  )
}
```

### Updating Objects in State

Objects are **mutable** in JavaScript, but you should treat them as **immutable** when you store
them in state. Instead, when you want to update an object, you need to create a new one (or make a
copy of an existing one), and then set the state to use the new object.

By default, `set` function performs a shallow merge. For most updates where you only need to modify
specific properties, the default shallow merge is preferred as it's more efficient. To completely
replace the state with a new one, use the `replace` parameter set to `true` with caution, as it
discards any existing nested data within the state.

```tsx
import { createWithEqualityFn } from 'zustand/traditional'
import { shallow } from 'zustand/vanilla/shallow'

type PositionStoreState = { position: { x: number; y: number } }

type PositionStoreActions = {
  setPosition: (nextPosition: PositionStoreState['position']) => void
}

type PositionStore = PositionStoreState & PositionStoreActions

const usePositionStore = createWithEqualityFn<PositionStore>()(
  (set) => ({
    position: { x: 0, y: 0 },
    setPosition: (position) => set({ position }),
  }),
  shallow,
)

export default function MovingDot() {
  const position = usePositionStore((state) => state.position)
  const setPosition = usePositionStore((state) => state.setPosition)

  return (
    <div
      onPointerMove={(e) => {
        setPosition({
          x: e.clientX,
          y: e.clientY,
        })
      }}
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
      }}
    >
      <div
        style={{
          position: 'absolute',
          backgroundColor: 'red',
          borderRadius: '50%',
          transform: `translate(${position.x}px, ${position.y}px)`,
          left: -10,
          top: -10,
          width: 20,
          height: 20,
        }}
      />
    </div>
  )
}
```

### Updating Arrays in State

Arrays are mutable in JavaScript, but you should treat them as immutable when you store them in
state. Just like with objects, when you want to update an array stored in state, you need to create
a new one (or make a copy of an existing one), and then set state to use the new array.

By default, `set` function performs a shallow merge. To update array values we should assign new
values to ensure updates are applied correctly, and avoid unexpected behaviors. To completely
replace the state with a new one, use the `replace` parameter set to `true`.

> [!IMPORTANT]
> We should prefer immutable operations like: `[...array]`, `concat(...)`, `filter(...)`,
> `slice(...)`, `map(...)`, `toSpliced(...)`, `toSorted(...)`, and `toReversed(...)`, and avoid
> mutable operations like `array[arrayIndex] = ...`, `push(...)`, `unshift(...)`, `pop(...)`,
> `shift(...)`, `splice(...)`, `reverse(...)`, and `sort(...)`.

```tsx
import { createWithEqualityFn } from 'zustand/traditional'
import { shallow } from 'zustand/vanilla/shallow'

type PositionStore = [number, number]

const usePositionStore = createWithEqualityFn<PositionStore>()(
  () => [0, 0],
  shallow,
)

export default function MovingDot() {
  const [x, y] = usePositionStore()
  const position = { x, y }
  const setPosition: typeof usePositionStore.setState = (nextPosition) => {
    usePositionStore.setState(nextPosition, true)
  }

  return (
    <div
      onPointerMove={(e) => {
        setPosition([e.clientX, e.clientY])
      }}
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
      }}
    >
      <div
        style={{
          position: 'absolute',
          backgroundColor: 'red',
          borderRadius: '50%',
          transform: `translate(${position.x}px, ${position.y}px)`,
          left: -10,
          top: -10,
          width: 20,
          height: 20,
        }}
      />
    </div>
  )
}
```

### Updating state with no store actions

Defining actions at module level, external to the store have a few advantages like: it doesn't
require a hook to call an action, and it facilitates code splitting.

> [!NOTE]
> The recommended way is to colocate actions and states within the store (let your actions be
> located together with your state).

```tsx
import { createWithEqualityFn } from 'zustand/traditional'
import { shallow } from 'zustand/vanilla/shallow'

const usePositionStore = createWithEqualityFn<{
  x: number
  y: number
}>()(() => ({ x: 0, y: 0 }), shallow)

const setPosition: typeof usePositionStore.setState = (nextPosition) => {
  usePositionStore.setState(nextPosition)
}

export default function MovingDot() {
  const position = usePositionStore()

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
      }}
    >
      <div
        style={{
          position: 'absolute',
          backgroundColor: 'red',
          borderRadius: '50%',
          transform: `translate(${position.x}px, ${position.y}px)`,
          left: -10,
          top: -10,
          width: 20,
          height: 20,
        }}
        onMouseEnter={(event) => {
          const parent = event.currentTarget.parentElement
          const parentWidth = parent.clientWidth
          const parentHeight = parent.clientHeight

          setPosition({
            x: Math.ceil(Math.random() * parentWidth),
            y: Math.ceil(Math.random() * parentHeight),
          })
        }}
      />
    </div>
  )
}
```

### Subscribing to state updates

By subscribing to state updates, you register a callback that fires whenever the store's state
updates. We can use `subscribe` for external state management.

```tsx
import { useEffect } from 'react'
import { createWithEqualityFn } from 'zustand/traditional'
import { shallow } from 'zustand/vanilla/shallow'

type PositionStoreState = { position: { x: number; y: number } }

type PositionStoreActions = {
  setPosition: (nextPosition: PositionStoreState['position']) => void
}

type PositionStore = PositionStoreState & PositionStoreActions

const usePositionStore = createWithEqualityFn<PositionStore>()(
  (set) => ({
    position: { x: 0, y: 0 },
    setPosition: (nextPosition) => set({ position: nextPosition }),
  }),
  shallow,
)

export default function MovingDot() {
  const position = usePositionStore((state) => state.position)
  const setPosition = usePositionStore((state) => state.setPosition)

  useEffect(() => {
    const unsubscribePositionStore = usePositionStore.subscribe(
      ({ position }) => {
        console.log('new position', { position })
      },
    )

    return () => {
      unsubscribePositionStore()
    }
  }, [])

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
      }}
    >
      <div
        style={{
          position: 'absolute',
          backgroundColor: 'red',
          borderRadius: '50%',
          transform: `translate(${position.x}px, ${position.y}px)`,
          left: -10,
          top: -10,
          width: 20,
          height: 20,
        }}
        onMouseEnter={(event) => {
          const parent = event.currentTarget.parentElement
          const parentWidth = parent.clientWidth
          const parentHeight = parent.clientHeight

          setPosition({
            x: Math.ceil(Math.random() * parentWidth),
            y: Math.ceil(Math.random() * parentHeight),
          })
        }}
      />
    </div>
  )
}
```

## Troubleshooting

### I’ve updated the state, but the screen doesn’t update

In the previous example, the `position` object is always created fresh from the current cursor
position. But often, you will want to include existing data as a part of the new object you’re
creating. For example, you may want to update only one field in a form, but keep the previous
values for all other fields.

These input fields don’t work because the `onChange` handlers mutate the state:

```tsx
import { createWithEqualityFn } from 'zustand/traditional'
import { shallow } from 'zustand/vanilla/shallow'

type PersonStoreState = {
  person: { firstName: string; lastName: string; email: string }
}

type PersonStoreActions = {
  setPerson: (nextPerson: PersonStoreState['person']) => void
}

type PersonStore = PersonStoreState & PersonStoreActions

const usePersonStore = createWithEqualityFn<PersonStore>()(
  (set) => ({
    person: {
      firstName: 'Barbara',
      lastName: 'Hepworth',
      email: 'bhepworth@sculpture.com',
    },
    setPerson: (person) => set({ person }),
  }),
  shallow,
)

export default function Form() {
  const person = usePersonStore((state) => state.person)
  const setPerson = usePersonStore((state) => state.setPerson)

  function handleFirstNameChange(e: ChangeEvent<HTMLInputElement>) {
    person.firstName = e.target.value
  }

  function handleLastNameChange(e: ChangeEvent<HTMLInputElement>) {
    person.lastName = e.target.value
  }

  function handleEmailChange(e: ChangeEvent<HTMLInputElement>) {
    person.email = e.target.value
  }

  return (
    <>
      <label style={{ display: 'block' }}>
        First name:
        <input value={person.firstName} onChange={handleFirstNameChange} />
      </label>
      <label style={{ display: 'block' }}>
        Last name:
        <input value={person.lastName} onChange={handleLastNameChange} />
      </label>
      <label style={{ display: 'block' }}>
        Email:
        <input value={person.email} onChange={handleEmailChange} />
      </label>
      <p>
        {person.firstName} {person.lastName} ({person.email})
      </p>
    </>
  )
}
```

For example, this line mutates the state from a past render:

```tsx
person.firstName = e.target.value
```

The reliable way to get the behavior you’re looking for is to create a new object and pass it to
`setPerson`. But here you want to also copy the existing data into it because only one of the
fields has changed:

```ts
setPerson({ ...person, firstName: e.target.value }) // New first name from the input
```

> [!NOTE]
> We don’t need to copy every property separately due to `set` function performing shallow merge by
> default.

Now the form works!

Notice how you didn’t declare a separate state variable for each input field. For large forms,
keeping all data grouped in an object is very convenient—as long as you update it correctly!

```tsx {32,36,40}
import { type ChangeEvent } from 'react'
import { createWithEqualityFn } from 'zustand/traditional'
import { shallow } from 'zustand/vanilla/shallow'

type PersonStoreState = {
  person: { firstName: string; lastName: string; email: string }
}

type PersonStoreActions = {
  setPerson: (nextPerson: PersonStoreState['person']) => void
}

type PersonStore = PersonStoreState & PersonStoreActions

const usePersonStore = createWithEqualityFn<PersonStore>()(
  (set) => ({
    person: {
      firstName: 'Barbara',
      lastName: 'Hepworth',
      email: 'bhepworth@sculpture.com',
    },
    setPerson: (nextPerson) => set({ person: nextPerson }),
  }),
  shallow,
)

export default function Form() {
  const person = usePersonStore((state) => state.person)
  const setPerson = usePersonStore((state) => state.setPerson)

  function handleFirstNameChange(e: ChangeEvent<HTMLInputElement>) {
    setPerson({ ...person, firstName: e.target.value })
  }

  function handleLastNameChange(e: ChangeEvent<HTMLInputElement>) {
    setPerson({ ...person, lastName: e.target.value })
  }

  function handleEmailChange(e: ChangeEvent<HTMLInputElement>) {
    setPerson({ ...person, email: e.target.value })
  }

  return (
    <>
      <label style={{ display: 'block' }}>
        First name:
        <input value={person.firstName} onChange={handleFirstNameChange} />
      </label>
      <label style={{ display: 'block' }}>
        Last name:
        <input value={person.lastName} onChange={handleLastNameChange} />
      </label>
      <label style={{ display: 'block' }}>
        Email:
        <input value={person.email} onChange={handleEmailChange} />
      </label>
      <p>
        {person.firstName} {person.lastName} ({person.email})
      </p>
    </>
  )
}
```
