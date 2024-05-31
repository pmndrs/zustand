---
title: shallow
description:
nav: 209
---

# shallow

`shallow` function lets you optimize re-renders.

```js
shallow(a, b)
```

- [Reference](#reference)
  - [Signature](#shallow-signature)
- [Usage](#usage)
  - [Skipping re-rendering when props are unchanged](#skipping-re-rendering-when-props-are-unchanged)
  - [Specifying a custom comparison function for 'memo'](#specifying-a-custom-comparison-function-for-memo)
- [Troubleshooting](#troubleshooting)
  - [My component re-renders](#my-component-re-renders)

## Reference

### `shallow` Signature

```ts
shallow<T>(a: T, b: T): boolean
```

#### Parameters

- `a`: The first value.
- `b`: The second value.

#### Returns

`shallow` returns `true` when `a` and `b` are equal based on a shallow comparison of their
**top-level** properties. Otherwise, it should return `false`.

## Usage

### Skipping re-rendering when props are unchanged

Lorem ipsum dolor sit amet consectetur adipisicing elit. Sed saepe nam reiciendis dignissimos
recusandae rem perspiciatis distinctio, dolor minus obcaecati expedita quis sunt nulla aliquam eius
quos iusto! Facere, molestiae!

### Specifying a custom comparison function for 'memo'

Lorem ipsum, dolor sit amet consectetur adipisicing elit. Culpa ullam, excepturi ipsam corporis
soluta placeat eum nam veritatis, quisquam quam necessitatibus similique porro sint possimus cum
obcaecati laboriosam sapiente provident.

## Troubleshooting

Lorem ipsum dolor sit amet consectetur adipisicing elit. Voluptas explicabo delectus necessitatibus
molestias ex distinctio corporis, ad, expedita qui quia corrupti quos fuga eaque! Adipisci dolore
minus omnis neque provident.

### My component re-renders

Lorem ipsum dolor sit amet consectetur adipisicing elit. Doloribus nobis nisi dolore necessitatibus
perspiciatis, iure consequatur mollitia cupiditate iste possimus suscipit a, harum fugiat officiis
aliquid explicabo. Expedita, architecto suscipit?
