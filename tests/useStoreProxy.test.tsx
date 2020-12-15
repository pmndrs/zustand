import React from 'react'
import ReactDOM from 'react-dom'

import { fireEvent, render } from '@testing-library/react'
import create, { useStoreProxy } from '../src'

describe('useStoreProxy', () => {
  it('gives access to the store', async () => {
    const useStore = create<any>((set) => ({
      count: 0,
      inc: () => set((state) => ({ count: state.count + 1 })),
    }))

    function Counter() {
      const { count, inc } = useStoreProxy(useStore)
      React.useEffect(inc, [inc])
      return <div>count: {count}</div>
    }

    const { findByText } = render(<Counter />)

    await findByText('count: 1')
  })

  it('only re-renders if selected state has changed', async () => {
    const store = create<any>((set) => ({
      foo: 0,
      bar: 0,
      inc: (what: 'foo' | 'bar') =>
        set((state) => ({ [what]: state[what] + 1 })),
    }))
    let fooCounterRenderCount = 0
    let barCounterRenderCount = 0
    let controlRenderCount = 0

    function FooCounter() {
      const { foo } = useStoreProxy(store)
      fooCounterRenderCount++
      return <div>Foo: {foo}</div>
    }

    function BarCounter() {
      const snapshot = useStoreProxy(store)
      barCounterRenderCount++
      return <div>Bar: {snapshot.bar}</div>
    }

    function Buttons() {
      const { inc } = useStoreProxy(store)
      controlRenderCount++
      return (
        <>
          <button onClick={() => inc('foo')}>Increase Foo</button>
          <button onClick={() => inc('bar')}>Increase Bar</button>
        </>
      )
    }

    const { getByText, findByText } = render(
      <>
        <FooCounter />
        <BarCounter />
        <Buttons />
      </>
    )

    fireEvent.click(getByText('Increase Foo'))
    fireEvent.click(getByText('Increase Bar'))
    fireEvent.click(getByText('Increase Bar'))

    await findByText('Foo: 1')
    await findByText('Bar: 2')

    expect(fooCounterRenderCount).toBe(2)
    expect(barCounterRenderCount).toBe(3)
    expect(controlRenderCount).toBe(1)
  })
})
