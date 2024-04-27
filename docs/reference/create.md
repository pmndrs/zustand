---
title: create
description:
nav: 204
---

# create

`create` lets you create a store and then bound the store to a custom hook. Lorem ipsum dolor sit,
amet consectetur adipisicing elit. Consequuntur dolorum quaerat hic ipsum, perspiciatis enim
laudantium minima porro tempore laboriosam praesentium obcaecati modi nesciunt voluptatibus at
fugit libero iusto cum.

::: code-group

```ts [TypeScript]
create<T>()(initializer: StateCreator<T, [], []>): UseBoundStore<StoreApi<T>>
```

```js [JavaScript]
create(initializer)
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
create<T>()(initializer: StateCreator<T, [], []>): UseBoundStore<StoreApi<T>>
```

#### Parameters

- `initializer`: The value you want the state to be initially. It can be a value of any type, but
  when you pass a function should take `setState` function, `getState` function and `api` as
  arguments.

#### Returns

`create` returns a custom hook, that could take `selector` function, and `equalityFn` function as
arguments. Also, expose `setState` function, `getState` function, `subscribe` function, and
`destroy` function.

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

## Usage

## Troubleshooting
