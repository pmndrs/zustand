---
title: useShallow
description:
nav: 211
---

# useShallow ⚛️

`useShallow` is a React Hook that lets you optimize re-renders.

```js
useShallow(selector)
```

- [Reference](#reference)
  - [Signature](#useshallow-signature)
- [Usage](#usage)
- [Troubleshooting](#troubleshooting)

## Reference

### `useShallow` Signature

```ts
useShallow<T, U>(selectorFn: (state: T) => U): (state: T) => U
```

#### Parameters

- `selectorFn`: A function that lets you return data that is based on current state.

#### Returns

`useShallow` returns a memoized version of a selector function using a shallow comparison for
memoization.

## Usage

## Troubleshooting
