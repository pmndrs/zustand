---
title: Updating nested state object values
nav: 4
---

## Deep nested object

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

The normal approach is to copy state object with `...`:

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

Many people use [immer](https://github.com/immerjs/immer) to update nested values:

```ts
  immerInc: () =>
    set(produce((state: State) => { ++state.deep.nested.obj.count })),
```

What a reduction!

## With optics-ts

There's another option with [optics-ts](https://github.com/akheron/optics-ts/):

```ts
  opticsInc: () =>
    set(O.modify(O.optic<State>().path("deep.nested.obj.count"))((c) => c + 1)),
```

Unlike immer, optics-ts doesn't use proxies nor mutation syntax.

## With ramda

You can also use [ramda](https://ramdajs.com/):

```ts
  ramdaInc: () =>
    set(R.over(R.lensPath(["deep", "nested", "obj", "count"]), (c) => c + 1)),
```

This works with types as well as optics-ts.

## CodeSandbox Demo

https://codesandbox.io/s/zustand-normal-immer-optics-ramda-updating-ynn3o?file=/src/App.tsx
