---
title: shallow
description:
nav: 209
---

# shallow

`shallow` lets you run fast checks on simple data structures. It effectively identifies changes in
**top-level** properties when you're working with data structures that don't have nested objects or
arrays within them.

> **Note:** shallow lets you perform quick comparisons, but keep its limitations in mind.

```js
shallow(a, b)
```

- [Reference](#reference)
  - [Signature](#shallow-signature)
- [Usage](#usage)
  - [Comparing Primitives](#comparing-primitives)
  - [Comparing Objects](#comparing-objects)
  - [Comparing Sets](#comparing-sets)
  - [Comparing Maps](#comparing-maps)
- [Troubleshooting](#troubleshooting)
  - [Comparing objects returns `false` even if they are identical.](#comparing-objects-returns-false-even-if-they-are-identical)

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

### Comparing Primitives

When comparing primitive values like `string`s, `number`s, `boolean`s, and `BigInt`s, both
`Object.is` and `shallow` function return `true` if the values are the same. This is because
primitive values are compared by their actual value rather than by reference.

```ts
const stringLeft = 'John Doe'
const stringRight = 'John Doe'

Object.is(stringLeft, stringRight) // -> true
shallow(stringLeft, stringRight) // -> true

const numberLeft = 10
const numberRight = 10

Object.is(numberLeft, numberRight) // -> true
shallow(numberLeft, numberRight) // -> true

const booleanLeft = true
const booleanRight = true

Object.is(booleanLeft, booleanRight) // -> true
shallow(booleanLeft, booleanRight) // -> true

const bigIntLeft = 1n
const bigIntRight = 1n

Object.is(bigInLeft, bigInRight) // -> true
shallow(bigInLeft, bigInRight) // -> true
```

### Comparing Objects

When comparing objects, it's important to understand how `Object.is` and `shallow` function
operate, as they handle comparisons differently.

The `shallow` function returns `true` because shallow performs a shallow comparison of the objects.
It checks if the top-level properties and their values are the same. In this case, the top-level
properties (`firstName`, `lastName`, and `age`) and their values are identical between `objectLeft`
and `objectRight`, so shallow considers them equal.

```ts
const objectLeft = {
  firstName: 'John',
  lastName: 'Doe',
  age: 30,
}
const objectRight = {
  firstName: 'John',
  lastName: 'Doe',
  age: 30,
}

Object.is(objectLeft, objectRight) // -> false
shallow(objectLeft, objectRight) // -> true
```

### Comparing Sets

When comparing sets, it's important to understand how `Object.is` and `shallow` function operate,
as they handle comparisons differently.

The `shallow` function returns `true` because shallow performs a shallow comparison of the sets. It
checks if the top-level properties (in this case, the sets themselves) are the same. Since `setLeft`
and `setRight` are both instances of the Set object and contain the same elements, shallow considers
them equal.

```ts
const setLeft = new Set([1, 2, 3])
const setRight = new Set([1, 2, 3])

Object.is(setLeft, setRight) // -> false
shallow(setLeft, setRight) // -> true
```

### Comparing Maps

When comparing maps, it's important to understand how `Object.is` and `shallow` function operate, as
they handle comparisons differently.

The `shallow` returns `true` because shallow performs a shallow comparison of the maps. It checks if
the top-level properties (in this case, the maps themselves) are the same. Since `mapLeft` and
`mapRight` are both instances of the Map object and contain the same key-value pairs, shallow
considers them equal.

```ts
const mapLeft = new Map([
  [1, 'one'],
  [2, 'two'],
  [3, 'three'],
])
const mapRight = new Map([
  [1, 'one'],
  [2, 'two'],
  [3, 'three'],
])

Object.is(mapLeft, mapRight) // -> false
shallow(mapLeft, mapRight) // -> true
```

### Skipping re-rendering when props are unchanged

When you use `memo`, your component re-renders whenever any prop is not shallowly equal to what it
was previously. This means that React compares every prop in your component with its previous value
using the `Object.is(...)` comparison. Note that `Object.is(3, 3)` is `true`, but
`Object.is({}, {})` is `false`.

In that case, you can provide a custom comparison function, which React will use to compare the
previous and next props instead of using shallow equality. This function is passed as a second
argument to `memo`. It should return `true` only if the new props would result in the same output as
the old props; otherwise it should return `false`.

```tsx
import { memo, useState } from 'react'
import { shallow } from 'zustand/vanilla/shallow'

const Chart = memo(
  function Chart({ dataPoints }: { dataPoints: { x: number; y: number }[] }) {
    console.log('Data points', dataPoints)

    return <div>Cool Chart</div>
  },
  (previousProps, nextProps) => {
    return (
      previousProps.dataPoints.length === nextProps.dataPoints.length &&
      previousProps.dataPoints.every((previousPoint, index) => {
        const nextPoint = nextProps.dataPoints[index]
        return shallow(previousPoint, nextPoint)
      })
    )
  },
)

export default function App() {
  const [count, setCount] = useState(0)
  const dataPoints = [
    { x: 1, y: 10 },
    { x: 2, y: 15 },
    { x: 3, y: 8 },
    { x: 4, y: 12 },
  ]

  return (
    <>
      <button
        type="button"
        onClick={() => setCount((currentCount) => currentCount + 1)}
      >
        Count: {count}
      </button>
      <Chart dataPoints={dataPoints} />
    </>
  )
}
```

> **Note:** moving `dataPoints` outside of component eliminates the need for a custom comparison
> function

## Troubleshooting

### Comparing objects returns `false` even if they are identical.

The `shallow` function performs a shallow comparison. A shallow comparison checks if the top-level
properties of two objects are equal. It does not check nested objects or deeply nested properties.
In other words, it only compares the references of the properties.

In the following example, the shallow function returns `false` because it compares only the
top-level properties and their references. The address property in both objects is a nested object,
and even though their contents are identical, their references are different. Consequently, shallow
sees them as different, resulting in `false`.

```ts
const objectLeft = {
  firstName: 'John',
  lastName: 'Doe',
  age: 30,
  address: {
    street: 'Kulas Light',
    suite: 'Apt. 556',
    city: 'Gwenborough',
    zipcode: '92998-3874',
    geo: {
      lat: '-37.3159',
      lng: '81.1496',
    },
  },
}
const objectRight = {
  firstName: 'John',
  lastName: 'Doe',
  age: 30,
  address: {
    street: 'Kulas Light',
    suite: 'Apt. 556',
    city: 'Gwenborough',
    zipcode: '92998-3874',
    geo: {
      lat: '-37.3159',
      lng: '81.1496',
    },
  },
}

Object.is(objectLeft, objectRight) // -> false
shallow(objectLeft, objectRight) // -> false
```

If we remove the `address` property, the shallow comparison would work as expected because all
top-level properties would be primitive values or references to the same values:

```ts
const objectLeft = {
  firstName: 'John',
  lastName: 'Doe',
  age: 30,
}
const objectRight = {
  firstName: 'John',
  lastName: 'Doe',
  age: 30,
}

Object.is(objectLeft, objectRight) // -> false
shallow(objectLeft, objectRight) // -> true
```

In this modified example, `objectLeft` and `objectRight` have the same top-level properties and
primitive values. Since `shallow` function only compares the top-level properties, it will return
`true` because the primitive values (`firstName`, `lastName`, and `age`) are identical in both
objects.
