---
title: useStore
description:
nav: 212
---

# useStore

`useStore` lets you use a vanilla store bound it to a custom hook. Lorem ipsum dolor sit amet
consectetur adipisicing elit. Amet nesciunt ipsam nemo veniam! Incidunt deleniti, deserunt vero
iure quaerat est nam tenetur. Quae veritatis aut molestiae, nostrum tempore minus rem.

::: code-group

```ts [TypeScript]
useStore<StoreApi<T>, U = T>(api: StoreApi<T>, selector?: (state: T) => U) => UseBoundStore<StoreApi<T>>
```

```js [JavaScript]
useStore(api, selector)
```

:::

- [Reference](#reference)
- [Usage](#usage)
- [Troubleshooting](#troubleshooting)

## Reference

```ts [TypeScript]
useStore<StoreApi<T>, U = T>(api: StoreApi<T>, selector?: (state: T) => U) => UseBoundStore<StoreApi<T>>
```

#### Parameters

- `api`: Lorem ipsum dolor sit amet consectetur adipisicing elit. Optio asperiores nesciunt dolore
  recusandae culpa qui, deserunt vitae, doloribus dolorum ipsam voluptate nemo esse debitis pariatur
  repudiandae officiis accusamus tenetur quibusdam!
- `selector`: Lorem ipsum dolor sit amet consectetur adipisicing elit. Qui iusto obcaecati vero
  fuga sit dicta omnis, consectetur nihil impedit pariatur autem in doloribus non at tenetur veniam
  amet hic nostrum!

#### Returns

`useStore` it returns `selector` function results whe
