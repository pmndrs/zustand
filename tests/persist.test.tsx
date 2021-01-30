import React from 'react'
import { act, cleanup, render } from '@testing-library/react'
import create from '../src/index'
import { persist } from '../src/middleware'

const consoleError = console.error
afterEach(() => {
  cleanup()
  console.error = consoleError
})

it('can rehydrate state', async () => {
  let postRehydrationCallbackCallCount = 0

  const useStore = create(
    persist(
      () => ({
        count: 0,
        name: 'empty',
      }),
      {
        name: 'test-storage',
        getStorage: () => ({
          getItem: async (name: string) =>
            JSON.stringify({
              state: { count: 42, name },
              version: 0,
            }),
          setItem: () => {},
        }),
        onRehydrateStorage: () => (state) => {
          postRehydrationCallbackCallCount++
          expect(state.count).toBe(42)
          expect(state.name).toBe('test-storage')
        },
      }
    )
  )

  function Counter() {
    const { count, name } = useStore()
    return (
      <div>
        count: {count}, name: {name}
      </div>
    )
  }

  const { findByText } = render(<Counter />)

  await findByText('count: 0, name: empty')
  await findByText('count: 42, name: test-storage')
  expect(postRehydrationCallbackCallCount).toBe(1)
})

it('can persist state', async () => {
  let setItemCallCount = 0

  const useStore = create<any>(
    persist(() => ({ count: 0 }), {
      name: 'test-storage',
      getStorage: () => ({
        getItem: () => null,
        setItem: (name: string, value: string) => {
          setItemCallCount++
          expect(name).toBe('test-storage')
          expect(value).toBe(
            JSON.stringify({
              state: { count: 42 },
              version: 0,
            })
          )
        },
      }),
    })
  )

  function Counter() {
    const { count } = useStore()
    return <div>count: {count}</div>
  }

  const { findByText } = render(<Counter />)

  await findByText('count: 0')
  await act(() => useStore.setState({ count: 42 }))

  await findByText('count: 42')
  expect(setItemCallCount).toBe(1)
})

it('can throw persist error', async () => {
  let setStateCallCount = 0

  const useStore = create<any>(
    persist(() => ({ count: 0 }), {
      name: 'test-storage',
      getStorage: () => ({
        getItem: () => null,
        setItem: () => {
          throw new Error('setItem error')
        },
      }),
    })
  )

  function Counter() {
    const { count } = useStore()
    return <div>count: {count}</div>
  }

  const { findByText } = render(<Counter />)

  await findByText('count: 0')
  await act(async () => {
    try {
      await useStore.setState({})
      setStateCallCount++
    } catch (e) {
      expect(e.message).toBe('setItem error')
    }
  })
  expect(setStateCallCount).toBe(0)
})
