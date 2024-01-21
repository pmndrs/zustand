import {
  Component as ClassComponent,
  ReactNode,
  StrictMode,
  useEffect,
  useLayoutEffect,
  useState,
} from 'react'
import { act, fireEvent, render } from '@testing-library/react'
import ReactDOM from 'react-dom'
import { afterEach, expect, it, vi } from 'vitest'
import { create } from 'zustand'
import type { StoreApi } from 'zustand'
import { createWithEqualityFn } from 'zustand/traditional'

const consoleError = console.error
afterEach(() => {
  console.error = consoleError
})

it('creates a store hook and api object', () => {
  let params
  const result = create((...args) => {
    params = args
    return { value: null }
  })
  expect({ params, result }).toMatchInlineSnapshot(`
    {
      "params": [
        [Function],
        [Function],
        {
          "getInitialState": [Function],
          "getState": [Function],
          "setState": [Function],
          "subscribe": [Function],
        },
      ],
      "result": [Function],
    }
  `)
})

type CounterState = {
  count: number
  inc: () => void
}

it('uses the store with no args', async () => {
  const useBoundStore = create<CounterState>((set) => ({
    count: 0,
    inc: () => set((state) => ({ count: state.count + 1 })),
  }))

  function Counter() {
    const { count, inc } = useBoundStore()
    useEffect(inc, [inc])
    return <div>count: {count}</div>
  }

  const { findByText } = render(
    <>
      <Counter />
    </>,
  )

  await findByText('count: 1')
})

it('uses the store with selectors', async () => {
  const useBoundStore = create<CounterState>((set) => ({
    count: 0,
    inc: () => set((state) => ({ count: state.count + 1 })),
  }))

  function Counter() {
    const count = useBoundStore((s) => s.count)
    const inc = useBoundStore((s) => s.inc)
    useEffect(inc, [inc])
    return <div>count: {count}</div>
  }

  const { findByText } = render(
    <>
      <Counter />
    </>,
  )

  await findByText('count: 1')
})

it('uses the store with a selector and equality checker', async () => {
  const useBoundStore = createWithEqualityFn(
    () => ({ item: { value: 0 } }),
    Object.is,
  )
  const { setState } = useBoundStore
  let renderCount = 0

  function Component() {
    // Prevent re-render if new value === 1.
    const item = useBoundStore(
      (s) => s.item,
      (_, newItem) => newItem.value === 1,
    )
    return (
      <div>
        renderCount: {++renderCount}, value: {item.value}
      </div>
    )
  }

  const { findByText } = render(
    <>
      <Component />
    </>,
  )

  await findByText('renderCount: 1, value: 0')

  // This will not cause a re-render.
  act(() => setState({ item: { value: 1 } }))
  await findByText('renderCount: 1, value: 0')

  // This will cause a re-render.
  act(() => setState({ item: { value: 2 } }))
  await findByText('renderCount: 2, value: 2')
})

it('only re-renders if selected state has changed', async () => {
  const useBoundStore = create<CounterState>((set) => ({
    count: 0,
    inc: () => set((state) => ({ count: state.count + 1 })),
  }))
  let counterRenderCount = 0
  let controlRenderCount = 0

  function Counter() {
    const count = useBoundStore((state) => state.count)
    counterRenderCount++
    return <div>count: {count}</div>
  }

  function Control() {
    const inc = useBoundStore((state) => state.inc)
    controlRenderCount++
    return <button onClick={inc}>button</button>
  }

  const { getByText, findByText } = render(
    <>
      <Counter />
      <Control />
    </>,
  )

  fireEvent.click(getByText('button'))

  await findByText('count: 1')

  expect(counterRenderCount).toBe(2)
  expect(controlRenderCount).toBe(1)
})

