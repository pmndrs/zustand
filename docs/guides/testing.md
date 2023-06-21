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
act from `react-dom/tests-utils`. The [Testing Library](https://testing-library.com/) family of
tools also includes adapters for many other popular frameworks.

#### Native

**We recommend using [Native Testing Library (RNTL)](https://testing-library.com/docs/react-native-testing-library/intro)
to test React Native components that connect to Zustand**. `RNTL` is a simple and complete native
testing utility that encourages good testing practices. The API is the same as `RTL` library with
some minor differences like `RNTL` queries are implemented independently, unlike other wrappers
that use `DOM Testing Library`.

#### Network Requests

We also recommend using [Mock Service Worker (MSW)](https://mswjs.io/) to mock network requests, as
this means your application logic does not need to be changed or mocked when writing tests.

- **React Testing Library (DOM)**
  - [DOM Testing Library: Setup](https://testing-library.com/docs/dom-testing-library/setup)
  - [React Testing Library: Setup](https://testing-library.com/docs/react-testing-library/setup)
  - [Testing Library Jest-DOM Matchers](https://testing-library.com/docs/ecosystem-jest-dom)
- **Native Testing Library (React Native)**
  - [Native Testing Library: Setup](https://testing-library.com/docs/react-native-testing-library/setup)
- **User Event Testing Library (DOM)**
  - [User Event Testing Library: Setup](https://testing-library.com/docs/user-event/setup)
- **Mock Service Worker**
  - [MSW: Installation](https://mswjs.io/docs/getting-started/install)
  - [MSW: Setting up mock requests](https://mswjs.io/docs/getting-started/mocks/rest-api)
  - [MSW: Mock server configuration for Node](https://mswjs.io/docs/getting-started/integrate/node)

## Setting Up Zustand for testing

Since `Jest` and `Vitest` have slight differences, like `Vitest` using **ES modules** and `Jest`
using **CommonJS modules**, you need to keep that in mind if you are using `Vitest` instead of
`Jest`.

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
import * as zustand from 'zustand'
import { act } from '@testing-library/react'

const { create: actualCreate } = await vi.importActual<typeof zustand>(
  'zustand'
)

// a variable to hold reset functions for all stores declared in the app
export const storeResetFns = new Set<() => void>()

// when creating a store, we get its initial state, create a reset function and add it in the set
export const create = (<T extends unknown>(
  stateCreator: zustand.StateCreator<T>
) => {
  const store = actualCreate(stateCreator)
  const initialState = store.getState()
  storeResetFns.add(() => {
    store.setState(initialState, true)
  })
  return store
}) as typeof zustand.create

// reset all stores after each test run
beforeEach(() => {
  act(() => {
    storeResetFns.forEach((resetFn) => {
      resetFn()
    })
  })
})
```

> **Note:** without [globals configuration](https://vitest.dev/config/#globals) enabled you need to
> use `import { beforeEach, vi } from 'vitest'` at top level

```ts
// setup-vitest.ts
import '@testing-library/jest-dom'

vi.mock('zustand') // to make it works like `Jest` (auto-mocking)
```

> **Note**: without [globals configuration](https://vitest.dev/config/#globals) enabled you need to
> use `import { vi } from 'vitest'` at top level

```ts
// vitest.config.ts
import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./setup-vitest.ts'],
    },
  })
)
```

### Testing components

In the next examples we are going to use `useCounterStore`

> **Note**: all of these examples are written using `TypeScript`

```ts
// stores/user-counter-store.ts
import { create } from 'zustand'

export type CounterStore = {
  count: number
  inc: () => void
}

export const useCounterStore = create<CounterStore>()((set) => ({
  count: 1,
  inc: () => set((state) => ({ count: state.count + 1 })),
}))
```

```tsx
// components/counter/counter.tsx
import { useCounterStore } from '../../stores/user-counter-store'

export function Counter() {
  const { count, inc } = useCounterStore()

  return (
    <div>
      <span>{count}</span>
      <button onClick={inc}>one up</button>
    </div>
  )
}
```

```ts
// components/counter/index.ts
export * from './counter'
```

### Vitest

```tsx
// components/counter/counter.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { Counter } from './counter'

describe('Counter', () => {
  test('should render successfully', async () => {
    renderCounter()

    expect(await screen.findByText(/^1$/)).toBeInTheDocument()
    expect(
      await screen.findByRole('button', { name: /one up/i })
    ).toBeInTheDocument()
  })

  test('should increase count', async () => {
    const user = userEvent.setup()

    renderCounter()

    expect(await screen.findByText(/^1$/)).toBeInTheDocument()

    await user.click(await screen.findByRole('button', { name: /one up/ }))

    expect(await screen.findByText(/^2$/)).toBeInTheDocument()
  })
})

const renderCounter = () => {
  return render(<Counter />)
}
```

> **Note**: without [globals configuration](https://vitest.dev/config/#globals) enabled you need to
> use `import { describe, test, expect } from 'vitest'` at top level

### Testing stores

Still in progress. TBD

## References

- **React Testing Library**: [React Testing Library](https://testing-library.com/docs/react-testing-library/intro)
  is a very light-weight solution for testing React components. It provides light utility functions
  on top of react-dom and react-dom/test-utils, in a way that encourages better testing practices.
  Its primary guiding principle is: "The more your tests resemble the way your software is used, the
  more confidence they can give you."
- **Testing Implementation Details**: Blog post by Kent C. Dodds on why he recommends to avoid
  [testing implementation details](https://kentcdodds.com/blog/testing-implementation-details).
