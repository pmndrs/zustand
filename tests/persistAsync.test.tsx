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

  const storage = {
    getItem: async (name: string) =>
      JSON.stringify({
        state: { count: 42, name },
        version: 0,
      }),
    setItem: () => {},
  }

  const useStore = create(
    persist(
      () => ({
        count: 0,
        name: 'empty',
      }),
      {
        name: 'test-storage',
        getStorage: () => storage,
        onRehydrateStorage: () => (state) => {
          postRehydrationCallbackCallCount++
          expect(state?.count).toBe(42)
          expect(state?.name).toBe('test-storage')
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

it('can throw rehydrate error', async () => {
  let postRehydrationCallbackCallCount = 0

  const storage = {
    getItem: async () => {
      throw new Error('getItem error')
    },
    setItem: () => {},
  }

  const useStore = create(
    persist(() => ({ count: 0 }), {
      name: 'test-storage',
      getStorage: () => storage,
      onRehydrateStorage: () => (_, e) => {
        postRehydrationCallbackCallCount++
        expect(e?.message).toBe('getItem error')
      },
    })
  )

  function Counter() {
    const { count } = useStore()
    return <div>count: {count}</div>
  }

  const { findByText } = render(<Counter />)

  await findByText('count: 0')
  expect(postRehydrationCallbackCallCount).toBe(1)
})

it('can persist state', async () => {
  let setItemCallCount = 0

  const storage = {
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
  }

  const useStore = create<any>(
    persist(() => ({ count: 0 }), {
      name: 'test-storage',
      getStorage: () => storage,
    })
  )

  function Counter() {
    const { count } = useStore()
    return <div>count: {count}</div>
  }

  const { findByText } = render(<Counter />)

  await findByText('count: 0')
  act(() => useStore.setState({ count: 42 }))

  await findByText('count: 42')
  expect(setItemCallCount).toBe(1)
})

it('can migrate persisted state', async () => {
  let migrateCallCount = 0
  let setItemCallCount = 0

  const storage = {
    getItem: async () =>
      JSON.stringify({
        state: { count: 42 },
        version: 12,
      }),
    setItem: (_: string, value: string) => {
      setItemCallCount++
      expect(value).toBe(
        JSON.stringify({
          state: { count: 99 },
          version: 13,
        })
      )
    },
  }

  const useStore = create(
    persist(() => ({ count: 0 }), {
      name: 'test-storage',
      version: 13,
      getStorage: () => storage,
      migrate: async (state, version) => {
        migrateCallCount++
        expect(state.count).toBe(42)
        expect(version).toBe(12)
        return { count: 99 }
      },
    })
  )

  function Counter() {
    const { count } = useStore()
    return <div>count: {count}</div>
  }

  const { findByText } = render(<Counter />)

  await findByText('count: 0')
  await findByText('count: 99')
  expect(migrateCallCount).toBe(1)
  expect(setItemCallCount).toBe(1)
})

it('can throw migrate error', async () => {
  let postRehydrationCallbackCallCount = 0

  const storage = {
    getItem: async () =>
      JSON.stringify({
        state: {},
        version: 12,
      }),
    setItem: () => {},
  }

  const useStore = create(
    persist(() => ({ count: 0 }), {
      name: 'test-storage',
      version: 13,
      getStorage: () => storage,
      migrate: () => {
        throw new Error('migrate error')
      },
      onRehydrateStorage: () => (_, e) => {
        postRehydrationCallbackCallCount++
        expect(e?.message).toBe('migrate error')
      },
    })
  )

  function Counter() {
    const { count } = useStore()
    return <div>count: {count}</div>
  }

  const { findByText } = render(<Counter />)

  await findByText('count: 0')
  expect(postRehydrationCallbackCallCount).toBe(1)
})
