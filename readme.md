<p align="center">
  <img width="700" src="bear.png" />
</p>

    npm install zustand

Small, fast and scaleable barebones state-management solution. Has a comfy api based on hooks, isn't that boilerplatey or opinionated, but still just enough to be explicit and flux-like, breaches reconciler boundaries (React context cannot pass into react-three-fiber, react-konva, etc).

#### Create a store (or multiple, up to you...)

```jsx
import create from 'zustand'

// Name your store anything you like, but remember, it's a hook!
const [useStore] = create(set => ({
  // Everything in here is your state
  count: 1,
  // You don't have to nest your actions, but makes it easier to fetch them later on
  actions: {
    inc: () => set(state => ({ count: state.count + 1 })), // same semantics as setState
    dec: () => set(state => ({ count: state.count - 1 })),
  },
}))
```

#### Bind components

```jsx
function Counter() {
  // Will only re-render the component when "count" changes
  const count = useStore(state => state.count)
  return <h1>{count}</h1>
}

function Controls() {
  // "actions" isn't special, we just named it like that to fetch updaters easier 
  const { inc, dec } = useStore(state => state.actions)
  return (
    <>
      <button onClick={inc}>up</button>
      <button onClick={dec}>down</button>
    </>
  )
}
```

# Receipes

## Fetching everything

You can, but remember that it will cause the component to update on every state change!

```jsx
const data = useStore()
```

## Selecting multiple state slices

It's just like mapStateToProps in Redux. zustand will run a small shallow equal over the object you return. Of course, it won't cause re-renders if these properties aren't changed in the state model.

```jsx
const { name, age } = useStore(state => ({ name: state.name, age: state.age }))
```

Or, if you prefer, atomic selects do the same ...

```jsx
const name = useStore(state => state.name)
const age = useStore(state => state.age)
```

## Fetching from multiple stores

Since you can create as many stores as you like, forwarding a result into another selector is straight forward.

```jsx
const currentUser = useCredentialsStore(state => state.currentUser)
const person = usePersonStore(state => state.persons[currentUser])
```

## Memoizing selectors (this is completely optional)

You can change the selector always! But since you essentially pass a new function every render it will subscribe and unsubscribe to the store every time. It's not that much of a big deal, unless you're dealing with hundreds of connected components. But you can still memoize your selector with an optional second argument that's similar to Reacts useCallback. Give it the dependencies you are interested in and it will let your selector in peace.

```jsx
const book = useBookStore(state => state.books[title], [title])
```

## Async actions

Just call `set` when you're ready, it doesn't care if your actions are async or not.

```jsx
const [useStore] = create(set => ({
  result: '',
  fetch: async url => {
    const response = await fetch(url)
    const json = await response.json()
    set({ result: json })
  },
}))
```

## Read from state in actions

The `set` function already allows functional update `set(state => result)` but should there be cases where you need to access outside of it you have an optional `get`, too.

```jsx
const [useStore] = create((set, get) => ({
  text: "hello",
  action: () => {
    const text = get().text
    ...
  }
})
```

## Sick of reducers and changing nested state? Use Immer!

```jsx
import produce from "immer"

const [useStore] = create(set => ({
  nested: {
    structure: {
      constains: {
        a: "value"
      }
    }
  },
  action: () => set(produce(draft => {
    draft.nested.structure.contains.a.value = undefined // not anymore ...
  }))
})
```

## Reading/writing state and reacting to changes outside of components

You can use it with or without React out of the box.

```jsx
const [, api] = create(set => ({ n: 0, setN: n => set({ n }) }))

// Getting fresh state
const n = api.getState().n
// Listening to changes
const unsub = api.subscribe(state => console.log(state.n))
// Updating state, will trigger listeners
api.getState().setN(1)
// Unsubscribing handler
unsub()
// Destroying the store
api.destroy()
```