it('can batch updates', async () => {
  const useBoundStore = create<CounterState>((set) => ({
    count: 0,
    inc: () => set((state) => ({ count: state.count + 1 })),
  }))

  function Counter() {
    const { count, inc } = useBoundStore()
    useEffect(() => {
      ReactDOM.unstable_batchedUpdates(() => {
        inc()
        inc()
      })
    }, [inc])
    return <div>count: {count}</div>
  }

  const { findByText } = render(
    <>
      <Counter />
    </>,
  )

  await findByText('count: 2')
})

it('can update the selector', async () => {
  type State = { one: string; two: string }
  type Props = { selector: (state: State) => string }
  const useBoundStore = create<State>(() => ({
    one: 'one',
    two: 'two',
  }))

  function Component({ selector }: Props) {
    return <div>{useBoundStore(selector)}</div>
  }

  const { findByText, rerender } = render(
    <StrictMode>
      <Component selector={(s) => s.one} />
    </StrictMode>,
  )
  await findByText('one')

  rerender(
    <StrictMode>
      <Component selector={(s) => s.two} />
    </StrictMode>,
  )
  await findByText('two')
})

it('can update the equality checker', async () => {
  type State = { value: number }
  type Props = { equalityFn: (a: State, b: State) => boolean }
  const useBoundStore = createWithEqualityFn<State>(
    () => ({ value: 0 }),
    Object.is,
  )
  const { setState } = useBoundStore
  const selector = (s: State) => s

  let renderCount = 0
  function Component({ equalityFn }: Props) {
    const { value } = useBoundStore(selector, equalityFn)
    return (
      <div>
        renderCount: {++renderCount}, value: {value}
      </div>
    )
  }

  // Set an equality checker that always returns false to always re-render.
  const { findByText, rerender } = render(
    <>
      <Component equalityFn={() => false} />
    </>,
  )

  // This will cause a re-render due to the equality checker.
  act(() => setState({ value: 0 }))
  await findByText('renderCount: 2, value: 0')

  // Set an equality checker that always returns true to never re-render.
  rerender(
    <>
      <Component equalityFn={() => true} />
    </>,
  )

  // This will NOT cause a re-render due to the equality checker.
  act(() => setState({ value: 1 }))
  await findByText('renderCount: 3, value: 0')
})

it('can call useBoundStore with progressively more arguments', async () => {
  type State = { value: number }
  type Props = {
    selector?: (state: State) => number
    equalityFn?: (a: number, b: number) => boolean
  }

  const useBoundStore = createWithEqualityFn<State>(
    () => ({ value: 0 }),
    Object.is,
  )
  const { setState } = useBoundStore

  let renderCount = 0
  function Component({ selector, equalityFn }: Props) {
    const value = useBoundStore(selector as any, equalityFn)
    return (
      <div>
        renderCount: {++renderCount}, value: {JSON.stringify(value)}
      </div>
    )
  }

  // Render with no args.
  const { findByText, rerender } = render(
    <>
      <Component />
    </>,
  )
  await findByText('renderCount: 1, value: {"value":0}')

  // Render with selector.
  rerender(
    <>
      <Component selector={(s) => s.value} />
    </>,
  )
  await findByText('renderCount: 2, value: 0')

  // Render with selector and equality checker.
  rerender(
    <>
      <Component
        selector={(s) => s.value}
        equalityFn={(oldV, newV) => oldV > newV}
      />
    </>,
  )

  // Should not cause a re-render because new value is less than previous.
  act(() => setState({ value: -1 }))
  await findByText('renderCount: 3, value: 0')

  act(() => setState({ value: 1 }))
  await findByText('renderCount: 4, value: 1')
})

