---
title: useShallow
description:
nav: 211
---

# useShallow ⚛️

`useShallow` is a React Hook lets you Lorem ipsum dolor sit amet consectetur adipisicing elit.
Molestias repellat ipsum quidem. Vel, possimus aspernatur! Eveniet ea ab, vel dolorum vero dolorem,
nostrum, officiis cupiditate odit laudantium eius aliquam vitae?

```js
useShallow(selector)
```

- [Reference](#reference)
  - [Signature](#useshallow-signature)
  - [`selector` function](#selector-function)
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

`useShallow` returns a memoized version of a given `selector` function.

### `selector` function

The `selector` function lets you return data that is based on current state. It should take current
state as its only argument.

## Usage

## Troubleshooting
