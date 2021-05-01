import React from 'react'
import { cleanup, render } from '@testing-library/react'
import { StateCreator } from '../src/index'
import createContext, {
  Provider as DefaultProvider,
  useStore as useDefaultStore,
} from '../src/context'

const consoleError = console.error
afterEach(() => {
  cleanup()
  console.error = consoleError
})

type CounterState = {
  count: number
  inc: () => void
}

it('uses default store with default context', async () => {
  const createParam: StateCreator<CounterState> = (set) => ({
    count: 0,
    inc: () => set((state) => ({ count: state.count + 1 })),
  })

  function Counter() {
    const { count, inc } = useDefaultStore()
    React.useEffect(inc, [inc])
    return <div>count: {count}</div>
  }

  const { findByText } = render(
    <DefaultProvider createState={createParam}>
      <Counter />
    </DefaultProvider>
  )

  await findByText('count: 1')
})

it('creates and uses context store', async () => {
  const { Provider, useStore } = createContext<CounterState>()

  const createParam: StateCreator<CounterState> = (set) => ({
    count: 0,
    inc: () => set((state) => ({ count: state.count + 1 })),
  })

  function Counter() {
    const { count, inc } = useStore()
    React.useEffect(inc, [inc])
    return <div>count: {count}</div>
  }

  const { findByText } = render(
    <Provider createState={createParam}>
      <Counter />
    </Provider>
  )

  await findByText('count: 1')
})

it('throws error when not using provider', async () => {
  console.error = jest.fn()

  class ErrorBoundary extends React.Component<{}, { hasError: boolean }> {
    constructor(props: {}) {
      super(props)
      this.state = { hasError: false }
    }
    static getDerivedStateFromError() {
      return { hasError: true }
    }
    render() {
      return this.state.hasError ? <div>errored</div> : this.props.children
    }
  }

  function Component() {
    useDefaultStore()
    return <div>no error</div>
  }

  const { findByText } = render(
    <ErrorBoundary>
      <Component />
    </ErrorBoundary>
  )
  await findByText('errored')
})
