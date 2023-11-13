import { afterEach, describe, expect, it, vi } from 'vitest'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { replacer, reviver } from './test-utils'

const createPersistentStore = (initialValue: string | null) => {
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

  const getItemSpy = vi.fn()
  const setItemSpy = vi.fn()
  const removeItemSpy = vi.fn()

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

    const onRehydrateStorageSpy = vi.fn()
    const useBoundStore = create(
      persist(
        () => ({
          count: 0,
          name: 'empty',
        }),
        {
          name: 'test-storage',
          storage: createJSONStorage(() => storage),
          onRehydrateStorage: () => onRehydrateStorageSpy,
        },
      ),
    )

    expect(useBoundStore.getState()).toEqual({
      count: 42,
      name: 'test-storage',
    })
    expect(onRehydrateStorageSpy).toBeCalledWith(
      { count: 42, name: 'test-storage' },
      undefined,
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

    const spy = vi.fn()
    create(
      persist(() => ({ count: 0 }), {
        name: 'test-storage',
        storage: createJSONStorage(() => storage),
        onRehydrateStorage: () => spy,
      }),
    )

    expect(spy).toBeCalledWith(undefined, new Error('getItem error'))
  })

  it('can persist state', () => {
    const { storage, setItemSpy } = createPersistentStore(null)

    const createStore = () => {
      const onRehydrateStorageSpy = vi.fn()
      const useBoundStore = create(
        persist(() => ({ count: 0 }), {
          name: 'test-storage',
          storage: createJSONStorage(() => storage),
          onRehydrateStorage: () => onRehydrateStorageSpy,
        }),
      )
      return { useBoundStore, onRehydrateStorageSpy }
    }

    // Initialize from empty storage
    const { useBoundStore, onRehydrateStorageSpy } = createStore()
    expect(useBoundStore.getState()).toEqual({ count: 0 })
    expect(onRehydrateStorageSpy).toBeCalledWith({ count: 0 }, undefined)

    // Write something to the store
    useBoundStore.setState({ count: 42 })
    expect(useBoundStore.getState()).toEqual({ count: 42 })
    expect(setItemSpy).toBeCalledWith(
      'test-storage',
      JSON.stringify({ state: { count: 42 }, version: 0 }),
    )

    // Create the same store a second time and check if the persisted state
    // is loaded correctly
    const {
      useBoundStore: useBoundStore2,
      onRehydrateStorageSpy: onRehydrateStorageSpy2,
    } = createStore()
    expect(useBoundStore2.getState()).toEqual({ count: 42 })
    expect(onRehydrateStorageSpy2).toBeCalledWith({ count: 42 }, undefined)
  })

  it('can migrate persisted state', () => {
    const setItemSpy = vi.fn()
    const onRehydrateStorageSpy = vi.fn()
    const migrateSpy = vi.fn(() => ({ count: 99 }))

    const storage = {
      getItem: () =>
        JSON.stringify({
          state: { count: 42 },
          version: 12,
        }),
      setItem: setItemSpy,
      removeItem: () => {},
    }

    const useBoundStore = create(
      persist(() => ({ count: 0 }), {
        name: 'test-storage',
        version: 13,
        storage: createJSONStorage(() => storage),
        onRehydrateStorage: () => onRehydrateStorageSpy,
        migrate: migrateSpy,
      }),
    )

    expect(useBoundStore.getState()).toEqual({ count: 99 })
    expect(migrateSpy).toBeCalledWith({ count: 42 }, 12)
    expect(setItemSpy).toBeCalledWith(
      'test-storage',
      JSON.stringify({
        state: { count: 99 },
        version: 13,
      }),
    )
    expect(onRehydrateStorageSpy).toBeCalledWith({ count: 99 }, undefined)
  })

  it('can correclty handle a missing migrate function', () => {
    console.error = vi.fn()
    const onRehydrateStorageSpy = vi.fn()
    const storage = {
      getItem: () =>
        JSON.stringify({
          state: { count: 42 },
          version: 12,
        }),
      setItem: (_: string, _value: string) => {},
      removeItem: () => {},
    }

    const useBoundStore = create(
      persist(() => ({ count: 0 }), {
        name: 'test-storage',
        version: 13,
        storage: createJSONStorage(() => storage),
        onRehydrateStorage: () => onRehydrateStorageSpy,
      }),
    )

    expect(useBoundStore.getState()).toEqual({ count: 0 })
    expect(console.error).toHaveBeenCalled()
    expect(onRehydrateStorageSpy).toBeCalledWith({ count: 0 }, undefined)
  })

  it('can throw migrate error', () => {
    const onRehydrateStorageSpy = vi.fn()

    const storage = {
      getItem: () =>
        JSON.stringify({
          state: {},
          version: 12,
        }),
      setItem: () => {},
      removeItem: () => {},
    }

    const useBoundStore = create(
      persist(() => ({ count: 0 }), {
        name: 'test-storage',
        version: 13,
        storage: createJSONStorage(() => storage),
        migrate: () => {
          throw new Error('migrate error')
        },
        onRehydrateStorage: () => onRehydrateStorageSpy,
      }),
    )

    expect(useBoundStore.getState()).toEqual({ count: 0 })
    expect(onRehydrateStorageSpy).toBeCalledWith(
      undefined,
      new Error('migrate error'),
    )
  })

  it('passes the latest state to onRehydrateStorage and onHydrate on first hydrate', () => {
    const onRehydrateStorageSpy = vi.fn()

    const storage = {
      getItem: () => JSON.stringify({ state: { count: 1 } }),
      setItem: () => {},
      removeItem: () => {},
    }

    const useBoundStore = create(
      persist(() => ({ count: 0 }), {
        name: 'test-storage',
        storage: createJSONStorage(() => storage),
        onRehydrateStorage: onRehydrateStorageSpy,
      }),
    )

    /**
     * NOTE: It's currently not possible to add an 'onHydrate' listener which will be
     * invoked prior to the first hydration. This is because, during first hydration,
     * the 'onHydrate' listener set (which will be empty) is evaluated before the
     * 'persist' API is exposed to the caller of 'create'/'createStore'.
     *
     * const onHydrateSpy = vi.fn()
     * useBoundStore.persist.onHydrate(onHydrateSpy)
     * expect(onHydrateSpy).toBeCalledWith({ count: 0 })
     */

    // The 'onRehydrateStorage' and 'onHydrate' spies are invoked prior to rehydration,
    // so they should both be passed the default state.
    expect(onRehydrateStorageSpy).toBeCalledWith({ count: 0 })
    expect(useBoundStore.getState()).toEqual({ count: 1 })
  })

  it('gives the merged state to onRehydrateStorage', () => {
    const onRehydrateStorageSpy = vi.fn()

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

    const useBoundStore = create(
      persist(() => ({ count: 0, unstorableMethod }), {
        name: 'test-storage',
        storage: createJSONStorage(() => storage),
        onRehydrateStorage: () => onRehydrateStorageSpy,
      }),
    )

    const expectedState = { count: 1, unstorableMethod }

    expect(useBoundStore.getState()).toEqual(expectedState)
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

    const useBoundStore = create(
      persist(() => ({ count: 0, actions: { unstorableMethod } }), {
        name: 'test-storage',
        storage: createJSONStorage(() => storage),
        merge: (_persistedState, currentState) => {
          const persistedState = _persistedState as any
          delete persistedState.actions

          return {
            ...currentState,
            ...persistedState,
          }
        },
      }),
    )

    expect(useBoundStore.getState()).toEqual({
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

    const useBoundStore = create(
      persist(() => ({ count: 0 }), {
        name: 'test-storage',
        storage: createJSONStorage(() => storage),
      }),
    )

    expect(useBoundStore.getState()).toEqual({
      count: 1,
    })
  })

  it('can filter the persisted value', () => {
    const setItemSpy = vi.fn()

    const storage = {
      getItem: () => '',
      setItem: setItemSpy,
      removeItem: () => {},
    }

    const useBoundStore = create(
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
          storage: createJSONStorage(() => storage),
          partialize: (state) => {
            return {
              object: {
                first: state.object.first,
              },
              array: state.array.filter((e) => e.value !== '1'),
            }
          },
        },
      ),
    )

    useBoundStore.setState({})
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
      }),
    )
  })

  it('can access the options through the api', () => {
    const storage = {
      getItem: () => null,
      setItem: vi.fn(),
      removeItem: () => {},
    }

    const useBoundStore = create(
      persist(() => ({ count: 0 }), {
        name: 'test-storage',
        storage: createJSONStorage(() => storage),
      }),
    )
    expect(useBoundStore.persist.getOptions().name).toBeDefined()
    expect(useBoundStore.persist.getOptions().name).toBe('test-storage')
  })

  it('can change the options through the api', () => {
    const setItemSpy = vi.fn()

    const storage = {
      getItem: () => null,
      setItem: setItemSpy,
      removeItem: () => {},
    }

    const useBoundStore = create(
      persist(() => ({ count: 0 }), {
        name: 'test-storage',
        storage: createJSONStorage(() => storage),
        partialize: (s) => s as Partial<typeof s>,
      }),
    )

    useBoundStore.setState({})
    expect(setItemSpy).toBeCalledWith(
      'test-storage',
      '{"state":{"count":0},"version":0}',
    )

    useBoundStore.persist.setOptions({
      name: 'test-storage-2',
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(([key]) => key !== 'count'),
        ),
    })
    useBoundStore.setState({})
    expect(setItemSpy).toBeCalledWith(
      'test-storage-2',
      '{"state":{},"version":0}',
    )
  })

  it('can clear the storage through the api', () => {
    const removeItemSpy = vi.fn()

    const storage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: removeItemSpy,
    }

    const useBoundStore = create(
      persist(() => ({ count: 0 }), {
        name: 'test-storage',
        storage: createJSONStorage(() => storage),
      }),
    )

    useBoundStore.persist.clearStorage()
    expect(removeItemSpy).toBeCalledWith('test-storage')
  })

  it('can manually rehydrate through the api', () => {
    const storageValue = '{"state":{"count":1},"version":0}'

    const storage = {
      getItem: () => '',
      setItem: () => {},
      removeItem: () => {},
    }

    const useBoundStore = create(
      persist(() => ({ count: 0 }), {
        name: 'test-storage',
        storage: createJSONStorage(() => storage),
      }),
    )

    storage.getItem = () => storageValue
    useBoundStore.persist.rehydrate()
    expect(useBoundStore.getState()).toEqual({
      count: 1,
    })
  })

  it('can check if the store has been hydrated through the api', async () => {
    const storage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    }

    const useBoundStore = create(
      persist(() => ({ count: 0 }), {
        name: 'test-storage',
        storage: createJSONStorage(() => storage),
      }),
    )

    expect(useBoundStore.persist.hasHydrated()).toBe(true)

    await useBoundStore.persist.rehydrate()
    expect(useBoundStore.persist.hasHydrated()).toBe(true)
  })

  it('can wait for rehydration through the api', async () => {
    const storageValue1 = '{"state":{"count":1},"version":0}'
    const storageValue2 = '{"state":{"count":2},"version":0}'

    const onHydrateSpy1 = vi.fn()
    const onHydrateSpy2 = vi.fn()
    const onFinishHydrationSpy1 = vi.fn()
    const onFinishHydrationSpy2 = vi.fn()

    const storage = {
      getItem: () => '',
      setItem: () => {},
      removeItem: () => {},
    }

    const useBoundStore = create(
      persist(() => ({ count: 0 }), {
        name: 'test-storage',
        storage: createJSONStorage(() => storage),
      }),
    )

    const hydrateUnsub1 = useBoundStore.persist.onHydrate(onHydrateSpy1)
    useBoundStore.persist.onHydrate(onHydrateSpy2)

    const finishHydrationUnsub1 = useBoundStore.persist.onFinishHydration(
      onFinishHydrationSpy1,
    )
    useBoundStore.persist.onFinishHydration(onFinishHydrationSpy2)

    storage.getItem = () => storageValue1
    await useBoundStore.persist.rehydrate()
    expect(onHydrateSpy1).toBeCalledWith({ count: 0 })
    expect(onHydrateSpy2).toBeCalledWith({ count: 0 })
    expect(onFinishHydrationSpy1).toBeCalledWith({ count: 1 })
    expect(onFinishHydrationSpy2).toBeCalledWith({ count: 1 })

    hydrateUnsub1()
    finishHydrationUnsub1()

    storage.getItem = () => storageValue2
    await useBoundStore.persist.rehydrate()
    expect(onHydrateSpy1).not.toBeCalledTimes(2)
    expect(onHydrateSpy2).toBeCalledWith({ count: 1 })
    expect(onFinishHydrationSpy1).not.toBeCalledTimes(2)
    expect(onFinishHydrationSpy2).toBeCalledWith({ count: 2 })
  })

  it('can skip initial hydration', async () => {
    const storage = {
      getItem: (name: string) => ({
        state: { count: 42, name },
        version: 0,
      }),
      setItem: () => {},
      removeItem: () => {},
    }

    const onRehydrateStorageSpy = vi.fn()
    const useBoundStore = create(
      persist(
        () => ({
          count: 0,
          name: 'empty',
        }),
        {
          name: 'test-storage',
          storage: storage,
          onRehydrateStorage: () => onRehydrateStorageSpy,
          skipHydration: true,
        },
      ),
    )

    expect(useBoundStore.getState()).toEqual({
      count: 0,
      name: 'empty',
    })

    // Because `skipHydration` is only in newImpl and the hydration function for newImpl is now a promise
    // In the default case we would need to await `onFinishHydration` to assert the auto hydration has completed
    // As we are testing the skip hydration case we await nextTick, to make sure the store is initialised
    await new Promise((resolve) => process.nextTick(resolve))

    // Asserting store hasn't hydrated from nextTick
    expect(useBoundStore.persist.hasHydrated()).toBe(false)

    await useBoundStore.persist.rehydrate()

    expect(useBoundStore.getState()).toEqual({
      count: 42,
      name: 'test-storage',
    })
    expect(onRehydrateStorageSpy).toBeCalledWith(
      { count: 42, name: 'test-storage' },
      undefined,
    )
  })

  it('handles state updates during onRehydrateStorage', () => {
    const storage = {
      getItem: () => JSON.stringify({ state: { count: 1 } }),
      setItem: () => {},
      removeItem: () => {},
    }

    const useBoundStore = create<{ count: number; inc: () => void }>()(
      persist(
        (set) => ({
          count: 0,
          inc: () => set((s) => ({ count: s.count + 1 })),
        }),
        {
          name: 'test-storage',
          storage: createJSONStorage(() => storage),
          onRehydrateStorage: () => (s) => s?.inc(),
        },
      ),
    )

    expect(useBoundStore.getState().count).toEqual(2)
  })

  it('can rehydrate state with custom deserialized Map', () => {
    const storage = {
      getItem: () =>
        JSON.stringify({
          map: { type: 'Map', value: [['foo', 'bar']] },
        }),
      setItem: () => {},
      removeItem: () => {},
    }

    const map = new Map()
    const onRehydrateStorageSpy = vi.fn()
    const useBoundStore = create(
      persist(
        () => ({
          map,
        }),
        {
          name: 'test-storage',
          storage: createJSONStorage(() => storage),
          onRehydrateStorage: () => onRehydrateStorageSpy,
        },
      ),
    )

    const updatedMap = map.set('foo', 'bar')
    expect(useBoundStore.getState()).toEqual({
      map: updatedMap,
    })
    expect(onRehydrateStorageSpy).toBeCalledWith({ map: updatedMap }, undefined)
  })

  it('can persist state with custom serialization of Map', () => {
    const { storage, setItemSpy } = createPersistentStore(null)
    const map = new Map()

    const createStore = () => {
      const onRehydrateStorageSpy = vi.fn()
      const useBoundStore = create(
        persist(() => ({ map }), {
          name: 'test-storage',
          storage: createJSONStorage(() => storage, { replacer, reviver }),
          onRehydrateStorage: () => onRehydrateStorageSpy,
        }),
      )
      return { useBoundStore, onRehydrateStorageSpy }
    }

    // Initialize from empty storage
    const { useBoundStore, onRehydrateStorageSpy } = createStore()
    expect(useBoundStore.getState()).toEqual({ map })
    expect(onRehydrateStorageSpy).toBeCalledWith({ map }, undefined)

    // Write something to the store
    const updatedMap = map.set('foo', 'bar')
    useBoundStore.setState({ map: updatedMap })
    expect(useBoundStore.getState()).toEqual({
      map: updatedMap,
    })
    expect(setItemSpy).toBeCalledWith(
      'test-storage',
      JSON.stringify({
        state: { map: { type: 'Map', value: [['foo', 'bar']] } },
        version: 0,
      }),
    )

    // Create the same store a second time and check if the persisted state
    // is loaded correctly
    const {
      useBoundStore: useBoundStore2,
      onRehydrateStorageSpy: onRehydrateStorageSpy2,
    } = createStore()
    expect(useBoundStore2.getState()).toEqual({ map: updatedMap })
    expect(onRehydrateStorageSpy2).toBeCalledWith(
      { map: updatedMap },
      undefined,
    )
  })
})
