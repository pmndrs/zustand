---
title: immer
description: How to perform immutable updates in a store without boilerplate code
nav: 31
---

# immer

`immer` middleware lets you perform immutable updates.

> [!IMPORTANT]
> In order to use `immer` from `zustand/middleware/immer` you need to install
> `immer` library.

```js
const nextStateCreatorFn = immer(stateCreatorFn)
```

- [Types](#types)
  - [Signature](#signature)
  - [Mutator](#mutator)
- [Reference](#reference)
- [Usage](#usage)
- [Troubleshooting](#troubleshooting)

## Types

### Signature

```ts
immer<T>(stateCreatorFn: StateCreator<T, [], []>): StateCreator<T, [['zustand/immer', never]], []>
```

### Mutator

```ts
;['zustand/immer', never]
```

## Reference

### `immer(stateCreatorFn)`

#### Parameters

- `stateCreatorFn`: A function that takes `set` function, `get` function and `store` as arguments.
  Usually, you will return an object with the methods you want to expose.

#### Returns

`immer` returns a state creator function.

## Usage

### Updating state without boilerplate code

In the next example, we're going to update the `person` object. Since it's a nested object, we need
to create a copy of the entire object before making the update.

```ts
import { createStore } from 'zustand/vanilla'

type PersonStoreState = {
  person: { firstName: string; lastName: string; email: string }
}

type PersonStoreActions = {
  setPerson: (
    nextPerson: (
      person: PersonStoreState['person'],
    ) => PersonStoreState['person'] | PersonStoreState['person'],
  ) => void
}

type PersonStore = PersonStoreState & PersonStoreActions

const personStore = createStore<PersonStore>()((set) => ({
  person: {
    firstName: 'Barbara',
    lastName: 'Hepworth',
    email: 'bhepworth@sculpture.com',
  },
  setPerson: (nextPerson) =>
    set((state) => ({
      person:
        typeof nextPerson === 'function'
          ? nextPerson(state.person)
          : nextPerson,
    })),
}))

const $firstNameInput = document.getElementById(
  'first-name',
) as HTMLInputElement
const $lastNameInput = document.getElementById('last-name') as HTMLInputElement
const $emailInput = document.getElementById('email') as HTMLInputElement
const $result = document.getElementById('result') as HTMLDivElement

function handleFirstNameChange(event: Event) {
  personStore.getState().setPerson((person) => ({
    ...person,
    firstName: (event.target as any).value,
  }))
}

function handleLastNameChange(event: Event) {
  personStore.getState().setPerson((person) => ({
    ...person,
    lastName: (event.target as any).value,
  }))
}

function handleEmailChange(event: Event) {
  personStore.getState().setPerson((person) => ({
    ...person,
    email: (event.target as any).value,
  }))
}

$firstNameInput.addEventListener('input', handleFirstNameChange)
$lastNameInput.addEventListener('input', handleLastNameChange)
$emailInput.addEventListener('input', handleEmailChange)

const render: Parameters<typeof personStore.subscribe>[0] = (state) => {
  $firstNameInput.value = state.person.firstName
  $lastNameInput.value = state.person.lastName
  $emailInput.value = state.person.email

  $result.innerHTML = `${state.person.firstName} ${state.person.lastName} (${state.person.email})`
}

render(personStore.getInitialState(), personStore.getInitialState())

personStore.subscribe(render)
```

Here's the `html` code

```html
<label style="display: block">
  First name:
  <input id="first-name" />
</label>
<label style="display: block">
  Last name:
  <input id="last-name" />
</label>
<label style="display: block">
  Email:
  <input id="email" />
</label>
<p id="result"></p>
```

To avoid manually copying the entire object before making updates, we'll use the `immer`
middleware.

```ts
import { createStore } from 'zustand/vanilla'
import { immer } from 'zustand/middleware/immer'

type PersonStoreState = {
  person: { firstName: string; lastName: string; email: string }
}

type PersonStoreActions = {
  setPerson: (
    nextPerson: (
      person: PersonStoreState['person'],
    ) => PersonStoreState['person'] | PersonStoreState['person'],
  ) => void
}

type PersonStore = PersonStoreState & PersonStoreActions

const personStore = createStore<PersonStore>()(
  immer((set) => ({
    person: {
      firstName: 'Barbara',
      lastName: 'Hepworth',
      email: 'bhepworth@sculpture.com',
    },
    setPerson: (nextPerson) =>
      set((state) => {
        state.person =
          typeof nextPerson === 'function'
            ? nextPerson(state.person)
            : nextPerson
      }),
  })),
)

const $firstNameInput = document.getElementById(
  'first-name',
) as HTMLInputElement
const $lastNameInput = document.getElementById('last-name') as HTMLInputElement
const $emailInput = document.getElementById('email') as HTMLInputElement
const $result = document.getElementById('result') as HTMLDivElement

function handleFirstNameChange(event: Event) {
  personStore.getState().setPerson((person) => {
    person.firstName = (event.target as any).value
  })
}

function handleLastNameChange(event: Event) {
  personStore.getState().setPerson((person) => {
    person.lastName = (event.target as any).value
  })
}

function handleEmailChange(event: Event) {
  personStore.getState().setPerson((person) => {
    person.email = (event.target as any).value
  })
}

$firstNameInput.addEventListener('input', handleFirstNameChange)
$lastNameInput.addEventListener('input', handleLastNameChange)
$emailInput.addEventListener('input', handleEmailChange)

const render: Parameters<typeof personStore.subscribe>[0] = (state) => {
  $firstNameInput.value = state.person.firstName
  $lastNameInput.value = state.person.lastName
  $emailInput.value = state.person.email

  $result.innerHTML = `${state.person.firstName} ${state.person.lastName} (${state.person.email})`
}

render(personStore.getInitialState(), personStore.getInitialState())

personStore.subscribe(render)
```

## Troubleshooting

### I'm getting "An immer producer returned a new value AND modified its draft" error

This happens when you both mutate the draft and return a new value in the same updater. With the
`immer` middleware, you should either mutate the draft directly or return a new state, but not both:

```ts
// Wrong - mutates AND returns
set((state) => {
  state.count++
  return { count: state.count } // Don't do this
})

// Correct - just mutate
set((state) => {
  state.count++
})

// Also correct - just return (same as without immer)
set((state) => ({ count: state.count + 1 }))
```

### TypeScript errors when using immer with other middleware

When combining `immer` with other middleware like `devtools` or `persist`, the order matters. The
`immer` middleware should be the innermost (closest to the state creator):

```ts
// Correct order
const useStore = create<MyState>()(
  devtools(
    persist(
      immer((set) => ({
        count: 0,
        inc: () =>
          set((state) => {
            state.count++
          }),
      })),
      { name: 'my-store' },
    ),
  ),
)
```
