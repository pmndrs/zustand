---
title: createStore
description:
nav: 1
---

<style dangerouslySetInnerHTML={{ __html: `#createstore { display: none; }` }}></style>

# createStore

`createStore` lets you create a vanilla store. Lorem ipsum dolor sit amet consectetur adipisicing
elit. Incidunt amet suscipit numquam laboriosam aliquam corporis quo, hic rem sint dignissimos
atque fuga porro perferendis, repellat, ducimus deserunt explicabo? Corrupti, in.

::: code-group

```ts [TypeScript]
createStore<T>()(initializer: StateCreator<T, [], []>): StoreApi<T>
```

```js [JavaScript]
createStore(initializer)
```

:::

- [Reference](#reference)
  - [`setState` function](#setstate-function)
  - [`getState` function](#getstate-function)
  - [`subscribe` function](#subscribe-function)
  - [`destroy` function](#destroy-function)
- [Usage](#usage)
  - [Usage 1](#usage-1)
  - [Usage 2](#usage-2)
  - [Usage 3](#usage-3)
- [Troubleshooting](#troubleshooting)
  - [Troubleshoot 1](#troubleshoot-1)
  - [Troubleshoot 2](#troubleshoot-2)
  - [Troubleshoot 3](#troubleshoot-3)

## Reference

```ts
createStore<T>()(initializer: StateCreator<T, [], []>): StoreApi<T>
```

#### Parameters

- `initializer`: The value you want the state to be initially. It can be a value of any type, but
  when you pass a function should take `setState` function, `getState` function and `store` as
  arguments.

#### Returns

`createStore` returns a vanilla store, that expose `setState` function, `getState` function,
`subscribe` function, and `destroy` function.

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
