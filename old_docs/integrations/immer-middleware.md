---
title: Immer middleware
nav: 16
---

The [Immer](https://github.com/immerjs/immer) middleware enables you
to use immutable state in a more convenient way.
Also, with Immer, you can simplify handling
immutable data structures in Zustand.

## Installation

In order to use the Immer middleware in Zustand,
you will need to install Immer as a direct dependency.

```bash
npm install immer
```

## Usage

(Notice the extra parentheses after the type parameter as mentioned in the [Typescript Guide](../guides/typescript.md)).

Updating simple states

```ts
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

type State = {
  count: number
}

type Actions = {
  increment: (qty: number) => void
  decrement: (qty: number) => void
}

export const useCountStore = create<State & Actions>()(
  immer((set) => ({
    count: 0,
    increment: (qty: number) =>
      set((state) => {
        state.count += qty
      }),
    decrement: (qty: number) =>
      set((state) => {
        state.count -= qty
      }),
  })),
)
```

Updating complex states

```ts
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

interface Todo {
  id: string
  title: string
  done: boolean
}

type State = {
  todos: Record<string, Todo>
}

type Actions = {
  toggleTodo: (todoId: string) => void
}

export const useTodoStore = create<State & Actions>()(
  immer((set) => ({
    todos: {
      '82471c5f-4207-4b1d-abcb-b98547e01a3e': {
        id: '82471c5f-4207-4b1d-abcb-b98547e01a3e',
        title: 'Learn Zustand',
        done: false,
      },
      '354ee16c-bfdd-44d3-afa9-e93679bda367': {
        id: '354ee16c-bfdd-44d3-afa9-e93679bda367',
        title: 'Learn Jotai',
        done: false,
      },
      '771c85c5-46ea-4a11-8fed-36cc2c7be344': {
        id: '771c85c5-46ea-4a11-8fed-36cc2c7be344',
        title: 'Learn Valtio',
        done: false,
      },
      '363a4bac-083f-47f7-a0a2-aeeee153a99c': {
        id: '363a4bac-083f-47f7-a0a2-aeeee153a99c',
        title: 'Learn Signals',
        done: false,
      },
    },
    toggleTodo: (todoId: string) =>
      set((state) => {
        state.todos[todoId].done = !state.todos[todoId].done
      }),
  })),
)
```

## Gotchas

In this section you will find some things
that you need to keep in mind when using Zustand with Immer.

### My subscriptions aren't being called

If you are using Immer,
make sure you are actually following
[the rules of Immer](https://immerjs.github.io/immer/pitfalls).

For example, you have to add `[immerable] = true` for
[class objects](https://immerjs.github.io/immer/complex-objects) to work.
If you don't do this, Immer will still mutate the object,
but not as a proxy, so it will also update the current state.
Zustand checks if the state has actually changed,
so since both the current state and the next state are
equal (if you don't do it correctly),
Zustand will skip calling the subscriptions.

## CodeSandbox Demo

- [Basic](https://codesandbox.io/p/sandbox/zustand-updating-draft-states-basic-demo-forked-96mkdw),
- [Advanced](https://codesandbox.io/p/sandbox/zustand-updating-draft-states-advanced-demo-forked-phkzzg).
