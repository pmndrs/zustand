---
title: createStore
description:
nav: 202
---

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
  - [Updating state based on previous state](#updating-state-base-on-a-previous-state)
  - [Updating objects and non-objects in state](#updating-objects-and-non-objects-in-state)
  - [Subscribing to state updates](#subscribing-to-state-updates)
- [Troubleshooting](#troubleshooting)
  - [I’ve updated the state, but the screen doesn’t update](#ive-updated-the-state-but-the-screen-doesnt-update)

## Reference

```ts
createStore<T>()(initializer: StateCreator<T, [], []>): StoreApi<T>
```

#### Parameters

- `initializer`: The value you want the state to be initially. It can be a value of any type, but
  when you pass a function should take `setState` function, `getState` function and `api` as
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

### Updating state base on a previous state

Lorem ipsum dolor sit amet consectetur adipisicing elit. Nam in provident eius eaque modi,
architecto consequuntur nihil soluta, dolore ratione, deleniti voluptatum unde. Qui veritatis,
deleniti error vero ducimus sunt.

### Updating objects and non-objects in state

Lorem, ipsum dolor sit amet consectetur adipisicing elit. Cupiditate consectetur sequi repellendus
culpa nesciunt dolores aut. Voluptas corrupti expedita temporibus doloribus, maxime dolor iure
suscipit adipisci hic cumque quasi officia?

### Subscribing to state updates

Lorem ipsum dolor sit amet, consectetur adipisicing elit. Aut quidem est neque consequuntur,
dolorem eius, explicabo ullam voluptatibus ex corporis qui, quasi eum reprehenderit maxime! Magni
magnam dignissimos eos dicta!

## Troubleshooting

Lorem, ipsum dolor sit amet consectetur adipisicing elit. Aut illo, earum beatae voluptate corporis
saepe ipsa? Placeat animi commodi qui odit debitis eveniet enim maiores, illum tempora repellendus
sint non?

### I’ve updated the state, but the screen doesn’t update

Lorem ipsum dolor sit amet consectetur adipisicing elit. Modi facere vel minus saepe inventore hic
tenetur aspernatur officia ipsam accusantium illum, neque consectetur placeat doloremque pariatur
voluptatum amet odio quos!
