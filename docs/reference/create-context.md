---
title: createContext
description:
nav: 201
---

# createContext ⚛️

`createContext` lets you create a context that components can provider or read a store.

```js
createContext()
```

- [Reference](#reference)
  - [Signature](#createcontext-signature)
  - [`Provider`](#provider)
  - [`useContextStore`](#usecontextstore)
  - [`useStoreApi`](#usestoreapi)
- [Usage](#usage)
- [Troubleshooting](#troubleshooting)

## Reference

### `createContext` Signature

```ts
createContext<StoreApi<T>, U = T>(): {
  Provider: React.FC<{ createStore: StateCreator<T> }>,
  useContextStore: (selectorFn?: (state: T) => U, equalityFn?: (a: T, b: T) => boolean) => U,
  useStoreApi: () => StoreApi<T>
}
```

#### Parameters

`createContext` does not take any parameters.

#### Returns

`createContext` returns a context object.

The context object itself does not hold any information. It represents which context other
components read or provide. Typically, you will use [`Provider`](#provider) in components above to
specify the context value. Call [`useContexStore`](#usecontextstore) in components below to read
it, and call [`useStoreApi`](#usestoreapi) in components bellow to access to store API utilities.
The context object has a few properties:

- `Provider` lets you provide the store to components.
- `useContextStore` lets you read the store state.
- `useStoreApi` lets you access to store API utilities

### `Provider`

#### Parameters

- `createStore`: Lorem ipsum dolor, sit amet consectetur adipisicing elit. Fugit, illum sequi,
  nulla a architecto magni eum ex aspernatur laborum numquam neque rerum? Nam quas minus
  repudiandae quam accusantium mollitia distinctio.
- `children`: Lorem ipsum dolor sit, amet consectetur adipisicing elit. Obcaecati, iure incidunt
  corrupti repellendus accusamus repellat, blanditiis voluptate ex libero soluta id quia, aliquid
  nesciunt maxime voluptates alias perspiciatis aperiam autem.

#### Returns

### `useContextStore`

#### Parameters

- `selectorFn`: A function that lets you return data that is based on current state.
- `equalityFn`: A function that lets you skip re-renders.

#### Returns

`useContextStore` returns current state.

### `useStoreApi`

#### Parameters

`useStoreApi` does not take any parameters.

#### Returns

`useStoreApi` returns Lorem ipsum dolor sit amet consectetur adipisicing elit. Libero recusandae
necessitatibus dolorem perspiciatis accusamus vel molestiae qui officiis, iure pariatur ad iste
error dignissimos sequi commodi sapiente quam cumque harum?

## Usage

## Troubleshooting
