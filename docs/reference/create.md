---
title: create
description:
nav: 204
---

# create

`create` let's create a store and bound store to a hook custom. Lorem ipsum dolor sit, amet
consectetur adipisicing elit. Consequuntur dolorum quaerat hic ipsum, perspiciatis enim laudantium
minima porro tempore laboriosam praesentium obcaecati modi nesciunt voluptatibus at fugit libero
iusto cum.

::: code-group

```ts [TypeScript]
create<T>()(initializer: StateCreator<T, [], []>): UseBoundStore<StoreApi<T>>
```

```js [JavaScript]
create(initializer)
```

:::

- [Reference](#reference)
- [Usage](#usage)
- [Troubleshooting](#troubleshooting)

## Reference

```ts [TypeScript]
create<T>()(initializer: StateCreator<T, [], []>): UseBoundStore<StoreApi<T>>
```

#### Parameters

- `initializer`: The value you want the state to be initially. It can be a value of any type, but
  when you pass a function should take `setState` function, `getState` function and `store` as
  arguments.

#### Returns

`create` returns a custom hook, that can take `selector` function, and `equalityFn` function as
arguments. Also, expose `setState` function, `getState` function, `subscribe` function, and
`destroy` function.

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
