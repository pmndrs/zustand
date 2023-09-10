---
title: Updating state
nav: 3
---

## Flat updates

Updating state with Zustand is simple! Call the provided `set` function with
the new state, and it will be shallowly merged with the existing state in the
store. **Note** See next section for nested state.

```tsx
import { create } from 'zustand'

type State = {
  firstName: string
  lastName: string
}

type Action = {
  updateFirstName: (firstName: State['firstName']) => void
  updateLastName: (lastName: State['lastName']) => void
}

// Create your store, which includes both state and (optionally) actions
const usePersonStore = create<State & Action>((set) => ({
  firstName: '',
  lastName: '',
  updateFirstName: (firstName) => set(() => ({ firstName: firstName })),
  updateLastName: (lastName) => set(() => ({ lastName: lastName })),
}))

// In consuming app
function App() {
  // "select" the needed state and actions, in this case, the firstName value
  // and the action updateFirstName
  const firstName = usePersonStore((state) => state.firstName)
  const updateFirstName = usePersonStore((state) => state.updateFirstName)

  return (
    <main>
      <label>
        First name
        <input
          // Update the "firstName" state
          onChange={(e) => updateFirstName(e.currentTarget.value)}
          value={firstName}
        />
      </label>

      <p>
        Hello, <strong>{firstName}!</strong>
      </p>
    </main>
  )
}
```

## Deeply nested object

If you have a deep state object like this:

```ts
type State = {
  deep: {
    nested: {
      obj: { count: number }
    }
  }
}
```

Updating nested state requires some effort to ensure the process is completed
immutably.

### Normal approach

Similar to React or Redux, the normal approach is to copy each level of the
state object. This is done with the spread operator `...`, and by manually
merging that in with the new state values. Like so:

```ts
  normalInc: () =>
    set((state) => ({
      deep: {
        ...state.deep,
        nested: {
          ...state.deep.nested,
          obj: {
            ...state.deep.nested.obj,
            count: state.deep.nested.obj.count + 1
          }
        }
      }
    })),
```

This is very long! Let's explore some alternatives that will make your life
easier.

### With Immer

Many people use [Immer](https://github.com/immerjs/immer) to update nested
values. Immer can be used anytime you need to update nested state such as in
React, Redux and of course, Zustand!

You can use Immer to shorten your state updates for deeply nested object. Let's
take a look at an example:

```ts
  immerInc: () =>
    set(produce((state: State) => { ++state.deep.nested.obj.count })),
```

What a reduction! Please take note of the [gotchas listed here](../integrations/immer-middleware.md).

### With optics-ts

There is another option with [optics-ts](https://github.com/akheron/optics-ts/):

```ts
  opticsInc: () =>
    set(O.modify(O.optic<State>().path("deep.nested.obj.count"))((c) => c + 1)),
```

Unlike Immer, optics-ts doesn't use proxies or mutation syntax.

### With Ramda

You can also use [Ramda](https://ramdajs.com/):

```ts
  ramdaInc: () =>
    set(R.over(R.lensPath(["deep", "nested", "obj", "count"]), (c) => c + 1)),
```

Both ramda and optics-ts also work with types.

### CodeSandbox Demo

https://codesandbox.io/s/zustand-normal-immer-optics-ramda-updating-ynn3o?file=/src/App.tsx
