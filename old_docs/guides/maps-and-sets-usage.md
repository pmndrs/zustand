---
title: Map and Set Usage
nav: 11
---

You need to wrap Maps and Sets inside an object. When you want its update to be reflected (e.g. in React),
you do it by calling `setState` on it:

**You can view a codesandbox here: https://codesandbox.io/s/late-https-bxz9qy**

```js
import { create } from 'zustand'

const useFooBar = create(() => ({ foo: new Map(), bar: new Set() }))

function doSomething() {
  // doing something...

  // If you want to update some React component that uses `useFooBar`, you have to call setState
  // to let React know that an update happened.
  // Following React's best practices, you should create a new Map/Set when updating them:
  useFooBar.setState((prev) => ({
    foo: new Map(prev.foo).set('newKey', 'newValue'),
    bar: new Set(prev.bar).add('newKey'),
  }))
}
```
