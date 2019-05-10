import React from 'react'
import {
  cleanup,
  fireEvent,
  render,
  waitForElement,
} from 'react-testing-library'
import create from '../src/index'

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

it('updates the store', () => {
  expect.assertions(2)

  const [useStore] = create(set => ({
    count: 1,
    inc: () => set(state => ({ count: state.count + 1 })),
    dec: () => set(state => ({ count: state.count - 1 })),
  }))
  let renderCount = 0

  function Counter() {
    renderCount++
    const { count, dec } = useStore()

    React.useEffect(dec, [])

    if (renderCount === 1) {
      expect(count).toBe(1)
    } else {
      expect(count).toBe(0)
    }

    return <div>{count}</div>
  }

  render(<Counter />)
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
    getState1: get,
    getState2: () => getState(),
  }))

  expect(getState().getState1().value).toBe(1)
  expect(getState().getState2().value).toBe(1)
})

it('can set the store', () => {
  const [, { getState, setState }] = create(set => ({
    value: 1,
    setState1: set,
    setState2: newState => setState(newState),
  }))

  getState().setState1({ ...getState(), value: 2 })
  expect(getState().value).toBe(2)
  getState().setState2({ ...getState(), value: 3 })
  expect(getState().value).toBe(3)
})

it('can subscribe to the store', () => {
  expect.assertions(2)

  const [, { setState, subscribe }] = create(() => ({ value: 1 }))

  const unsub1 = subscribe(newState => {
    expect(newState.value).toBe(2)
    unsub1()
  })
  const unsub2 = subscribe(newState => {
    expect(newState.value).toBe(2)
    unsub2()
  })

  setState({ value: 2 })
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
