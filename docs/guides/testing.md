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

**We recommend using [React Testing Library (RTL)](https://testing-library.com/docs/react-testing-library/intro)
to test out React components that connect to Zustand**. RTL is a simple and complete React DOM
testing utility that encourages good testing practices. It uses ReactDOM's `render` function and
`act` from `react-dom/tests-utils`. Futhermore, [Native Testing Library (RNTL)](https://testing-library.com/docs/react-native-testing-library/intro)
is the alternative to RTL to test out React Native components. The [Testing Library](https://testing-library.com/)
family of tools also includes adapters for many other popular frameworks.

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
- **TypeScript for Jest**
  - [TypeScript for Jest: Setup](https://kulshekhar.github.io/ts-jest/docs/getting-started/installation)
- **TypeScript for Node**
  - [TypeScript for Node: Setup](https://typestrong.org/ts-node/docs/installation)
- **Mock Service Worker**
  - [MSW: Installation](https://mswjs.io/docs/getting-started/install)
  - [MSW: Setting up mock requests](https://mswjs.io/docs/getting-started/mocks/rest-api)
  - [MSW: Mock server configuration for Node](https://mswjs.io/docs/getting-started/integrate/node)

## Setting Up Zustand for testing

> **Note**: Since Jest and Vitest have slight differences, like Vitest using **ES modules** and Jest using
> **CommonJS modules**, you need to keep that in mind if you are using Vitest instead of Jest.

The mock provided below will enable the relevant test runner to reset the zustand stores after each test.

> **Warning:** In the following examples we are only supporting the curried version of create `(create()(...))`,
> since it is supported on both JavaScript and TypeScript. If you are using the uncurried version of
> `create(...)` you will need to update your hooks to use the curried version, or update the mocks in order
> to support the uncurried version.

### Jest

In the next steps we are going to setup our Jest environment in order to mock Zustand.

```ts
// __mocks__/zustand.ts
import * as zustand from 'zustand'
import { act } from '@testing-library/react'

const { create: actualCreate, createStore: actualCreateStore } =
  jest.requireActual<typeof zustand>('zustand')

// a variable to hold reset functions for all stores declared in the app
export const storeResetFns = new Set<() => void>()

const createUncurried = <T>(stateCreator: zustand.StateCreator<T>) => {
  const store = actualCreate(stateCreator)
  const initialState = store.getState()
  storeResetFns.add(() => {
    store.setState(initialState, true)
  })
  return store
}

// when creating a store, we get its initial state, create a reset function and add it in the set
export const create = (<T>(stateCreator: zustand.StateCreator<T>) => {
  console.log('zustand create mock')

  // to support curried version of create
  return typeof stateCreator === 'function'
    ? createUncurried(stateCreator)
    : createUncurried
}) as typeof zustand.create

const createStoreUncurried = <T>(stateCreator: zustand.StateCreator<T>) => {
  const store = actualCreateStore(stateCreator)
  const initialState = store.getState()
  storeResetFns.add(() => {
    store.setState(initialState, true)
  })
  return store
}

// when creating a store, we get its initial state, create a reset function and add it in the set
export const createStore = (<T>(stateCreator: zustand.StateCreator<T>) => {
  console.log('zustand createStore mock')

  // to support curried version of createStore
  return typeof stateCreator === 'function'
    ? createStoreUncurried(stateCreator)
    : createStoreUncurried
}) as typeof zustand.createStore

// reset all stores after each test run
afterEach(() => {
  act(() => {
    storeResetFns.forEach((resetFn) => {
      resetFn()
    })
  })
})
```

```ts
// src/setup-jest.ts
import '@testing-library/jest-dom'
```

```ts
// jest.config.ts
import type { JestConfigWithTsJest } from 'ts-jest'

const config: JestConfigWithTsJest = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['./src/setup-jest.ts'],
}

export default config
```

> **Note**: to use TypeScript we need to install two packages `ts-jest` and `ts-node`.

### Vitest

In the next steps we are going to setup our Vitest environment in order to mock Zustand.

> **Warning:** In Vitest you can change the [root](https://vitest.dev/config/#root).
> Due to that, you need make sure that you are creating your `__mocks__` directory in the right place.
> Let's say that you change the **root** to `./src`, that means you need to create a `__mocks__`
> directory under `./src`. The end result would be `./src/__mocks__`, rather than `./__mocks__`.
> Creating `__mocks__` directory in the wrong place can lead to issues when using Vitest.

```ts
// __mocks__/zustand.ts
import * as zustand from 'zustand'
import { act } from '@testing-library/react'

const { create: actualCreate, createStore: actualCreateStore } =
  await vi.importActual<typeof zustand>('zustand')

// a variable to hold reset functions for all stores declared in the app
export const storeResetFns = new Set<() => void>()

const createUncurried = <T>(stateCreator: zustand.StateCreator<T>) => {
  const store = actualCreate(stateCreator)
  const initialState = store.getState()
  storeResetFns.add(() => {
    store.setState(initialState, true)
  })
  return store
}

// when creating a store, we get its initial state, create a reset function and add it in the set
export const create = (<T>(stateCreator: zustand.StateCreator<T>) => {
  console.log('zustand create mock')

  // to support curried version of create
  return typeof stateCreator === 'function'
    ? createUncurried(stateCreator)
    : createUncurried
}) as typeof zustand.create

const createStoreUncurried = <T>(stateCreator: zustand.StateCreator<T>) => {
  const store = actualCreateStore(stateCreator)
  const initialState = store.getState()
  storeResetFns.add(() => {
    store.setState(initialState, true)
  })
  return store
}

// when creating a store, we get its initial state, create a reset function and add it in the set
export const createStore = (<T>(stateCreator: zustand.StateCreator<T>) => {
  console.log('zustand createStore mock')

  // to support curried version of createStore
  return typeof stateCreator === 'function'
    ? createStoreUncurried(stateCreator)
    : createStoreUncurried
}) as typeof zustand.createStore

// reset all stores after each test run
afterEach(() => {
  act(() => {
    storeResetFns.forEach((resetFn) => {
      resetFn()
    })
  })
})
```

> **Note**: without [globals configuration](https://vitest.dev/config/#globals) enabled, we need
> to add `import { afterEach, vi } from 'vitest'` at the top.

```ts
// __mocks__/vitest-env.d.ts
/// <reference types="vite/client" />
/// <reference types="vitest/globals" />
```

> **Note**: without [globals configuration](https://vitest.dev/config/#globals) enabled, we do
> need to remove `/// <reference types="vitest/globals" />`.

```ts
// src/setup-vitest.ts
import '@testing-library/jest-dom'

vi.mock('zustand') // to make it works like Jest (auto-mocking)
```

> **Note**: without [globals configuration](https://vitest.dev/config/#globals) enabled, we need
> to add `import { vi } from 'vitest'` at the top.

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
  }),
)
```

### Testing components

In the next examples we are going to use `useCounterStore`

> **Note**: all of these examples are written using TypeScript.

```ts
// stores/counter-store-creator.ts
import { type StateCreator } from 'zustand'

export type CounterStore = {
  count: number
  inc: () => void
}

export const counterStoreCreator: StateCreator<CounterStore> = (set) => ({
  count: 1,
  inc: () => set((state) => ({ count: state.count + 1 })),
})
```

```ts
// stores/user-counter-store.ts
import { create } from 'zustand'

import { type CounterStore, counterStoreCreator } from './counter-store-creator'

export const useCounterStore = create<CounterStore>()(counterStoreCreator)
```

```tsx
// stores/use-counter-store-context.tsx
import {
  type PropsWithChildren,
  createContext,
  useContext,
  useRef,
} from 'react'
import { type StoreApi, createStore } from 'zustand'
import { useStoreWithEqualityFn } from 'zustand/traditional'
import { shallow } from 'zustand/shallow'

import { type CounterStore, counterStoreCreator } from './counter-store-creator'

export const createCounterStore = () => {
  return createStore<CounterStore>(counterStoreCreator)
}

export const CounterStoreContext = createContext<StoreApi<CounterStore>>(
  null as never,
)

export type CounterStoreProviderProps = PropsWithChildren

export const CounterStoreProvider = ({
  children,
}: CounterStoreProviderProps) => {
  const counterStoreRef = useRef(createCounterStore())

  return (
    <CounterStoreContext.Provider value={counterStoreRef.current}>
      {children}
    </CounterStoreContext.Provider>
  )
}

export type UseCounterStoreContextSelector<T> = (store: CounterStore) => T

export const useCounterStoreContext = <T,>(
  selector: UseCounterStoreContextSelector<T>,
): T => {
  const counterStoreContext = useContext(CounterStoreContext)

  if (counterStoreContext === undefined) {
    throw new Error(
      'useCounterStoreContext must be used within CounterStoreProvider',
    )
  }

  return useStoreWithEqualityFn(counterStoreContext, selector, shallow)
}
```

```tsx
// components/counter/counter.tsx
import { useCounterStore } from '../../stores/use-counter-store'

export function Counter() {
  const { count, inc } = useCounterStore()

  return (
    <div>
      <h2>Counter Store</h2>
      <h4>{count}</h4>
      <button onClick={inc}>One Up</button>
    </div>
  )
}
```

```ts
// components/counter/index.ts
export * from './counter'
```

```tsx
// components/counter/counter.test.tsx
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { Counter } from './counter'

describe('Counter', () => {
  test('should render with initial state of 1', async () => {
    renderCounter()

    expect(await screen.findByText(/^1$/)).toBeInTheDocument()
    expect(
      await screen.findByRole('button', { name: /one up/i }),
    ).toBeInTheDocument()
  })

  test('should increase count by clicking a button', async () => {
    const user = userEvent.setup()

    renderCounter()

    expect(await screen.findByText(/^1$/)).toBeInTheDocument()

    await act(async () => {
      await user.click(await screen.findByRole('button', { name: /one up/i }))
    })

    expect(await screen.findByText(/^2$/)).toBeInTheDocument()
  })
})

const renderCounter = () => {
  return render(<Counter />)
}
```

```tsx
// components/counter-with-context/counter-with-context.tsx
import {
  CounterStoreProvider,
  useCounterStoreContext,
} from '../../stores/use-counter-store-context'

const Counter = () => {
  const { count, inc } = useCounterStoreContext((state) => state)

  return (
    <div>
      <h2>Counter Store Context</h2>
      <h4>{count}</h4>
      <button onClick={inc}>One Up</button>
    </div>
  )
}

export const CounterWithContext = () => {
  return (
    <CounterStoreProvider>
      <Counter />
    </CounterStoreProvider>
  )
}
```

```tsx
// components/counter-with-context/index.ts
export * from './counter-with-context'
```

```tsx
// components/counter-with-context/counter-with-context.test.tsx
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { CounterWithContext } from './counter-with-context'

describe('CounterWithContext', () => {
  test('should render with initial state of 1', async () => {
    renderCounterWithContext()

    expect(await screen.findByText(/^1$/)).toBeInTheDocument()
    expect(
      await screen.findByRole('button', { name: /one up/i }),
    ).toBeInTheDocument()
  })

  test('should increase count by clicking a button', async () => {
    const user = userEvent.setup()

    renderCounterWithContext()

    expect(await screen.findByText(/^1$/)).toBeInTheDocument()

    await act(async () => {
      await user.click(await screen.findByRole('button', { name: /one up/i }))
    })

    expect(await screen.findByText(/^2$/)).toBeInTheDocument()
  })
})

const renderCounterWithContext = () => {
  return render(<CounterWithContext />)
}
```

> **Note**: without [globals configuration](https://vitest.dev/config/#globals) enabled, we need
> to add `import { describe, test, expect } from 'vitest'` at the top of each test file.

**CodeSandbox Demos**

- Jest Demo: https://codesandbox.io/p/sandbox/zustand-jest-demo-twkypn
- Vitest Demo: https://codesandbox.io/p/sandbox/zustand-vitest-demo-ph5gnj

## References

- **React Testing Library**: [React Testing Library (RTL)](https://testing-library.com/docs/react-testing-library/intro)
  is a very lightweight solution for testing React components. It provides utility functions on top
  of `react-dom` and `react-dom/test-utils`, in a way that encourages better testing practices. Its
  primary guiding principle is: "The more your tests resemble the way your software is used, the
  more confidence they can give you."
- **Native Testing Library**: [Native Testing Library (RNTL)](https://testing-library.com/docs/react-native-testing-library/intro)
  is a very lightweight solution for testing React Native components, similarly to RTL, but its
  functions are built on top of `react-test-renderer`.
- **Testing Implementation Details**: Blog post by Kent C. Dodds on why he recommends to avoid
  [testing implementation details](https://kentcdodds.com/blog/testing-implementation-details).
