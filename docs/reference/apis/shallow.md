---
title: shallow
description: How compare simple data effectively
nav: 27
---

`shallow` lets you run fast checks on simple data structures. It effectively identifies changes in
**top-level** properties when you're working with data structures that don't have nested objects or
arrays within them.

> [!NOTE]
> Shallow lets you perform quick comparisons, but keep its limitations in mind.

```js
const equal = shallow(a, b)
```

- [Types](#types)
  - [Signature](#shallow-signature)
- [Reference](#reference)
- [Usage](#usage)
  - [Comparing Primitives](#comparing-primitives)
  - [Comparing Objects](#comparing-objects)
  - [Comparing Sets](#comparing-sets)
  - [Comparing Maps](#comparing-maps)
- [Troubleshooting](#troubleshooting)
  - [Comparing objects returns `false` even if they are identical.](#comparing-objects-returns-false-even-if-they-are-identical)
  - [Comparing objects with different prototypes](#comparing-objects-with-different-prototypes)

## Types

### Signature

```ts
shallow<T>(a: T, b: T): boolean
```

## Reference

### `shallow(a, b)`

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

Object.is(bigIntLeft, bigIntRight) // -> true
shallow(bigIntLeft, bigIntRight) // -> true
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

### Comparing objects with different prototypes

The `shallow` function checks whether the two objects have the same prototype. If their prototypes
are referentially different, shallow will return `false`. This comparison is done using:

```ts
Object.getPrototypeOf(a) === Object.getPrototypeOf(b)
```

> [!IMPORTANT]
> Objects created with the object initializer (`{}`) or with `new Object()` inherit from
> `Object.prototype` by default. However, objects created with `Object.create(proto)` inherit from
> the proto you pass in—which may not be `Object.prototype.`

```ts
const a = Object.create({}) // -> prototype is `{}`
const b = {} // -> prototype is `Object.prototype`

shallow(a, b) // -> false
```
