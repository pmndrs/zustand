import { Component as ClassComponent, useEffect, useState } from 'react'
import { render } from '@testing-library/react'
import create from 'zustand'
import createContext from 'zustand/context'

type CounterState = {
  count: number
  inc: () => void
}

it('creates and uses context store', async () => {
  const { Provider, useStore } = createContext<CounterState>()

  const createStore = () =>
    create<CounterState>((set) => ({
      count: 0,
      inc: () => set((state) => ({ count: state.count + 1 })),
    }))

  function Counter() {
    const { count, inc } = useStore()
    useEffect(inc, [inc])
    return <div>count: {count * 1}</div>
  }

  const { findByText } = render(
    <Provider createStore={createStore}>
      <Counter />
    </Provider>
  )

  await findByText('count: 1')
})

it('uses context store with selectors', async () => {
  const { Provider, useStore } = createContext<CounterState>()

  const createStore = () =>
    create<CounterState>((set) => ({
      count: 0,
      inc: () => set((state) => ({ count: state.count + 1 })),
    }))

  function Counter() {
    const count = useStore((state) => state.count)
    const inc = useStore((state) => state.inc)
    useEffect(inc, [inc])
    return <div>count: {count * 1}</div>
  }

  const { findByText } = render(
    <Provider createStore={createStore}>
      <Counter />
    </Provider>
  )

  await findByText('count: 1')
})

it('uses context store api', async () => {
  const { Provider, useStoreApi } = createContext<CounterState>()

  const createStore = () =>
    create<CounterState>((set) => ({
      count: 0,
      inc: () => set((state) => ({ count: state.count + 1 })),
    }))

  function Counter() {
    const storeApi = useStoreApi()
    const [count, setCount] = useState(0)
    useEffect(
      () =>
        storeApi.subscribe(
          () => setCount(storeApi.getState().count),
          (state) => state.count
        ),
      [storeApi]
    )
    useEffect(() => {
      storeApi.setState({ count: storeApi.getState().count + 1 })
    }, [storeApi])
    useEffect(() => {
      if (count === 1) {
        storeApi.destroy()
        storeApi.setState({ count: storeApi.getState().count + 1 })
      }
    }, [storeApi, count])
    return <div>count: {count * 1}</div>
  }

  const { findByText } = render(
    <Provider createStore={createStore}>
      <Counter />
    </Provider>
  )

  await findByText('count: 1')
})

it('throws error when not using provider', async () => {
  console.error = jest.fn()

  class ErrorBoundary extends ClassComponent<{}, { hasError: boolean }> {
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

  const { useStore } = createContext<CounterState>()
  function Component() {
    useStore()
    return <div>no error</div>
  }

  const { findByText } = render(
    <ErrorBoundary>
      <Component />
    </ErrorBoundary>
  )
  await findByText('errored')
})
