---
title: redux
description: How to use actions and reducers in a store
nav: 208
---

# redux

`redux` middleware lets you update a store through actions and reducers just like redux.

```js
const nextStateCreatorFn = redux(reducerFn, initialState)
```

- [Types](#types)
  - [Signature](#signature)
  - [Mutator](#mutator)
- [Reference](#reference)
- [Usage](#usage)
  - [Updating state through actions and reducers](#updating-state-through-actions-and-reducers)
- [Troubleshooting](#troubleshooting)

## Types

### Signature

```ts
redux<T, A>(reducerFn: (state: T, action: A) => T, initialState: T): StateCreator<T & { dispatch: (action: A) => A }, [['zustand/redux', A]], []>
```

### Mutator

<!-- prettier-ignore-start -->
```ts
['zustand/redux', A]
```
<!-- prettier-ignore-end -->

## Reference

### `redux(reducerFn, initialState)`

#### Parameters

- `reducerFn`: It should be pure and should take the current state of your application and an action
  object as arguments, and returns the new state resulting from applying the action.
- `initialState`: The value you want the state to be initially. It can be a value of any type,
  except a function.

#### Returns

`redux` returns a state creator function.

## Usage

### Updating state through actions and reducers

```ts
import { createStore } from 'zustand/vanilla'
import { redux } from 'zustand/middleware'

type PersonStoreState = {
  firstName: string
  lastName: string
  email: string
}

type PersonStoreAction =
  | { type: 'person/setFirstName'; firstName: string }
  | { type: 'person/setLastName'; lastName: string }
  | { type: 'person/setEmail'; email: string }

type PersonStore = PersonStoreState & {
  dispatch: (action: PersonStoreAction) => PersonStoreAction
}

const personStoreReducer = (
  state: PersonStoreState,
  action: PersonStoreAction,
) => {
  switch (action.type) {
    case 'person/setFirstName': {
      return { ...state, firstName: action.firstName }
    }
    case 'person/setLastName': {
      return { ...state, lastName: action.lastName }
    }
    case 'person/setEmail': {
      return { ...state, email: action.email }
    }
    default: {
      return state
    }
  }
}

const personStoreInitialState: PersonStoreState = {
  firstName: 'Barbara',
  lastName: 'Hepworth',
  email: 'bhepworth@sculpture.com',
}

const personStore = createStore<PersonStore>()(
  redux(personStoreReducer, personStoreInitialState),
)

const $firstNameInput = document.getElementById(
  'first-name',
) as HTMLInputElement
const $lastNameInput = document.getElementById('last-name') as HTMLInputElement
const $emailInput = document.getElementById('email') as HTMLInputElement
const $result = document.getElementById('result') as HTMLDivElement

function handleFirstNameChange(event: Event) {
  personStore.dispatch({
    type: 'person/setFirstName',
    firstName: (event.target as any).value,
  })
}

function handleLastNameChange(event: Event) {
  personStore.dispatch({
    type: 'person/setLastName',
    lastName: (event.target as any).value,
  })
}

function handleEmailChange(event: Event) {
  personStore.dispatch({
    type: 'person/setEmail',
    email: (event.target as any).value,
  })
}

$firstNameInput.addEventListener('input', handleFirstNameChange)
$lastNameInput.addEventListener('input', handleLastNameChange)
$emailInput.addEventListener('input', handleEmailChange)

const render: Parameters<typeof personStore.subscribe>[0] = (person) => {
  $firstNameInput.value = person.firstName
  $lastNameInput.value = person.lastName
  $emailInput.value = person.email

  $result.innerHTML = `${person.firstName} ${person.lastName} (${person.email})`
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

## Troubleshooting

TBD
