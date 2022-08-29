---
title: How to reset state
nav: 18
---

The following pattern can be used to reset the state to its initial value.

```ts
//define types for state values and actions separately

type State = {
  salmon: number
  tuna: number
}

type Actions = {
  addSalmon: (qty: number) => void
  addTuna: (qty: number) => void
  reset: () => void
}

//define the initial state
const initalState: State = {
  salmon: 0,
  tuna: 0,
}

//create store
const useSlice = create<State & Actions>((set, get) => ({
  ...initialState,

  addSalmon: (qty: number) => {
    set({ salmon: get().salmon + qty })
  },

  addTuna: (qty: number) => {
    set({ tuna: get().tuna + qty })
  },

  reset: () => {
    set(initialState)
  },
}))
```

Resetting multiple stores at once instead of individual stores

```ts
import actualCreate, {
  GetState,
  SetState,
  State,
  StateCreator,
  StoreApi,
  UseBoundStore,
} from 'zustand'

const resetters: (() => void)[] = []

export const create: typeof actualCreate = <TState extends State>(
  createState:
    | StateCreator<TState, SetState<TState>, GetState<TState>, any>
    | StoreApi<TState>
): UseBoundStore<TState, StoreApi<TState>> => {
  const slice = actualCreate(createState)
  const initialState = slice.getState()

  resetters.push(() => {
    slice.setState(initialState, true)
  })

  return slice
}

export const resetAllSlices = () => {
  for (const resetter of resetters) {
    resetter()
  }
}
```
