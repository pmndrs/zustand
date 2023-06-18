---
title: Testing
description: Writing Tests
nav: 9
---

## Setting Up a Test Environment

### Test Runners

Usually, your test runner needs to be configured to run JavaScript/TypeScript syntax. If you're
going to be testing UI components, you will likely need to configure the test runner to use JSDOM
to provide a mock DOM environment.

See these resources for test runner configuration instructions:

- **Jest**
  - [Jest: Getting Started](https://jestjs.io/docs/getting-started)
  - [Jest: Configuration - Test Environment](https://jestjs.io/docs/configuration#testenvironment-string)
- **Vitest**
  - [Vitest: Getting Started](https://vitest.dev/guide)
  - [Vitest: Configuration - Test Environment](https://vitest.dev/config/#environment)

### UI and Network Testing Tools

#### Web

**We recommend using [React Testing Library (RTL)](https://testing-library.com/docs/react-testing-library/intro)
to test React components that connect to Zustand**. `RTL` is a simple and complete React DOM
testing utility that encourages good testing practices. It uses `ReactDOM`'s render function and
act from `react-dom/tests-utils`. (The [Testing Library](https://testing-library.com/) family of
tools also includes adapters for many other popular frameworks too.)

#### Native

**We recommend using [Native Testing Library (RNTL)](https://testing-library.com/docs/react-native-testing-library/intro)
to test React Native components that connect to Zustand**. `RTL` is a simple and complete native
testing utility that encourages good testing practices. The API is the same as `RTL` library with
some mire differences like `RNTL` queries are implemented independently, unlike other wrappers that
use `DOM Testing Library`.

#### Network Requests

We also recommend using [Mock Service Worker (MSW)](https://mswjs.io/) to mock network requests, as
this means your application logic does not need to be changed or mocked when writing tests.

- **React Testing Library**
  - [DOM Testing Library: Setup](https://testing-library.com/docs/dom-testing-library/setup)
  - [React Testing Library: Setup](https://testing-library.com/docs/react-testing-library/setup)
  - [Testing Library Jest-DOM Matchers](https://testing-library.com/docs/ecosystem-jest-dom)
- **Native Testing Library**
  - [Native Testing Library: Setup](https://testing-library.com/docs/react-native-testing-library/setup)
- **Mock Service Worker**
  - [MSW: Installation](https://mswjs.io/docs/getting-started/install)
  - [MSW: Setting up mock requests](https://mswjs.io/docs/getting-started/mocks/rest-api)
  - [MSW: Mock server configuration for Node](https://mswjs.io/docs/getting-started/integrate/node)

## Setting Up Zustand for testing

Since `Jest` and `Vitest` have slight difference like `Vitest` uses **ES modules** and `Jest`
uses **CommonJS modules**, you need to keep that if you using `Vitest` instead of `Jest`.

### Jest

```ts
// __mocks__/zustand.ts
import type { StateCreator } from 'zustand'
import { act } from '@testing-library/react'

const { create: actualCreate } = jest.requireActual('zustand')

// a variable to hold reset functions for all stores declared in the app
export const storeResetFns = new Set<() => void>()

// when creating a store, we get its initial state, create a reset function and add it in the set
export const create = (<T extends unknown>(stateCreator: StateCreator<T>) => {
  const store = actualCreate(stateCreator)
  const initialState = store.getState()
  storeResetFns.add(() => {
    store.setState(initialState, true)
  })
  return store
}) as typeof actualCreate

// Reset all stores after each test run
beforeEach(() => {
  act(() => {
    storeResetFns.forEach((resetFn) => {
      resetFn()
    })
  })
})
```

### Vitest

```ts
// __mocks__/zustand.ts
import { beforeEach, vi } from 'vitest'
import type { StateCreator } from 'zustand'
import { act } from '@testing-library/react'

const { create: actualCreate } = await jest.importActual('zustand')

// a variable to hold reset functions for all stores declared in the app
export const storeResetFns = new Set<() => void>()

// when creating a store, we get its initial state, create a reset function and add it in the set
export const create = (<T extends unknown>(stateCreator: StateCreator<T>) => {
  const store = actualCreate(stateCreator)
  const initialState = store.getState()
  storeResetFns.add(() => {
    store.setState(initialState, true)
  })
  return store
}) as typeof actualCreate

// Reset all stores after each test run
beforeEach(() => {
  act(() => {
    storeResetFns.forEach((resetFn) => {
      resetFn()
    })
  })
})
```

> **Note:** you can remove `import { beforeEach, vi } from 'vitest'` when [globals configuration](https://vitest.dev/config/#globals)
> is enabled

```ts
// setup-vitest.ts
import { vi } from 'vitest'
vi.mock('zustand') // to make it works like `Jest` (auto-mocking)
```

> **Note**: you can remove `import { vi } from 'vitest'` when [globals configuration](https://vitest.dev/config/#globals)
> is enabled

```ts
// vite.config.ts or vitest.config.ts
import { defineConfig } from 'vite'
// import { defineConfig } from 'vitest/config' // if you are using vitest without vite

export default defineConfig({
  test: {
    // ...
    setupFiles: ['setup-vitest.ts'],
  },
})
```

In the next examples we are going to use `useStore`

> **Note**: all of these examples are written using `TypeScript`

```ts
// stores/user-store.ts
import { create } from 'zustand'

export type Store = {
  count: number
  inc: () => void
}

export const useStore = create<Store>()((set) => ({
  count: 1,
  inc: () => set((state) => ({ count: state.count + 1 })),
}))
```

### Testing components

```tsx
// components/counter.tsx
import { useStore } from '../stores/user-store'

function Counter() {
  const { count, inc } = useStore()

  return (
    <div>
      <span>{count}</span>
      <button onClick={inc}>one up</button>
    </div>
  )
}
```

### Testing stores

Still in progres. TBD

## References

- **React Testing Library**: [React Testing Library](https://testing-library.com/docs/react-testing-library/intro)
  is a very light-weight solution for testing React components. It provides light utility functions
  on top of react-dom and react-dom/test-utils, in a way that encourages better testing practices.
  Its primary guiding principle is: "The more your tests resemble the way your software is used, the
  more confidence they can give you."
- **Testing Implementation Details**: Blog post by Kent C. Dodds on why he recommends to avoid
  [testing implementation details](https://kentcdodds.com/blog/testing-implementation-details).
