---
title: createWithEqualityFn
description:
nav: 203
---

# createWithEqualityFn

`createWithEqualityFn` lets you create a store with a equality function from
the beginning and bound store to a custom hook. Lorem ipsum dolor sit amet
consectetur, adipisicing elit. Labore repellendus pariatur suscipit quidem hic
ullam blanditiis ut repudiandae ab unde dolores, tempore expedita ipsam minus reprehenderit voluptas soluta sed debitis!

::: code-group

```ts [TypeScript]
createWithEqualityFn<T>()(initializer: StateCreator<T, [], []>, equalityFn: (a: T, b: T) => boolean): UseBoundStore<StoreApi<T>>
```

```js [JavaScript]
createWithEqualityFn(initializer, equalityFn)
```

:::

- [Reference](#reference)
- [Usage](#usage)
- Troubleshooting(#troubleshooting)
