import React from 'react'
import { act, cleanup, render } from '@testing-library/react'
import create from '../src/index'
import { persist } from '../src/middleware'

describe('persist middleware with async configuration', () => {
  const consoleError = console.error
  afterEach(() => {
    console.error = consoleError
  })

  it('can rehydrate state', async () => {
    const onRehydrateStorageSpy = jest.fn()
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
          onRehydrateStorage: () => onRehydrateStorageSpy,
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
    expect(onRehydrateStorageSpy).toBeCalledWith(
      { count: 42, name: 'test-storage' },
      undefined
    )
  })

  it('can throw rehydrate error', async () => {
    const onRehydrateStorageSpy = jest.fn()

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
        onRehydrateStorage: () => onRehydrateStorageSpy,
      })
    )

    function Counter() {
      const { count } = useStore()
      return <div>count: {count}</div>
    }

    const { findByText } = render(<Counter />)

    await findByText('count: 0')
    expect(onRehydrateStorageSpy).toBeCalledWith(
      undefined,
      new Error('getItem error')
    )
  })

  it('can persist state', async () => {
    const setItemSpy = jest.fn()
    const onRehydrateStorageSpy = jest.fn()

    const storage = {
      getItem: () => null,
      setItem: setItemSpy,
    }

    const useStore = create(
      persist(() => ({ count: 0 }), {
        name: 'test-storage',
        getStorage: () => storage,
        onRehydrateStorage: () => onRehydrateStorageSpy,
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
    expect(setItemSpy).toBeCalledWith(
      'test-storage',
      JSON.stringify({ state: { count: 42 }, version: 0 })
    )
    expect(onRehydrateStorageSpy).toBeCalledWith(undefined, undefined)
  })

  it('can migrate persisted state', async () => {
    const setItemSpy = jest.fn()
    const onRehydrateStorageSpy = jest.fn()
    const migrateSpy = jest.fn(() => ({ count: 99 }))

    const storage = {
      getItem: async () =>
        JSON.stringify({
          state: { count: 42 },
          version: 12,
        }),
      setItem: setItemSpy,
    }

    const useStore = create(
      persist(() => ({ count: 0 }), {
        name: 'test-storage',
        version: 13,
        getStorage: () => storage,
        onRehydrateStorage: () => onRehydrateStorageSpy,
        migrate: migrateSpy,
      })
    )

    function Counter() {
      const { count } = useStore()
      return <div>count: {count}</div>
    }

    const { findByText } = render(<Counter />)

    await findByText('count: 0')
    await findByText('count: 99')
    expect(migrateSpy).toBeCalledWith({ count: 42 }, 12)
    expect(setItemSpy).toBeCalledWith(
      'test-storage',
      JSON.stringify({
        state: { count: 99 },
        version: 13,
      })
    )
    expect(onRehydrateStorageSpy).toBeCalledWith({ count: 99 }, undefined)
  })

  it('can correclty handle a missing migrate function', async () => {
    console.error = jest.fn()
    const onRehydrateStorageSpy = jest.fn()
    const storage = {
      getItem: async () =>
        JSON.stringify({
          state: { count: 42 },
          version: 12,
        }),
      setItem: (_: string, value: string) => {},
    }

    const useStore = create(
      persist(() => ({ count: 0 }), {
        name: 'test-storage',
        version: 13,
        getStorage: () => storage,
        onRehydrateStorage: () => onRehydrateStorageSpy,
      })
    )

    function Counter() {
      const { count } = useStore()
      return <div>count: {count}</div>
    }

    const { findByText } = render(<Counter />)

    await findByText('count: 0')
    expect(console.error).toHaveBeenCalled()
    expect(onRehydrateStorageSpy).toBeCalledWith({ count: 0 }, undefined)
  })

  it('can throw migrate error', async () => {
    console.error = jest.fn()
    const onRehydrateStorageSpy = jest.fn()

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
        onRehydrateStorage: () => onRehydrateStorageSpy,
      })
    )

    function Counter() {
      const { count } = useStore()
      return <div>count: {count}</div>
    }

    const { findByText } = render(<Counter />)

    await findByText('count: 0')
    expect(onRehydrateStorageSpy).toBeCalledWith(
      undefined,
      new Error('migrate error')
    )
  })
})
