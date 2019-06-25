import React from 'react'
import { act } from 'react-dom/test-utils'
import {
  cleanup,
  fireEvent,
  render,
  waitForElement,
} from '@testing-library/react'
import create, {
  shallowEqual,
  GetState,
  PartialState,
  SetState,
  State,
  StateListener,
  StateSelector,
  StoreApi,
  Subscribe,
  UseStore,
} from '../src/index'
import { devtools, redux } from '../src/middleware'
afterEach(cleanup)

it('creates a store hook and api object', () => {
  const result = create(() => ({ value: null }))
  expect(result).toMatchInlineSnapshot(`
    Array [
      [Function],
      Object {
        "destroy": [Function],
        "getState": [Function],
        "setState": [Function],
        "subscribe": [Function],
      },
    ]
  `)
})

it('updates the store', async () => {
  const [useStore] = create(set => ({
    count: 1,
    inc: () => set(state => ({ count: state.count + 1 })),
    dec: () => set(state => ({ count: state.count - 1 })),
  }))

  function Counter() {
    const { count, dec } = useStore()
    React.useEffect(dec, [])
    return <div>count: {count}</div>
  }

  const { getByText } = render(<Counter />)

  await waitForElement(() => getByText('count: 0'))
})

it('can subscribe to part of the store', async () => {
  const [useStore] = create(set => ({
    count: 1,
    inc: () => set(state => ({ count: state.count + 1 })),
    dec: () => set(state => ({ count: state.count - 1 })),
  }))
  let counterRenderCount = 0
  let controlsRenderCount = 0

  function Counter() {
    const count = useStore(state => state.count)
    counterRenderCount++
    return <div>{count}</div>
  }

  function Controls() {
    const inc = useStore(state => state.inc)
    controlsRenderCount++
    return <button onClick={inc}>button</button>
  }

  const { getByText } = render(
    <>
      <Counter />
      <Controls />
    </>
  )

  fireEvent.click(getByText('button'))

  await waitForElement(() => getByText('2'))

  expect(counterRenderCount).toBe(2)
  expect(controlsRenderCount).toBe(1)
})

it('can get the store', () => {
  const [, { getState }] = create((set, get) => ({
    value: 1,
    getState1: () => get(),
    getState2: () => getState(),
  }))

  expect(getState().getState1().value).toBe(1)
  expect(getState().getState2().value).toBe(1)
})

it('can set the store', () => {
  const [, { getState, setState }] = create(set => ({
    value: 1,
    setState1: v => set(v),
    setState2: v => setState(v),
  }))

  getState().setState1({ ...getState(), value: 2 })
  expect(getState().value).toBe(2)
  getState().setState2({ ...getState(), value: 3 })
  expect(getState().value).toBe(3)
})

it('can subscribe to the store', () => {
  const initialState = { value: 1, other: 'a' }
  const [, { setState, getState, subscribe }] = create(() => initialState)

  // Should not be called if new state identity is the same
  let unsub = subscribe(() => {
    throw new Error('subscriber called when new state identity is the same')
  })
  setState(initialState)
  unsub()

  // Should be called even if shallow equal when no selector used
  unsub = subscribe(newState => {
    expect(newState.value).toBe(1)
  })
  setState({ ...getState() })
  unsub()

  // Should be called when state changes
  unsub = subscribe(newState => {
    expect(newState.value).toBe(2)
  })
  setState({ value: 2 })
  unsub()

  // Should not be called with selector if shallow equal
  unsub = subscribe(
    state => state.value,
    () => {
      throw new Error('subscriber called when shallow equal and selector used')
    }
  )
  setState({ ...getState() })
  unsub()

  // Should not be called with selector if non-selected part changes
  unsub = subscribe(
    state => state.value,
    () => {
      throw new Error('subscriber called when non-selected part changed')
    }
  )
  setState({ other: 'b' })
  unsub()

  // Should be called with selector if selected part changes
  unsub = subscribe(
    state => state.value,
    newValue => {
      expect(newValue).toBe(3)
    }
  )
  setState({ value: 3 })
  unsub()
})

it('can destroy the store', () => {
  const [, { destroy, getState, setState, subscribe }] = create(() => ({
    value: 1,
  }))

  subscribe(() => {
    throw new Error('did not clear listener on destroy')
  })
  destroy()

  // should this throw?
  setState({ value: 2 })
  expect(getState().value).toEqual(2)
})

