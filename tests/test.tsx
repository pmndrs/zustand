import React, { useEffect } from 'react'
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

    useEffect(dec, [])

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
