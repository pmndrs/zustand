import create from 'zustand'
import { persist } from 'zustand/middleware'

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
  const removeItem = (name: string) => {
    removeItemSpy(name)
    state = null
  }

  const getItemSpy = jest.fn()
  const setItemSpy = jest.fn()
  const removeItemSpy = jest.fn()

  return {
    storage: { getItem, setItem, removeItem },
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
      removeItem: () => {},
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
      removeItem: () => {},
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
      removeItem: () => {},
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
      setItem: (_: string, _value: string) => {},
      removeItem: () => {},
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
      removeItem: () => {},
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
      removeItem: () => {},
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

  it('can custom merge the stored state', () => {
    const storage = {
      getItem: () =>
        JSON.stringify({
          state: {
            count: 1,
            actions: {},
          },
          version: 0,
        }),
      setItem: () => {},
      removeItem: () => {},
    }

    const unstorableMethod = () => {}

    const useStore = create(
      persist(() => ({ count: 0, actions: { unstorableMethod } }), {
        name: 'test-storage',
        getStorage: () => storage,
        merge: (persistedState, currentState) => {
          delete persistedState.actions

          return {
            ...currentState,
            ...persistedState,
          }
        },
      })
    )

    expect(useStore.getState()).toEqual({
      count: 1,
      actions: {
        unstorableMethod,
      },
    })
  })

  it("can merge the state when the storage item doesn't have a version", () => {
    const storage = {
      getItem: () =>
        JSON.stringify({
          state: {
            count: 1,
          },
        }),
      setItem: () => {},
      removeItem: () => {},
    }

    const useStore = create(
      persist(() => ({ count: 0 }), {
        name: 'test-storage',
        getStorage: () => storage,
        deserialize: (str) => JSON.parse(str),
      })
    )

    expect(useStore.getState()).toEqual({
      count: 1,
    })
  })

  it('can filter the persisted value', () => {
    const setItemSpy = jest.fn()

    const storage = {
      getItem: () => '',
      setItem: setItemSpy,
      removeItem: () => {},
    }

    const useStore = create(
      persist(
        () => ({
          object: {
            first: '0',
            second: '1',
          },
          array: [
            {
              value: '0',
            },
            {
              value: '1',
            },
            {
              value: '2',
            },
          ],
        }),
        {
          name: 'test-storage',
          getStorage: () => storage,
          partialize: (state) => {
            return {
              object: {
                first: state.object.first,
              },
              array: state.array.filter((e) => e.value !== '1'),
            }
          },
        }
      )
    )

    useStore.setState({})
    expect(setItemSpy).toBeCalledWith(
      'test-storage',
      JSON.stringify({
        state: {
          object: {
            first: '0',
          },
          array: [
            {
              value: '0',
            },
            {
              value: '2',
            },
          ],
        },
        version: 0,
      })
    )
  })

  it('can change the options through the api', () => {
    const setItemSpy = jest.fn()

    const storage = {
      getItem: () => null,
      setItem: setItemSpy,
      removeItem: () => {},
    }

    const useStore = create(
      persist(() => ({ count: 0 }), {
        name: 'test-storage',
        getStorage: () => storage,
      })
    )

    useStore.setState({})
    expect(setItemSpy).toBeCalledWith(
      'test-storage',
      '{"state":{"count":0},"version":0}'
    )

    useStore.persist.setOptions({
      name: 'test-storage-2',
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(([key]) => key !== 'count')
        ),
    })
    useStore.setState({})
    expect(setItemSpy).toBeCalledWith(
      'test-storage-2',
      '{"state":{},"version":0}'
    )
  })

  it('can clear the storage through the api', () => {
    const removeItemSpy = jest.fn()

    const storage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: removeItemSpy,
    }

    const useStore = create(
      persist(() => ({ count: 0 }), {
        name: 'test-storage',
        getStorage: () => storage,
      })
    )

    useStore.persist.clearStorage()
    expect(removeItemSpy).toBeCalledWith('test-storage')
  })

  it('can manually rehydrate through the api', () => {
    const storageValue = '{"state":{"count":1},"version":0}'

    const storage = {
      getItem: () => '',
      setItem: () => {},
      removeItem: () => {},
    }

    const useStore = create(
      persist(() => ({ count: 0 }), {
        name: 'test-storage',
        getStorage: () => storage,
      })
    )

    storage.getItem = () => storageValue
    useStore.persist.rehydrate()
    expect(useStore.getState()).toEqual({
      count: 1,
    })
  })

  it('can check if the store has been hydrated through the api', async () => {
    const storage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    }

    const useStore = create(
      persist(() => ({ count: 0 }), {
        name: 'test-storage',
        getStorage: () => storage,
      })
    )

    expect(useStore.persist.hasHydrated()).toBe(true)

    await useStore.persist.rehydrate()
    expect(useStore.persist.hasHydrated()).toBe(true)
  })

  it('can wait for rehydration through the api', async () => {
    const storageValue1 = '{"state":{"count":1},"version":0}'
    const storageValue2 = '{"state":{"count":2},"version":0}'

    const onHydrateSpy1 = jest.fn()
    const onHydrateSpy2 = jest.fn()
    const onFinishHydrationSpy1 = jest.fn()
    const onFinishHydrationSpy2 = jest.fn()

    const storage = {
      getItem: () => '',
      setItem: () => {},
      removeItem: () => {},
    }

    const useStore = create(
      persist(() => ({ count: 0 }), {
        name: 'test-storage',
        getStorage: () => storage,
      })
    )

    const hydrateUnsub1 = useStore.persist.onHydrate(onHydrateSpy1)
    useStore.persist.onHydrate(onHydrateSpy2)

    const finishHydrationUnsub1 = useStore.persist.onFinishHydration(
      onFinishHydrationSpy1
    )
    useStore.persist.onFinishHydration(onFinishHydrationSpy2)

    storage.getItem = () => storageValue1
    await useStore.persist.rehydrate()
    expect(onHydrateSpy1).toBeCalledWith({ count: 0 })
    expect(onHydrateSpy2).toBeCalledWith({ count: 0 })
    expect(onFinishHydrationSpy1).toBeCalledWith({ count: 1 })
    expect(onFinishHydrationSpy2).toBeCalledWith({ count: 1 })

    hydrateUnsub1()
    finishHydrationUnsub1()

    storage.getItem = () => storageValue2
    await useStore.persist.rehydrate()
    expect(onHydrateSpy1).not.toBeCalledTimes(2)
    expect(onHydrateSpy2).toBeCalledWith({ count: 1 })
    expect(onFinishHydrationSpy1).not.toBeCalledTimes(2)
    expect(onFinishHydrationSpy2).toBeCalledWith({ count: 2 })
  })
})
