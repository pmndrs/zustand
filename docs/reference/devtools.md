---
title: devtools
description:
nav: 205
---

# devtools

`devtools` middleware lets you use [Redux DevTools Extension](https://github.com/zalmoxisus/redux-devtools-extension)
without Redux. Read more about the benefits of using [Redux DevTools for debugging](https://redux.js.org/style-guide/#use-the-redux-devtools-extension-for-debugging).

```js
devtools(stateCreatorFn, devtoolsOptions)
```

- [Reference](#reference)
  - [Signature](#devtools-signature)
- [Usage](#usage)
- [Troubleshooting](#troubleshooting)
  - [Only one store is displayed](#only-one-store-is-displayed)
  - [Action names are labeled as 'anonymous'](#all-action-names-are-labeled-as-anonymous)

## Reference

### `devtools` Signature

```ts
devtools<T>(stateCreatorFn: StateCreator<T, [], []>, devtoolsOptions?: DevtoolsOptions): StateCreator<T, [], []>
```

#### Parameters

- `stateCreatorFn`: The state creator function that specifies how the state gets initialized and
  updated. It must be pure, should take `setState` function, `getState` function and `storeApi` as
  arguments.
- **optional** `devtoolsOptions`: An object to define Redux DevTools options.
  - **optional** `name`: A custom identifier for the connection in the Redux DevTools.
  - **optional** `enabled`: Defaults to `true`. Enables or disables the Redux DevTools integration
    for this store.
  - **optional** `anonymousActionType`: Defaults to `anonymous`. A string to use as the action type
    for anonymous mutations in the Redux DevTools.
  - **optional** `store`: A custom identifier for the store in the Redux DevTools.

#### Returns

`devtools` returns a state creator function.

## Usage

## Troubleshooting

### Only one store is displayed

Lorem ipsum dolor sit amet consectetur adipisicing elit. Illo voluptatum, eos suscipit explicabo
animi ad porro vitae vel ullam saepe magnam in facilis earum, nulla officia sit. Unde, nostrum
delectus!

### All action names are labeled as 'anonymous'

Lorem ipsum dolor sit, amet consectetur adipisicing elit. Placeat et illo hic architecto deleniti
soluta, veritatis reiciendis nesciunt laborum laudantium, dolorum asperiores fuga at accusamus aut
facere ex perspiciatis qui!
