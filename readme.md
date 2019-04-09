    npm install msga

React state is in a bit of a mess. Hundreds of solutions out there, the established options don't exactly go along well with hooks. There are dozens of solutions that claim you can replace, say, Redux with hooks and context, but most of them can't select state, so everything renders on every change, which IMO doesn't qualify as a state-manager.

#### Create a store (or multiple, up to you...)

```jsx
// Name your store anything you like, but remember, it's a hook!
const useStore = create(set => ({
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
  const count = useState(state => state.count)
  return <h1>{count}</h1>
}

function Controlls() {
  const { inc, dec } = useState(state => state.actions)
  return (
    <>
      <button onClick={inc}>up</button>
      <button onClick={down}>down</button>
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

It's just like mapStateToProps in Redux. msga will run a small shallow euqal test over the object you return.

```jsx
const { name, age } = useStore(state => ({ name: state.name, age: state.age }))
```

## Fetching from multiple stores

You can create as many stores as you like, but you can also use data from one call in another.

```jsx
const currentUser = useCredentialsStore(state => state.currentUser)
const person = usePersonStore(state => state.persons[currentUser])
```

## Memoizing selectors (this is completely optional)

You can change the selector always. But additionally you can memoize it with an optional second argument that's similar to Reacts useMemo. You could do it without, but it will subscribe and unsubscribe to the store on every render pass. Not that big of a deal, unless you're dealing with thousands of connected components.

```jsx
const book = useBookStore(state => state.books[title], [title])
```

## Async actions

Just call `set` when you're ready, it doesn't care if your actions are async or not.

```jsx
const useStore = create(set => ({
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
const useStore = create((set, get) => ({
  text: "hello",
  action: () => {
    const text = get().text
    ///...
  }
})
```

## Sick of reducers and changing nested state? Use Immer!

```jsx
import produce from "immer"

const useStore = create((set, get) => ({
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
