import React from 'react'
import ReactDOM from 'react-dom'
import { act, cleanup, fireEvent, render } from '@testing-library/react'
import create, {
  State,
  StateListener,
  StateSelector,
  PartialState,
  EqualityChecker,
  StateCreator,
  SetState,
  GetState,
  Subscribe,
  Destroy,
  UseStore,
  StoreApi,
} from '../src/index'
// import { devtools, redux } from '../src/middleware'

const consoleError = console.error
afterEach(() => {
  cleanup()
  console.error = consoleError
})

it('creates a store hook and api object', () => {
  let params
  const result = create((...args) => {
    params = args
    return { value: null }
  })
  expect({ params, result }).toMatchInlineSnapshot(`
    Object {
      "params": Array [
        [Function],
        [Function],
        Object {
          "destroy": [Function],
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
  const useStore = create<CounterState>((set) => ({
    count: 0,
    inc: () => set((state) => ({ count: state.count + 1 })),
  }))

  function Counter() {
    const { count, inc } = useStore()
    React.useEffect(inc, [inc])
    return <div>count: {count}</div>
  }

  const { findByText } = render(<Counter />)

  await findByText('count: 1')
})

it('uses the store with selectors', async () => {
  const useStore = create<any>((set) => ({
    count: 0,
    inc: () => set((state: any) => ({ count: state.count + 1 })),
  }))

  function Counter() {
    const count = useStore((s) => s.count)
    const inc = useStore((s) => s.inc)
    React.useEffect(inc, [inc])
    return <div>count: {count}</div>
  }

  const { findByText } = render(<Counter />)

  await findByText('count: 1')
})

it('uses the store with a selector and equality checker', async () => {
  const useStore = create(() => ({ item: { value: 0 } }))
  const { setState } = useStore
  let renderCount = 0

  function Component() {
    // Prevent re-render if new value === 1.
    const item = useStore(
      (s) => s.item,
      (_, newItem) => newItem.value === 1
    )
    return (
      <div>
        renderCount: {++renderCount}, value: {item.value}
      </div>
    )
  }

  const { findByText } = render(<Component />)

  await findByText('renderCount: 1, value: 0')

  // This will not cause a re-render.
  act(() => setState({ item: { value: 1 } }))
  await findByText('renderCount: 1, value: 0')

  // This will cause a re-render.
  act(() => setState({ item: { value: 2 } }))
  await findByText('renderCount: 2, value: 2')
})

it('only re-renders if selected state has changed', async () => {
  const useStore = create<any>((set) => ({
    count: 0,
    inc: () => set((state: any) => ({ count: state.count + 1 })),
  }))
  let counterRenderCount = 0
  let controlRenderCount = 0

  function Counter() {
    const count = useStore((state) => state.count)
    counterRenderCount++
    return <div>count: {count}</div>
  }

  function Control() {
    const inc = useStore((state) => state.inc)
    controlRenderCount++
    return <button onClick={inc}>button</button>
  }

  const { getByText, findByText } = render(
    <>
      <Counter />
      <Control />
    </>
  )

  fireEvent.click(getByText('button'))

  await findByText('count: 1')

  expect(counterRenderCount).toBe(2)
  expect(controlRenderCount).toBe(1)
})

it('re-renders with useLayoutEffect', async () => {
  const useStore = create(() => ({ state: false }))

  function Component() {
    const { state } = useStore()
    React.useLayoutEffect(() => {
      useStore.setState({ state: true })
    }, [])
    return <>{`${state}`}</>
  }

  const container = document.createElement('div')
  ReactDOM.render(<Component />, container)
  expect(container.innerHTML).toBe('true')
  ReactDOM.unmountComponentAtNode(container)
})

it('can batch updates', async () => {
  const useStore = create<any>((set) => ({
    count: 0,
    inc: () => set((state: any) => ({ count: state.count + 1 })),
  }))

  function Counter() {
    const { count, inc } = useStore()
    React.useEffect(() => {
      ReactDOM.unstable_batchedUpdates(() => {
        inc()
        inc()
      })
    }, [inc])
    return <div>count: {count}</div>
  }

  const { findByText } = render(<Counter />)

  await findByText('count: 2')
})

it('can update the selector', async () => {
  const useStore = create(() => ({
    one: 'one',
    two: 'two',
  }))

  function Component({ selector }: any) {
    return <div>{useStore(selector)}</div>
  }

  const { findByText, rerender } = render(
    <Component selector={(s: any) => s.one} />
  )
  await findByText('one')

  rerender(<Component selector={(s: any) => s.two} />)
  await findByText('two')
})

it('can update the equality checker', async () => {
  const useStore = create(() => ({ value: 0 }))
  const { setState } = useStore
  const selector = (s: any) => s.value

  let renderCount = 0
  function Component({ equalityFn }: any) {
    const value = useStore(selector, equalityFn)
    return (
      <div>
        renderCount: {++renderCount}, value: {value}
      </div>
    )
  }

  // Set an equality checker that always returns false to always re-render.
  const { findByText, rerender } = render(
    <Component equalityFn={() => false} />
  )

  // This will cause a re-render due to the equality checker.
  act(() => setState({ value: 0 }))
  await findByText('renderCount: 2, value: 0')

  // Set an equality checker that always returns true to never re-render.
  rerender(<Component equalityFn={() => true} />)

  // This will NOT cause a re-render due to the equality checker.
  act(() => setState({ value: 1 }))
  await findByText('renderCount: 3, value: 0')
})

it('can call useStore with progressively more arguments', async () => {
  const useStore = create(() => ({ value: 0 }))
  const { setState } = useStore

  let renderCount = 0
  function Component({ selector, equalityFn }: any) {
    const value = useStore(selector, equalityFn)
    return (
      <div>
        renderCount: {++renderCount}, value: {JSON.stringify(value)}
      </div>
    )
  }

  // Render with no args.
  const { findByText, rerender } = render(<Component />)
  await findByText('renderCount: 1, value: {"value":0}')

  // Render with selector.
  rerender(<Component selector={(s: any) => s.value} />)
  await findByText('renderCount: 2, value: 0')

  // Render with selector and equality checker.
  rerender(
    <Component
      selector={(s: any) => s.value}
      equalityFn={(oldV: any, newV: any) => oldV > newV}
    />
  )

  // Should not cause a re-render because new value is less than previous.
  act(() => setState({ value: -1 }))
  await findByText('renderCount: 3, value: 0')

  act(() => setState({ value: 1 }))
  await findByText('renderCount: 4, value: 1')
})

it('can throw an error in selector', async () => {
  console.error = jest.fn()

  const initialState: { value?: string } = { value: 'foo' }
  const useStore = create(() => initialState)
  const { setState } = useStore
  const selector = (s: any) => s.value.toUpperCase()

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
    useStore(selector)
    return <div>no error</div>
  }

  const { findByText } = render(
    <ErrorBoundary>
      <Component />
    </ErrorBoundary>
  )
  await findByText('no error')

  delete initialState.value
  act(() => {
    setState({})
  })
  await findByText('errored')
})

it('can throw an error in equality checker', async () => {
  console.error = jest.fn()

  const initialState: { value?: string } = { value: 'foo' }
  const useStore = create(() => initialState)
  const { setState } = useStore
  const selector = (s: any) => s
  const equalityFn = (a: any, b: any) => a.value.trim() === b.value.trim()

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
    useStore(selector, equalityFn)
    return <div>no error</div>
  }

  const { findByText } = render(
    <ErrorBoundary>
      <Component />
    </ErrorBoundary>
  )
  await findByText('no error')

  delete initialState.value
  act(() => {
    setState({})
  })
  await findByText('errored')
})

it('can get the store', () => {
  const { getState } = create<any>((_, get) => ({
    value: 1,
    getState1: () => get(),
    getState2: () => getState(),
  }))

  expect(getState().getState1().value).toBe(1)
  expect(getState().getState2().value).toBe(1)
})

it('can set the store', () => {
  const { setState, getState } = create<any>((set) => ({
    value: 1,
    setState1: (v: any) => set(v),
    setState2: (v: any) => setState(v),
  }))

  getState().setState1({ value: 2 })
  expect(getState().value).toBe(2)
  getState().setState2({ value: 3 })
  expect(getState().value).toBe(3)
  getState().setState1((s: any) => ({ value: ++s.value }))
  expect(getState().value).toBe(4)
  getState().setState2((s: any) => ({ value: ++s.value }))
  expect(getState().value).toBe(5)
})

it('can set the store without merging', () => {
  const { setState, getState } = create((_set) => ({
    a: 1,
  }))

  // Should override the state instead of merging.
  setState({ b: 2 }, true)
  expect(getState()).toEqual({ b: 2 })
})

it('can subscribe to the store', () => {
  const initialState = { value: 1, other: 'a' }
  const { setState, getState, subscribe } = create(() => initialState)
  const listener = jest.fn()

  // Should not be called if new state identity is the same
  let unsub = subscribe(() => {
    throw new Error('subscriber called when new state identity is the same')
  })
  setState(initialState)
  unsub()

  // Should be called if new state identity is different
  unsub = subscribe((newState: { value: number; other: string } | null) => {
    expect(newState && newState.value).toBe(1)
  })
  setState({ ...getState() })
  unsub()

  // Should not be called when state slice is the same
  unsub = subscribe(
    () => {
      throw new Error('subscriber called when new state is the same')
    },
    (s) => s.value
  )
  setState({ other: 'b' })
  unsub()

  // Should be called when state slice changes
  listener.mockReset()
  unsub = subscribe(listener, (s) => s.value)
  setState({ value: initialState.value + 1 })
  unsub()
  expect(listener).toHaveBeenCalledTimes(1)
  expect(listener).toHaveBeenCalledWith(
    initialState.value + 1,
    initialState.value
  )

  // Should not be called when equality checker returns true
  unsub = subscribe(
    () => {
      throw new Error('subscriber called when equality checker returned true')
    },
    undefined as any,
    () => true
  )
  setState({ value: initialState.value + 2 })
  unsub()

  // Should be called when equality checker returns false
  listener.mockReset()
  unsub = subscribe(
    listener,
    (s) => s.value,
    () => false
  )
  setState({ value: initialState.value + 2 })
  unsub()
  expect(listener).toHaveBeenCalledTimes(1)
  expect(listener).toHaveBeenCalledWith(
    initialState.value + 2,
    initialState.value + 2
  )

  // Should keep consistent behavior with equality check
  const isRoughEqual = (x: number, y: number) => Math.abs(x - y) < 1
  setState({ value: 0 })
  listener.mockReset()
  const listener2 = jest.fn()
  let prevValue = getState().value
  unsub = subscribe((s) => {
    if (isRoughEqual(prevValue, s.value)) {
      // skip assuming values are equal
      return
    }
    listener(s.value, prevValue)
    prevValue = s.value
  })
  const unsub2 = subscribe(listener2, (s) => s.value, isRoughEqual as any)
  setState({ value: 0.5 })
  setState({ value: 1 })
  unsub()
  unsub2()
  expect(listener).toHaveBeenCalledTimes(1)
  expect(listener).toHaveBeenCalledWith(1, 0)
  expect(listener2).toHaveBeenCalledTimes(1)
  expect(listener2).toHaveBeenCalledWith(1, 0)
})

it('can destroy the store', () => {
  const { destroy, getState, setState, subscribe } = create(() => ({
    value: 1,
  }))

  subscribe(() => {
    throw new Error('did not clear listener on destroy')
  })
  destroy()

  setState({ value: 2 })
  expect(getState().value).toEqual(2)
})

it('only calls selectors when necessary', async () => {
  const useStore = create(() => ({ a: 0, b: 0 }))
  const { setState } = useStore
  let inlineSelectorCallCount = 0
  let staticSelectorCallCount = 0

  function staticSelector(s: any) {
    staticSelectorCallCount++
    return s.a
  }

  function Component() {
    useStore((s) => (inlineSelectorCallCount++, s.b))
    useStore(staticSelector)
    return (
      <>
        <div>inline: {inlineSelectorCallCount}</div>
        <div>static: {staticSelectorCallCount}</div>
      </>
    )
  }

  const { rerender, findByText } = render(<Component />)
  await findByText('inline: 1')
  await findByText('static: 1')

  rerender(<Component />)
  await findByText('inline: 2')
  await findByText('static: 1')

  act(() => setState({ a: 1, b: 1 }))
  await findByText('inline: 4')
  await findByText('static: 2')
})

it('ensures parent components subscribe before children', async () => {
  const useStore = create<any>(() => ({
    children: {
      '1': { text: 'child 1' },
      '2': { text: 'child 2' },
    },
  }))
  const api = useStore

  function changeState() {
    api.setState({
      children: {
        '3': { text: 'child 3' },
      },
    })
  }

  function Child({ id }: any) {
    const text = useStore((s) => s.children[id].text)
    return <div>{text}</div>
  }

  function Parent() {
    const childStates = useStore((s) => s.children)
    return (
      <>
        <button onClick={changeState}>change state</button>
        {Object.keys(childStates).map((id) => (
          <Child id={id} key={id} />
        ))}
      </>
    )
  }

  const { getByText, findByText } = render(<Parent />)

  fireEvent.click(getByText('change state'))

  await findByText('child 3')
})

// https://github.com/react-spring/zustand/issues/84
it('ensures the correct subscriber is removed on unmount', async () => {
  const useStore = create(() => ({ count: 0 }))
  const api = useStore

  function increment() {
    api.setState(({ count }) => ({ count: count + 1 }))
  }

  function Count() {
    const c = useStore((s) => s.count)
    return <div>count: {c}</div>
  }

  function CountWithInitialIncrement() {
    React.useLayoutEffect(increment, [])
    return <Count />
  }

  function Component() {
    const [Counter, setCounter] = React.useState(
      () => CountWithInitialIncrement
    )
    React.useLayoutEffect(() => {
      setCounter(() => Count)
    }, [])
    return (
      <>
        <Counter />
        <Count />
      </>
    )
  }

  const { findAllByText } = render(<Component />)

  expect((await findAllByText('count: 1')).length).toBe(2)

  act(increment)

  expect((await findAllByText('count: 2')).length).toBe(2)
})

// https://github.com/react-spring/zustand/issues/86
it('ensures a subscriber is not mistakenly overwritten', async () => {
  const useStore = create(() => ({ count: 0 }))
  const { setState } = useStore

  function Count1() {
    const c = useStore((s) => s.count)
    return <div>count1: {c}</div>
  }

  function Count2() {
    const c = useStore((s) => s.count)
    return <div>count2: {c}</div>
  }

  // Add 1st subscriber.
  const { findAllByText, rerender } = render(<Count1 />)

  // Replace 1st subscriber with another.
  rerender(<Count2 />)

  // Add 2 additional subscribers.
  rerender(
    <>
      <Count2 />
      <Count1 />
      <Count1 />
    </>
  )

  // Call all subscribers
  act(() => setState({ count: 1 }))

  expect((await findAllByText('count1: 1')).length).toBe(2)
  expect((await findAllByText('count2: 1')).length).toBe(1)
})

it('can use exposed types', () => {
  interface ExampleState extends State {
    num: number
    numGet: () => number
    numGetState: () => number
    numSet: (v: number) => void
    numSetState: (v: number) => void
  }

  const listener: StateListener<ExampleState> = (state) => {
    if (state) {
      const value = state.num * state.numGet() * state.numGetState()
      state.numSet(value)
      state.numSetState(value)
    }
  }
  const selector: StateSelector<ExampleState, number> = (state) => state.num
  const partial: PartialState<ExampleState> = { num: 2, numGet: () => 2 }
  const partialFn: PartialState<ExampleState> = (state) => ({
    ...state,
    num: 2,
  })
  const equalityFn: EqualityChecker<ExampleState> = (state, newState) =>
    state !== newState

  const storeApi = create<ExampleState>((set, get) => ({
    num: 1,
    numGet: () => get().num,
    numGetState: () => {
      // TypeScript can't get the type of storeApi when it trys to enforce the signature of numGetState.
      // Need to explicitly state the type of storeApi.getState().num or storeApi type will be type 'any'.
      const result: number = storeApi.getState().num
      return result
    },
    numSet: (v) => {
      set({ num: v })
    },
    numSetState: (v) => {
      storeApi.setState({ num: v })
    },
  }))
  const useStore = storeApi

  const stateCreator: StateCreator<ExampleState> = (set, get) => ({
    num: 1,
    numGet: () => get().num,
    numGetState: () => get().num,
    numSet: (v) => {
      set({ num: v })
    },
    numSetState: (v) => {
      set({ num: v })
    },
  })

  function checkAllTypes(
    _getState: GetState<ExampleState>,
    _partialState: PartialState<ExampleState>,
    _setState: SetState<ExampleState>,
    _state: State,
    _stateListener: StateListener<ExampleState>,
    _stateSelector: StateSelector<ExampleState, number>,
    _storeApi: StoreApi<ExampleState>,
    _subscribe: Subscribe<ExampleState>,
    _destroy: Destroy,
    _equalityFn: EqualityChecker<ExampleState>,
    _stateCreator: StateCreator<ExampleState>,
    _useStore: UseStore<ExampleState>
  ) {
    expect(true).toBeTruthy()
  }

  checkAllTypes(
    storeApi.getState,
    Math.random() > 0.5 ? partial : partialFn,
    storeApi.setState,
    storeApi.getState(),
    listener,
    selector,
    storeApi,
    storeApi.subscribe,
    storeApi.destroy,
    equalityFn,
    stateCreator,
    useStore
  )
})

type AssertEqual<Type, Expected> = Type extends Expected
  ? Expected extends Type
    ? true
    : never
  : never

it('should have correct (partial) types for setState', () => {
  type Count = { count: number }

  const store = create<Count>((set) => ({
    count: 0,
    // @ts-expect-error we shouldn't be able to set count to undefined
    a: () => set(() => ({ count: undefined })),
    // @ts-expect-error we shouldn't be able to set count to undefined
    b: () => set({ count: undefined }),
    c: () => set({ count: 1 }),
  }))

  const setState: AssertEqual<typeof store.setState, SetState<Count>> = true
  expect(setState).toEqual(true)

  // ok, should not error
  store.setState({ count: 1 })
  store.setState({})
  store.setState(() => {})

  // @ts-expect-error type undefined is not assignable to type number
  store.setState({ count: undefined })
  // @ts-expect-error type undefined is not assignable to type number
  store.setState((state) => ({ ...state, count: undefined }))
})
