import { act, render } from '@testing-library/react'
import { useEffect } from 'react'
import { describe, it } from 'vitest'
import { create } from 'zustand'
import { createSelector } from 'zustand/createSelector'
import { shallow } from 'zustand/shallow'

type CounterState = {
  count: number
  inc: () => void
}

describe('createSelector', () => {
  it('pick single value', async () => {
    const useBoundStore = create<CounterState>((set) => ({
      count: 0,
      inc: () => set((state) => ({ count: state.count + 1 })),
    }))

    function Counter() {
      const { count } = useBoundStore(createSelector('count'))

      return <div>count: {count}</div>
    }

    const { findByText } = render(
      <>
        <Counter />
      </>
    )

    await findByText('count: 0')
  })

  it('pick multi value', async () => {
    const useBoundStore = create<CounterState>((set) => ({
      count: 0,
      inc: () => set((state) => ({ count: state.count + 1 })),
    }))

    function Counter() {
      const { count, inc } = useBoundStore(createSelector('count', 'inc'))

      useEffect(inc, [inc])

      return <div>count: {count}</div>
    }

    const { findByText } = render(
      <>
        <Counter />
      </>
    )

    await findByText('count: 1')
  })

  it('filter unexpected modifications', async () => {
    const useBoundStore = create(() => ({ item: 0, other: 0 }))
    const { setState } = useBoundStore
    let renderCount = 0

    function Component() {
      const { item } = useBoundStore(createSelector('item'), shallow)

      return (
        <div>
          renderCount: {++renderCount}, value: {item}
        </div>
      )
    }

    const { findByText } = render(
      <>
        <Component />
      </>
    )

    await findByText('renderCount: 1, value: 0')

    // This will not cause a re-render.
    act(() => setState({ other: 1 }))
    await findByText('renderCount: 1, value: 0')

    // This will cause a re-render.
    act(() => setState({ item: 2 }))
    await findByText('renderCount: 2, value: 2')
  })
})
