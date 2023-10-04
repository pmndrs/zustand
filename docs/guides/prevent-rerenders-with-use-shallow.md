---
title: Prevent rerenders with useShallow
nav: 16
---

When you need to subscribe to a computed state from a store, the recommended way is to
use a selector.

The computed selector will cause a rererender if the output has changed according to [Object.is](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is?retiredLocale=it).

In this case you might want to use `useShallow` to avoid a rerender if the computed value is always shallow
equal the previous one.

## Example

We have a store that associates to each bear a meal and we want to render their names.

```js
import { create } from 'zustand'

const useMeals = create(() => ({
  papaBear: 'large porridge-pot',
  mamaBear: 'middle-size porridge pot',
  littleBear: 'A little, small, wee pot',
}))

export const BearNames = () => {
  const names = useMeals((state) => Object.keys(state))

  return <div>{names.join(', ')}</div>
}
```

Now papa bear wants a pizza instead:

```js
useMeals.setState({
  papaBear: 'a large pizza',
})
```

This change causes `BearNames` rerenders even tho the actual output of `names` has not changed according to shallow equal.

We can fix that using `useShallow`!

```js
import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'

const useMeals = create(() => ({
  papaBear: 'large porridge-pot',
  mamaBear: 'middle-size porridge pot',
  littleBear: 'A little, small, wee pot',
}))

export const BearNames = () => {
  const names = useMeals(useShallow((state) => Object.keys(state)))

  return <div>{names.join(', ')}</div>
}
```

Now they can all order other meals without causing unnecessary rerenders of our `BearNames` component.
