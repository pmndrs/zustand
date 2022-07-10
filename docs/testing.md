## Resetting state between tests

When running tests, the stores are not automatically reset before each test run. 

Thus, there can be cases where the state of one test can affect another. To make sure all tests run with a pristine store state, you can mock `zustand` during testing and replace it with the following code:

```jsx
import actualCreate from 'zustand';
import { act } from 'react-dom/test-utils';

// a variable to hold reset functions for all stores declared in the app
const storeResetFns = new Set();

// when creating a store, we get its initial state, create a reset function and add it in the set
const create = createState => {
  if (!createState) return create
  const store = actualCreate(createState);
  const initialState = store.getState();
  storeResetFns.add(() => store.setState(initialState, true));
  return store;
};

// Reset all stores after each test run
afterEach(() => {
  act(() => storeResetFns.forEach((resetFn) => resetFn()));
});

export default create;
```

The way you can mock a depedency depends on your test runner. 

In [jest](https://jestjs.io/), you can create a `__mocks__/zustand.js` and place the code there. If your app is using `zustand/vanilla` instead of `zustand`, then you'll have to place the above code in `__mocks__/zustand/vanilla.js`