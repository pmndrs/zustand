import React, { useEffect } from 'react'
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
    useEffect(() => {
      dec()
    }, [])

    console.log('r', count)

    expect(count).toBe(1)
    return count
  }

  const { container } = render(<Counter />)
  //expect(container).toMatchSnapshot()
})
