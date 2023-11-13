import { StrictMode, useEffect } from 'react'
import { act, render, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { replacer, reviver } from './test-utils'

const createPersistantStore = (initialValue: string | null) => {
  let state = initialValue

  const getItem = async (): Promise<string | null> => {
    getItemSpy()
    return state
  }
  const setItem = async (name: string, newState: string) => {
    setItemSpy(name, newState)
    state = newState
  }

  const removeItem = async (name: string) => {
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
    removeItemSpy,
  }
}

describe('persist middleware with async configuration', () => {
  const consoleError = console.error
  afterEach(() => {
    console.error = consoleError
  })

  it('can rehydrate state', async () => {
    const onRehydrateStorageSpy = vi.fn()
    const storage = {
      getItem: async (name: string) =>
        JSON.stringify({
          state: { count: 42, name },
          version: 0,
        }),
      setItem: () => {},
      removeItem: () => {},
    }

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

    function Counter() {
      const { count, name } = useBoundStore()
      return (
        <div>
          count: {count}, name: {name}
        </div>
      )
    }

    const { findByText } = render(
      <StrictMode>
        <Counter />
      </StrictMode>,
    )

    await findByText('count: 0, name: empty')
    await findByText('count: 42, name: test-storage')
    expect(onRehydrateStorageSpy).toBeCalledWith(
      { count: 42, name: 'test-storage' },
      undefined,
    )
  })

  it('can throw rehydrate error', async () => {
    const onRehydrateStorageSpy = vi.fn()

    const storage = {
      getItem: async () => {
        throw new Error('getItem error')
      },
      setItem: () => {},
      removeItem: () => {},
    }

    const useBoundStore = create(
      persist(() => ({ count: 0 }), {
        name: 'test-storage',
        storage: createJSONStorage(() => storage),
        onRehydrateStorage: () => onRehydrateStorageSpy,
      }),
    )

    function Counter() {
      const { count } = useBoundStore()
      return <div>count: {count}</div>
    }

    const { findByText } = render(
      <StrictMode>
        <Counter />
      </StrictMode>,
    )

    await findByText('count: 0')
    await waitFor(() => {
      expect(onRehydrateStorageSpy).toBeCalledWith(
        undefined,
        new Error('getItem error'),
      )
    })
  })

  it('can persist state', async () => {
    const { storage, setItemSpy } = createPersistantStore(null)

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

    function Counter() {
      const { count } = useBoundStore()
      return <div>count: {count}</div>
    }

    const { findByText } = render(
      <StrictMode>
        <Counter />
      </StrictMode>,
    )
    await findByText('count: 0')
    await waitFor(() => {
      expect(onRehydrateStorageSpy).toBeCalledWith({ count: 0 }, undefined)
    })

    // Write something to the store
    act(() => useBoundStore.setState({ count: 42 }))
    await findByText('count: 42')
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
    function Counter2() {
      const { count } = useBoundStore2()
      return <div>count: {count}</div>
    }

    const { findByText: findByText2 } = render(
      <StrictMode>
        <Counter2 />
      </StrictMode>,
    )
    await findByText2('count: 42')
    await waitFor(() => {
      expect(onRehydrateStorageSpy2).toBeCalledWith({ count: 42 }, undefined)
    })
  })

  it('can migrate persisted state', async () => {
    const setItemSpy = vi.fn()
    const onRehydrateStorageSpy = vi.fn()
    const migrateSpy = vi.fn(() => ({ count: 99 }))

    const storage = {
      getItem: async () =>
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

    function Counter() {
      const { count } = useBoundStore()
      return <div>count: {count}</div>
    }

    const { findByText } = render(
      <StrictMode>
        <Counter />
      </StrictMode>,
    )

    await findByText('count: 0')
    await findByText('count: 99')
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

  it('can merge partial persisted state', async () => {
    const storage = {
      getItem: async () =>
        JSON.stringify({
          state: { count: 42 },
        }),
      setItem: () => {},
      removeItem: () => {},
    }

    const useBoundStore = create<{
      count: number
      name: string
      setName: (name: string) => void
    }>()(
      persist(
        (set) => ({
          count: 0,
          name: 'unknown',
          setName: (name: string) => {
            set({ name })
          },
        }),
        {
          name: 'test-storage',
          storage: createJSONStorage(() => storage),
        },
      ),
    )

    function Component() {
      const { count, setName, name } = useBoundStore()
      useEffect(() => {
        setName('test')
      }, [setName])
      return (
        <div>
          <div>count: {count}</div>
          <div>name: {name}</div>
        </div>
      )
    }

    const { findByText } = render(
      <StrictMode>
        <Component />
      </StrictMode>,
    )

    await findByText('count: 42')
    await findByText('name: test')

    expect(useBoundStore.getState()).toEqual(
      expect.objectContaining({
        count: 42,
        name: 'test',
      }),
    )
  })

  it('can correclty handle a missing migrate function', async () => {
    console.error = vi.fn()
    const onRehydrateStorageSpy = vi.fn()
    const storage = {
      getItem: async () =>
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

    function Counter() {
      const { count } = useBoundStore()
      return <div>count: {count}</div>
    }

    const { findByText } = render(
      <StrictMode>
        <Counter />
      </StrictMode>,
    )

    await findByText('count: 0')
    await waitFor(() => {
      expect(console.error).toHaveBeenCalled()
      expect(onRehydrateStorageSpy).toBeCalledWith({ count: 0 }, undefined)
    })
  })

  it('can throw migrate error', async () => {
    console.error = vi.fn()
    const onRehydrateStorageSpy = vi.fn()

    const storage = {
      getItem: async () =>
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

    function Counter() {
      const { count } = useBoundStore()
      return <div>count: {count}</div>
    }

    const { findByText } = render(
      <StrictMode>
        <Counter />
      </StrictMode>,
    )

    await findByText('count: 0')
    await waitFor(() => {
      expect(onRehydrateStorageSpy).toBeCalledWith(
        undefined,
        new Error('migrate error'),
      )
    })
  })

  it('passes the latest state to onRehydrateStorage and onHydrate on first hydrate', async () => {
    const onRehydrateStorageSpy = vi.fn()

    const storage = {
      getItem: async () => JSON.stringify({ state: { count: 1 } }),
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
     * ...
     * await waitFor(() => expect(onHydrateSpy).toBeCalledWith({ count: 0 }))
     */

    function Counter() {
      const { count } = useBoundStore()
      return <div>count: {count}</div>
    }

    const { findByText } = render(
      <StrictMode>
        <Counter />
      </StrictMode>,
    )

    await findByText('count: 1')

    // The 'onRehydrateStorage' spy is invoked prior to rehydration, so it should
    // be passed the default state.
    await waitFor(() => {
      expect(onRehydrateStorageSpy).toBeCalledWith({ count: 0 })
    })
  })

  it('gives the merged state to onRehydrateStorage', async () => {
    const onRehydrateStorageSpy = vi.fn()

    const storage = {
      getItem: async () =>
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

    function Counter() {
      const { count } = useBoundStore()
      return <div>count: {count}</div>
    }

    const { findByText } = render(
      <StrictMode>
        <Counter />
      </StrictMode>,
    )

    await findByText('count: 0')
    await waitFor(() => {
      expect(onRehydrateStorageSpy).toBeCalledWith(
        { count: 1, unstorableMethod },
        undefined,
      )
    })
  })

  it('can custom merge the stored state', async () => {
    const storage = {
      getItem: async () =>
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

    function Counter() {
      const { count } = useBoundStore()
      return <div>count: {count}</div>
    }

    const { findByText } = render(
      <StrictMode>
        <Counter />
      </StrictMode>,
    )

    await findByText('count: 1')
    expect(useBoundStore.getState()).toEqual({
      count: 1,
      actions: {
        unstorableMethod,
      },
    })
  })

  it("can merge the state when the storage item doesn't have a version", async () => {
    const storage = {
      getItem: async () =>
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

    function Counter() {
      const { count } = useBoundStore()
      return <div>count: {count}</div>
    }

    const { findByText } = render(
      <StrictMode>
        <Counter />
      </StrictMode>,
    )

    await findByText('count: 1')
    expect(useBoundStore.getState()).toEqual({
      count: 1,
    })
  })

  it('can manually rehydrate through the api', async () => {
    const storageValue = '{"state":{"count":1},"version":0}'

    const storage = {
      getItem: async () => '',
      setItem: () => {},
      removeItem: () => {},
    }

    const useBoundStore = create(
      persist(() => ({ count: 0 }), {
        name: 'test-storage',
        storage: createJSONStorage(() => storage),
      }),
    )

    storage.getItem = async () => storageValue
    await useBoundStore.persist.rehydrate()
    expect(useBoundStore.getState()).toEqual({
      count: 1,
    })
  })

  it('can check if the store has been hydrated through the api', async () => {
    const storage = {
      getItem: async () => null,
      setItem: () => {},
      removeItem: () => {},
    }

    const useBoundStore = create(
      persist(() => ({ count: 0 }), {
        name: 'test-storage',
        storage: createJSONStorage(() => storage),
      }),
    )
    expect(useBoundStore.persist.hasHydrated()).toBe(false)
    await new Promise((resolve) =>
      useBoundStore.persist.onFinishHydration(resolve),
    )
    expect(useBoundStore.persist.hasHydrated()).toBe(true)

    await useBoundStore.persist.rehydrate()
    expect(useBoundStore.persist.hasHydrated()).toBe(true)
  })

  it('can skip initial hydration', async () => {
    const storage = {
      getItem: async (name: string) => ({
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

  it('handles state updates during onRehydrateStorage', async () => {
    const storage = {
      getItem: async () => JSON.stringify({ state: { count: 1 } }),
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

    function Counter() {
      const { count } = useBoundStore()
      return <div>count: {count}</div>
    }

    const { findByText } = render(
      <StrictMode>
        <Counter />
      </StrictMode>,
    )

    await findByText('count: 2')
    expect(useBoundStore.getState().count).toEqual(2)
  })

  it('can rehydrate state with custom deserialized Map', async () => {
    const onRehydrateStorageSpy = vi.fn()
    const storage = {
      getItem: async () =>
        JSON.stringify({
          state: {
            map: { type: 'Map', value: [['foo', 'bar']] },
          },
        }),
      setItem: () => {},
      removeItem: () => {},
    }

    const useBoundStore = create(
      persist(
        () => ({
          map: new Map(),
        }),
        {
          name: 'test-storage',
          storage: createJSONStorage(() => storage, { replacer, reviver }),
          onRehydrateStorage: () => onRehydrateStorageSpy,
        },
      ),
    )

    function MapDisplay() {
      const { map } = useBoundStore()
      return <div>map: {map.get('foo')}</div>
    }

    const { findByText } = render(
      <StrictMode>
        <MapDisplay />
      </StrictMode>,
    )

    await findByText('map: bar')
    expect(onRehydrateStorageSpy).toBeCalledWith(
      { map: new Map([['foo', 'bar']]) },
      undefined,
    )
  })

  it('can persist state with custom serialization of Map', async () => {
    const { storage, setItemSpy } = createPersistantStore(null)
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

    function MapDisplay() {
      const { map } = useBoundStore()
      return <div>map-content: {map.get('foo')}</div>
    }

    const { findByText } = render(
      <StrictMode>
        <MapDisplay />
      </StrictMode>,
    )
    await findByText('map-content:')
    await waitFor(() => {
      expect(onRehydrateStorageSpy).toBeCalledWith({ map }, undefined)
    })

    // Write something to the store
    const updatedMap = new Map(map).set('foo', 'bar')
    act(() => useBoundStore.setState({ map: updatedMap }))
    await findByText('map-content: bar')

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
    function MapDisplay2() {
      const { map } = useBoundStore2()
      return <div>map-content: {map.get('foo')}</div>
    }

    const { findByText: findByText2 } = render(
      <StrictMode>
        <MapDisplay2 />
      </StrictMode>,
    )
    await findByText2('map-content: bar')
    await waitFor(() => {
      expect(onRehydrateStorageSpy2).toBeCalledWith(
        { map: updatedMap },
        undefined,
      )
    })
  })
})
