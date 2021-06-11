import create from '../src/index'
import { persist } from '../src/middleware'

describe('persist middleware with sync configuration', () => {
  const consoleError = console.error
  afterEach(() => {
    console.error = consoleError
  })

  it('can rehydrate state', () => {
    const storage = {
      getItem: (name: string) =>
        JSON.stringify({
          state: { count: 42, name },
          version: 0,
        }),
      setItem: () => {},
    }

    const onRehydrateStorageSpy = jest.fn()
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

    expect(useStore.getState()).toEqual({ count: 42, name: 'test-storage' })
    expect(onRehydrateStorageSpy).toBeCalledWith(
      { count: 42, name: 'test-storage' },
      undefined
    )
  })

  it('can throw rehydrate error', () => {
    const storage = {
      getItem: () => {
        throw new Error('getItem error')
      },
      setItem: () => {},
    }

    const spy = jest.fn()
    create(
      persist(() => ({ count: 0 }), {
        name: 'test-storage',
        getStorage: () => storage,
        onRehydrateStorage: () => spy,
      })
    )

    expect(spy).toBeCalledWith(undefined, new Error('getItem error'))
  })

  it('can persist state', () => {
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

    expect(useStore.getState()).toEqual({ count: 0 })
    useStore.setState({ count: 42 })
    expect(useStore.getState()).toEqual({ count: 42 })
    expect(setItemSpy).toBeCalledWith(
      'test-storage',
      JSON.stringify({ state: { count: 42 }, version: 0 })
    )
    expect(onRehydrateStorageSpy).toBeCalledWith(undefined, undefined)
  })

  it('can migrate persisted state', () => {
    const setItemSpy = jest.fn()
    const onRehydrateStorageSpy = jest.fn()
    const migrateSpy = jest.fn(() => ({ count: 99 }))

    const storage = {
      getItem: () =>
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

    expect(useStore.getState()).toEqual({ count: 99 })
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

  it('can correclty handle a missing migrate function', () => {
    console.error = jest.fn()
    const onRehydrateStorageSpy = jest.fn()
    const storage = {
      getItem: () =>
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

    expect(useStore.getState()).toEqual({ count: 0 })
    expect(console.error).toHaveBeenCalled()
    expect(onRehydrateStorageSpy).toBeCalledWith(undefined, undefined)
  })

  it('can throw migrate error', () => {
    const onRehydrateStorageSpy = jest.fn()

    const storage = {
      getItem: () =>
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

    expect(useStore.getState()).toEqual({ count: 0 })
    expect(onRehydrateStorageSpy).toBeCalledWith(
      undefined,
      new Error('migrate error')
    )
  })
})
