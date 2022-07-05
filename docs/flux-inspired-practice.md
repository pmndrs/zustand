# Flux inspired practice

Although zustand is an unopinionated library, here's one of the recommended usages.

```js
const createBearSlice = (set) => ({
  bears: 0,
  addBear: () => set((state) => ({ bears: state.bears + 1 })),
})

const createFishSlice = (set) => ({
  fishes: 0,
  addFish: () => set((state) => ({ fishes: state.fishes + 1 })),
})

const useStore = create()((...a) => ({
  ...createBearSlice(...a),
  ...createFishSlice(...a),
}))
```

- Create one single store
- Define a store only with `set`
- Define dispatch functions at the root level of the store to update one or more store slices

See [Splitting the store into separate slices](https://github.com/pmndrs/zustand/wiki/Splitting-the-store-into-separate-slices) to define a store with separate slices.
