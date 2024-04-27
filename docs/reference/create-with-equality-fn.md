---
title: createWithEqualityFn
description:
nav: 203
---

# createWithEqualityFn

`createWithEqualityFn` lets you create a store with an equality function from the beginning and
bound store to a custom hook. Lorem ipsum dolor sit amet consectetur, adipisicing elit. Labore
repellendus pariatur suscipit quidem hic ullam blanditiis ut repudiandae ab unde dolores, tempore
expedita ipsam minus reprehenderit voluptas soluta sed debitis!

::: code-group

```ts [TypeScript]
createWithEqualityFn<T>()(initializer: StateCreator<T, [], []>, equalityFn: (a: T, b: T) => boolean): UseBoundStore<StoreApi<T>>
```

```js [JavaScript]
createWithEqualityFn(initializer, equalityFn)
```

:::

- [Reference](#reference)
  - [`selector` function](#selector-function)
  - [`equalityFn` function](#equalityfn-function)
  - [`setState` function](#setstate-function)
  - [`getState` function](#getstate-function)
  - [`subscribe` function](#subscribe-function)
  - [`destroy` function](#destroy-function)
- [Usage](#usage)
  - [Updating state based on previous state](#updating-state-base-on-a-previous-state)
  - [Updating objects and non-objects in state](#updating-objects-and-non-objects-in-state)
  - [Subscribing to state updates](#subscribing-to-state-updates)
- [Troubleshooting](#troubleshooting)
  - [I’ve updated the state, but the screen doesn’t update](#ive-updated-the-state-but-the-screen-doesnt-update)

## Reference

```ts
createWithEqualityFn<T>()(initializer: StateCreator<T, [], []>, equalityFn: (a: T, b: T) => boolean): UseBoundStore<StoreApi<T>>
```

#### Parameters

- `initializer`: The value you want the state to be initially. It can be a value of any type, but
  when you pass a function should take `setState` function, `getState` function and `api` as
  arguments.
- `equalityFn`: A function that accepts two arguments: the previous state, and its new state. It
  should return `true` if the old and new states are equal. Otherwise it should return `false`.

#### Returns

`createWithEqualityFn` returns a custom hook, that could take `selector` function, and `equalityFn`
function as arguments. Also, expose `setState` function, `getState` function, `subscribe` function,
and `destroy` function.

### `selector` function

Lorem ipsum dolor, sit amet consectetur adipisicing elit. Incidunt, natus reiciendis porro earum
fugit, nihil vero adipisci assumenda, quia ab harum nostrum quasi. Dolorem, aspernatur. Nemo quae
repellendus doloribus deserunt?

### `equalityFn` function

Lorem ipsum dolor sit amet consectetur adipisicing elit. Qui perspiciatis inventore minus totam
nihil quasi ipsa, iure pariatur distinctio aspernatur aliquid reprehenderit alias a. Aliquam quis
deleniti temporibus ex vero.

### `setState` function

Lorem ipsum, dolor sit amet consectetur adipisicing elit. Iure incidunt laboriosam et ut facere
quisquam ab tempore, sed veniam? Provident esse illum eos iusto, deserunt libero vel labore nam
nostrum?

### `getState` function

Lorem ipsum dolor sit amet consectetur adipisicing elit. Id laudantium alias molestias adipisci
incidunt culpa accusamus expedita perspiciatis fugiat, consequuntur saepe assumenda maxime sint
molestiae magni ipsam, praesentium quia temporibus?

### `subscribe` function

Lorem ipsum dolor sit amet consectetur adipisicing elit. Reprehenderit facilis impedit voluptate
inventore cum suscipit esse quidem ab sequi, maxime corrupti ipsum aliquid officiis magnam
perspiciatis corporis quaerat optio reiciendis.

### `destroy` function

Lorem ipsum dolor sit amet consectetur, adipisicing elit. Est nostrum, voluptas magni consequuntur
cum quibusdam quas iusto quae minima autem sed assumenda aut sapiente? Saepe voluptatem a cum
deserunt sed!
