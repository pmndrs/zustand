import React, { useEffect, useRef } from 'react'
import { cleanup, render } from 'react-testing-library'
import create from '../src/index'

afterEach(cleanup)

it('creates an HTML element from a tag name', () => {
  //expect.assertions(2)

  const [useStore] = create(set => ({
    count: 1,
    inc: () => set(state => ({ count: state.count + 1 })),
    dec: () => set(state => ({ count: state.count - 1 })),
  }))

  function Counter() {
    const { count, inc, dec } = useStore()

    const renderCount = useRef(0)
    useEffect(() => {
      dec()
    }, [])

    console.log('r', count)
    useEffect(() => {
      if (renderCount.current === 0) {
        expect(count).toBe(1)
      } else if (renderCount.current >= 1) {
        expect(count).toBe(0)
      }
    })
    useEffect(() => void ++renderCount.current)
    return count
  }

  const { container } = render(<Counter />)
  //expect(container).toMatchSnapshot()
})