it('can update the selector even when the store does not change', async () => {
  const [useStore] = create(() => ({
    one: 'one',
    two: 'two',
  }))

  function Component({ selector }) {
    return <div>{useStore(selector)}</div>
  }

  const { getByText, rerender } = render(<Component selector={s => s.one} />)
  await waitForElement(() => getByText('one'))

  rerender(<Component selector={s => s.two} />)
  await waitForElement(() => getByText('two'))
})

it('can pass optional dependencies to restrict selector calls', () => {
  const [useStore] = create(() => ({}))
  let selectorCallCount = 0

  function Component({ deps }) {
    const sel = React.useCallback(() => {
      selectorCallCount++
    }, deps)
    useStore(sel, deps)
    return <div>{selectorCallCount}</div>
  }

  const { rerender } = render(<Component deps={[true]} />)
  expect(selectorCallCount).toBe(2)

  rerender(<Component deps={[true]} />)
  expect(selectorCallCount).toBe(2)

  rerender(<Component deps={[false]} />)
  expect(selectorCallCount).toBe(3)
})

it('can update state without updating dependencies', async () => {
  const [useStore, { setState }] = create(() => ({ value: 0 }))

  function Component() {
    const sel = React.useCallback(state => state, [])
    const { value } = useStore(sel)
    return <div>value: {value}</div>
  }

  const { getByText } = render(<Component />)
  await waitForElement(() => getByText('value: 0'))

  act(() => {
    setState({ value: 1 })
  })
  await waitForElement(() => getByText('value: 1'))
})

it('can fetch multiple entries with shallow equality', async () => {
  const [useStore, { setState }] = create(() => ({ a: 0, b: 0, c: 0 }))

  let renderCount = 0
  function Component() {
    renderCount++
    const { a, b } = useStore(
      state => ({ a: state.a, b: state.b }),
      shallowEqual
    )
    return (
      <div>
        a: {a} b: {b}
      </div>
    )
  }

  const { getByText } = render(<Component />)
  await waitForElement(() => getByText('a: 0 b: 0'))

  act(() => {
    setState({ a: 1, b: 1 })
  })
  await waitForElement(() => getByText('a: 1 b: 1'))

  act(() => {
    setState({ c: 1 })
  })
  //await waitForElement(() => getByText('a: 1 b: 1'))

  expect(renderCount).toBe(2)
})

it('can use exposed types', () => {
  interface ExampleState extends State {
    num: number
    numGet: () => number
    numGetState: () => number
    numSet: (v: number) => void
    numSetState: (v: number) => void
  }

  const listener: StateListener<ExampleState> = state => {
    const value = state.num * state.numGet() * state.numGetState()
    state.numSet(value)
    state.numSetState(value)
  }
  const selector: StateSelector<ExampleState, number> = state => state.num
  const partial: PartialState<ExampleState> = { num: 2, numGet: () => 2 }
  const partialFn: PartialState<ExampleState> = state => ({ num: 2, ...state })

  const [useStore, storeApi] = create<ExampleState>((set, get) => ({
    num: 1,
    numGet: () => get().num,
    numGetState: () => {
      // TypeScript can't get the type of storeApi when it trys to enforce the signature of numGetState.
      // Need to explicitly state the type of storeApi.getState().num or storeApi type will be type 'any'.
      const result: number = storeApi.getState().num
      return result
    },
    numSet: v => {
      set({ num: v })
    },
    numSetState: v => {
      storeApi.setState({ num: v })
    },
  }))

  function checkAllTypes(
    getState: GetState<ExampleState>,
    partialState: PartialState<ExampleState>,
    setState: SetState<ExampleState>,
    state: State,
    stateListener: StateListener<ExampleState>,
    stateSelector: StateSelector<ExampleState, number>,
    storeApi: StoreApi<ExampleState>,
    subscribe: Subscribe<ExampleState>,
    useStore: UseStore<ExampleState>
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
    useStore
  )
})

describe('redux dev tools middleware', () => {
  const consoleWarn = console.warn

  afterEach(() => {
    cleanup()
    console.warn = consoleWarn
  })

  it('can warn when trying to use redux devtools without extension', () => {
    const initialState = { count: 0 }
    const types = { increase: 'INCREASE', decrease: 'DECREASE' }
    const reducer = (state, { type, by }) => {
      switch (type) {
        case types.increase:
          return { count: state.count + by }
        case types.decrease:
          return { count: state.count - by }
      }
    }

    console.warn = jest.fn(console.warn)
    const [useStore, api] = create(devtools(redux(reducer, initialState)))

    expect(console.warn).toBeCalled()
  })
})
