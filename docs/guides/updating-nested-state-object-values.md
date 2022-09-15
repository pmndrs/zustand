---
title: Updating nested state object values
nav: 4
---

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

It requires some effort to update the count value immutably.

## Normal approach

The normal approach is to copy state object with the spread operator `...` like so:

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

This is very long!

## With immer

Many people use [immer](https://github.com/immerjs/immer) to update nested values. You can use immer to shorten your state updates for deeply nested object like this:

```ts
  immerInc: () =>
    set(produce((state: State) => { ++state.deep.nested.obj.count })),
```

What a reduction!. [Please take note of the gotchas listed here](../integrations/updating-draft-states.md).

## With optics-ts

There is another option with [optics-ts](https://github.com/akheron/optics-ts/):

```ts
  opticsInc: () =>
    set(O.modify(O.optic<State>().path("deep.nested.obj.count"))((c) => c + 1)),
```

Unlike immer, optics-ts doesn't use proxies or mutation syntax.

## With ramda

You can also use [ramda](https://ramdajs.com/):

```ts
  ramdaInc: () =>
    set(R.over(R.lensPath(["deep", "nested", "obj", "count"]), (c) => c + 1)),
```

Both ramda and optics-ts also work with types.

## CodeSandbox Demo

https://codesandbox.io/s/zustand-normal-immer-optics-ramda-updating-ynn3o?file=/src/App.tsx
