import create from '../src/index'
import { persist } from '../src/middleware'

const createPersistantStore = (initialValue: string | null) => {
  let state = initialValue

  const getItem = (): string | null => {
    getItemSpy()
    return state
  }
  const setItem = (name: string, newState: string) => {
    setItemSpy(name, newState)
    state = newState
  }

  const getItemSpy = jest.fn()
  const setItemSpy = jest.fn()

  return {
    storage: { getItem, setItem },
    getItemSpy,
    setItemSpy,
  }
}

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
    const { storage, setItemSpy } = createPersistantStore(null)

    const createStore = () => {
      const onRehydrateStorageSpy = jest.fn()
      const useStore = create(
        persist(() => ({ count: 0 }), {
          name: 'test-storage',
          getStorage: () => storage,
          onRehydrateStorage: () => onRehydrateStorageSpy,
        })
      )
      return { useStore, onRehydrateStorageSpy }
    }

    // Initialize from empty storage
    const { useStore, onRehydrateStorageSpy } = createStore()
    expect(useStore.getState()).toEqual({ count: 0 })
    expect(onRehydrateStorageSpy).toBeCalledWith({ count: 0 }, undefined)

    // Write something to the store
    useStore.setState({ count: 42 })
    expect(useStore.getState()).toEqual({ count: 42 })
    expect(setItemSpy).toBeCalledWith(
      'test-storage',
      JSON.stringify({ state: { count: 42 }, version: 0 })
    )

    // Create the same store a second time and check if the persisted state
    // is loaded correctly
    const {
      useStore: useStore2,
      onRehydrateStorageSpy: onRehydrateStorageSpy2,
    } = createStore()
    expect(useStore2.getState()).toEqual({ count: 42 })
    expect(onRehydrateStorageSpy2).toBeCalledWith({ count: 42 }, undefined)
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
    expect(onRehydrateStorageSpy).toBeCalledWith({ count: 0 }, undefined)
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

  it('gives the merged state to onRehydrateStorage', () => {
    const onRehydrateStorageSpy = jest.fn()

    const storage = {
      getItem: () =>
        JSON.stringify({
          state: { count: 1 },
          version: 0,
        }),
      setItem: () => {},
    }

    const unstorableMethod = () => {}

    const useStore = create(
      persist(() => ({ count: 0, unstorableMethod }), {
        name: 'test-storage',
        getStorage: () => storage,
        onRehydrateStorage: () => onRehydrateStorageSpy,
      })
    )

    const expectedState = { count: 1, unstorableMethod }

    expect(useStore.getState()).toEqual(expectedState)
    expect(onRehydrateStorageSpy).toBeCalledWith(expectedState, undefined)
  })
})
