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
  - [Skipping re-rendering when props are unchanged](#skipping-re-rendering-when-props-are-unchanged)
- [Troubleshooting](#troubleshooting)
  - TBD

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

    return <>Cool Chart</>
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
