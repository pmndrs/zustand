import create from '../src/index'
import { persist } from '../src/middleware'

describe('persist middleware with sync configuration', () => {
  const consoleError = console.error
  afterEach(() => {
    console.error = consoleError
  })

  it('can rehydrate state', () => {
    let postRehydrationCallbackCallCount = 0

    const storage = {
      getItem: (name: string) =>
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
          onRehydrateStorage: () => (state, error) => {
            postRehydrationCallbackCallCount++
            expect(error).toBeUndefined()
            expect(state?.count).toBe(42)
            expect(state?.name).toBe('test-storage')
          },
        }
      )
    )

    expect(useStore.getState()).toEqual({ count: 42, name: 'test-storage' })
    expect(postRehydrationCallbackCallCount).toBe(1)
  })

  it('can throw rehydrate error', () => {
    let postRehydrationCallbackCallCount = 0

    const storage = {
      getItem: () => {
        throw new Error('getItem error')
      },
      setItem: () => {},
    }

    create(
      persist(() => ({ count: 0 }), {
        name: 'test-storage',
        getStorage: () => storage,
        onRehydrateStorage: () => (_, e) => {
          postRehydrationCallbackCallCount++
          expect(e?.message).toBe('getItem error')
        },
      })
    )

    expect(postRehydrationCallbackCallCount).toBe(1)
  })

  it('can persist state', () => {
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

    const useStore = create(
      persist(() => ({ count: 0 }), {
        name: 'test-storage',
        getStorage: () => storage,
        onRehydrateStorage: () => (_, error) => {
          expect(error).toBeUndefined()
        },
      })
    )

    expect(useStore.getState()).toEqual({ count: 0 })
    useStore.setState({ count: 42 })
    expect(useStore.getState()).toEqual({ count: 42 })
    expect(setItemCallCount).toBe(1)
  })

  it('can migrate persisted state', () => {
    let migrateCallCount = 0
    let setItemCallCount = 0

    const storage = {
      getItem: () =>
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
        onRehydrateStorage: () => (_, error) => {
          expect(error).toBeUndefined()
        },
        migrate: (state, version) => {
          migrateCallCount++
          expect(state.count).toBe(42)
          expect(version).toBe(12)
          return { count: 99 }
        },
      })
    )

    expect(useStore.getState()).toEqual({ count: 99 })
    expect(migrateCallCount).toBe(1)
    expect(setItemCallCount).toBe(1)
  })

  it('can correclty handle a missing migrate function', () => {
    console.error = jest.fn()
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
        onRehydrateStorage: () => (_, error) => {
          expect(error).toBeUndefined()
        },
      })
    )

    expect(useStore.getState()).toEqual({ count: 0 })
    expect(console.error).toHaveBeenCalled()
  })

  it('can throw migrate error', () => {
    let postRehydrationCallbackCallCount = 0

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
        onRehydrateStorage: () => (_, e) => {
          postRehydrationCallbackCallCount++
          expect(e?.message).toBe('migrate error')
        },
      })
    )

    expect(useStore.getState()).toEqual({ count: 0 })
    expect(postRehydrationCallbackCallCount).toBe(1)
  })
})