it('can throw an error in selector', async () => {
  console.error = vi.fn()
  type State = { value: string | number }

  const initialState: State = { value: 'foo' }
  const useBoundStore = create<State>(() => initialState)
  const { setState } = useBoundStore
  const selector = (s: State) =>
    // @ts-expect-error This function is supposed to throw an error
    s.value.toUpperCase()

  class ErrorBoundary extends ClassComponent<
    { children?: ReactNode | undefined },
    { hasError: boolean }
  > {
    constructor(props: { children?: ReactNode | undefined }) {
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
    useBoundStore(selector)
    return <div>no error</div>
  }

  const { findByText } = render(
    <StrictMode>
      <ErrorBoundary>
        <Component />
      </ErrorBoundary>
    </StrictMode>,
  )
  await findByText('no error')

  act(() => {
    setState({ value: 123 })
  })
  await findByText('errored')
})

it('can throw an error in equality checker', async () => {
  console.error = vi.fn()
  type State = { value: string | number }

  const initialState: State = { value: 'foo' }
  const useBoundStore = createWithEqualityFn(() => initialState, Object.is)
  const { setState } = useBoundStore
  const selector = (s: State) => s
  const equalityFn = (a: State, b: State) =>
    // @ts-expect-error This function is supposed to throw an error
    a.value.trim() === b.value.trim()

  class ErrorBoundary extends ClassComponent<
    { children?: ReactNode | undefined },
    { hasError: boolean }
  > {
    constructor(props: { children?: ReactNode | undefined }) {
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
    useBoundStore(selector, equalityFn)
    return <div>no error</div>
  }

  const { findByText } = render(
    <StrictMode>
      <ErrorBoundary>
        <Component />
      </ErrorBoundary>
    </StrictMode>,
  )
  await findByText('no error')

  act(() => {
    setState({ value: 123 })
  })
  await findByText('errored')
})

it('can get the store', () => {
  type State = {
    value: number
    getState1: () => State
    getState2: () => State
  }
  const { getState } = create<State>((_, get) => ({
    value: 1,
    getState1: () => get(),
    getState2: (): State => getState(),
  }))

  expect(getState().getState1().value).toBe(1)
  expect(getState().getState2().value).toBe(1)
})

it('can set the store', () => {
  type State = {
    value: number
    setState1: StoreApi<State>['setState']
    setState2: StoreApi<State>['setState']
  }

  const { setState, getState } = create<State>((set) => ({
    value: 1,
    setState1: (v) => set(v),
    setState2: (v) => setState(v),
  }))

  getState().setState1({ value: 2 })
  expect(getState().value).toBe(2)
  getState().setState2({ value: 3 })
  expect(getState().value).toBe(3)
  getState().setState1((s) => ({ value: ++s.value }))
  expect(getState().value).toBe(4)
  getState().setState2((s) => ({ value: ++s.value }))
  expect(getState().value).toBe(5)
})

it('both NaN should not update', () => {
  const { setState, subscribe } = create<number>(() => NaN)

  const fn = vi.fn()
  subscribe(fn)

  setState(NaN)

  expect(fn).not.toBeCalled()
})

it('can set the store without merging', () => {
  const { setState, getState } = create<{ a: number } | { b: number }>(
    (_set) => ({
      a: 1,
    }),
  )

  // Should override the state instead of merging.
  setState({ b: 2 }, true)
  expect(getState()).toEqual({ b: 2 })
})

it('only calls selectors when necessary', async () => {
  type State = { a: number; b: number }
  const useBoundStore = create<State>(() => ({ a: 0, b: 0 }))
  const { setState } = useBoundStore
  let inlineSelectorCallCount = 0
  let staticSelectorCallCount = 0

  function staticSelector(s: State) {
    staticSelectorCallCount++
    return s.a
  }

  function Component() {
    useBoundStore((s) => (inlineSelectorCallCount++, s.b))
    useBoundStore(staticSelector)
    return (
      <>
        <div>inline: {inlineSelectorCallCount}</div>
        <div>static: {staticSelectorCallCount}</div>
      </>
    )
  }

  const { rerender, findByText } = render(
    <>
      <Component />
    </>,
  )
  await findByText('inline: 1')
  await findByText('static: 1')

  rerender(
    <>
      <Component />
    </>,
  )
  await findByText('inline: 2')
  await findByText('static: 1')

  act(() => setState({ a: 1, b: 1 }))
  await findByText('inline: 4')
  await findByText('static: 2')
})

it('ensures parent components subscribe before children', async () => {
  type State = {
    children: { [key: string]: { text: string } }
  }
  type Props = { id: string }
  const useBoundStore = create<State>(() => ({
    children: {
      '1': { text: 'child 1' },
      '2': { text: 'child 2' },
    },
  }))
  const api = useBoundStore

  function changeState() {
    api.setState({
      children: {
        '3': { text: 'child 3' },
      },
    })
  }

  function Child({ id }: Props) {
    const text = useBoundStore((s) => s.children[id]?.text)
    return <div>{text}</div>
  }

  function Parent() {
    const childStates = useBoundStore((s) => s.children)
    return (
      <>
        <button onClick={changeState}>change state</button>
        {Object.keys(childStates).map((id) => (
          <Child id={id} key={id} />
        ))}
      </>
    )
  }

  const { getByText, findByText } = render(
    <StrictMode>
      <Parent />
    </StrictMode>,
  )

  fireEvent.click(getByText('change state'))

  await findByText('child 3')
})

// https://github.com/pmndrs/zustand/issues/84
it('ensures the correct subscriber is removed on unmount', async () => {
  const useBoundStore = create(() => ({ count: 0 }))
  const api = useBoundStore

  function increment() {
    api.setState(({ count }) => ({ count: count + 1 }))
  }

  function Count() {
    const c = useBoundStore((s) => s.count)
    return <div>count: {c}</div>
  }

  function CountWithInitialIncrement() {
    useLayoutEffect(increment, [])
    return <Count />
  }

  function Component() {
    const [Counter, setCounter] = useState(() => CountWithInitialIncrement)
    useLayoutEffect(() => {
      setCounter(() => Count)
    }, [])
    return (
      <>
        <Counter />
        <Count />
      </>
    )
  }

  const { findAllByText } = render(
    <>
      <Component />
    </>,
  )

  expect((await findAllByText('count: 1')).length).toBe(2)

  act(increment)

  expect((await findAllByText('count: 2')).length).toBe(2)
})

// https://github.com/pmndrs/zustand/issues/86
it('ensures a subscriber is not mistakenly overwritten', async () => {
  const useBoundStore = create(() => ({ count: 0 }))
  const { setState } = useBoundStore

  function Count1() {
    const c = useBoundStore((s) => s.count)
    return <div>count1: {c}</div>
  }

  function Count2() {
    const c = useBoundStore((s) => s.count)
    return <div>count2: {c}</div>
  }

  // Add 1st subscriber.
  const { findAllByText, rerender } = render(
    <StrictMode>
      <Count1 />
    </StrictMode>,
  )

  // Replace 1st subscriber with another.
  rerender(
    <StrictMode>
      <Count2 />
    </StrictMode>,
  )

  // Add 2 additional subscribers.
  rerender(
    <StrictMode>
      <Count2 />
      <Count1 />
      <Count1 />
    </StrictMode>,
  )

  // Call all subscribers
  act(() => setState({ count: 1 }))

  expect((await findAllByText('count1: 1')).length).toBe(2)
  expect((await findAllByText('count2: 1')).length).toBe(1)
})

it('works with non-object state', async () => {
  const useCount = create(() => 1)
  const inc = () => useCount.setState((c) => c + 1)

  const Counter = () => {
    const count = useCount()
    return (
      <>
        <div>count: {count}</div>
        <button onClick={inc}>button</button>
      </>
    )
  }

  const { getByText, findByText } = render(
    <StrictMode>
      <Counter />
    </StrictMode>,
  )

  await findByText('count: 1')

  fireEvent.click(getByText('button'))
  await findByText('count: 2')
})

it('works with "undefined" state', async () => {
  const useUndefined = create(() => undefined)

  const Component = () => {
    const str = useUndefined((v) => v || 'undefined')
    return <div>str: {str}</div>
  }

  const { findByText } = render(
    <StrictMode>
      <Component />
    </StrictMode>,
  )

  await findByText('str: undefined')
})
