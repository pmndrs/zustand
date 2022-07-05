# Flux inspired practice

Although zustand is an unopinionated library, here's one of the recommended usages.

```js
const useStore = create((set) => ({
  storeSliceA: ...,
  storeSliceB: ...,
  storeSliceC: ...,
  dispatchX: () => set(...),
  dispatchY: () => set(...),
}))
```

- Create one single store
- Define a store only with `set`
- Define dispatch functions at the root level of store to update one or more store slices

See [Splitting the store into separate slices](https://github.com/pmndrs/zustand/wiki/Splitting-the-store-into-separate-slices) to define a store with separate slices.