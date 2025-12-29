/// <reference types="node" />

import { StrictMode, useEffect } from 'react'
import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { replacer, reviver, sleep } from './test-utils'

const createPersistantStore = (initialValue: string | null) => {
  let state = initialValue

  const getItem = async (): Promise<string | null> => {
    getItemSpy()
    await sleep(10)
    return state
  }
  const setItem = async (name: string, newState: string) => {
    setItemSpy(name, newState)
    await sleep(10)
    state = newState
  }

  const removeItem = async (name: string) => {
    removeItemSpy(name)
    await sleep(10)
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

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    console.error = consoleError
  })

  it('can rehydrate state', async () => {
    const onRehydrateStorageSpy = vi.fn()
    const storage = {
      getItem: async (name: string) => {
        await sleep(10)
        return JSON.stringify({
          state: { count: 42, name },
          version: 0,
        })
      },
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

    render(
      <StrictMode>
        <Counter />
      </StrictMode>,
    )

    expect(screen.getByText('count: 0, name: empty')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(
      screen.getByText('count: 42, name: test-storage'),
    ).toBeInTheDocument()
    expect(onRehydrateStorageSpy).toHaveBeenCalledWith(
      { count: 42, name: 'test-storage' },
      undefined,
    )
  })

  it('can throw rehydrate error', async () => {
    const onRehydrateStorageSpy = vi.fn()

    const storage = {
      getItem: async () => {
        await sleep(10)
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

    render(
      <StrictMode>
        <Counter />
      </StrictMode>,
    )

    expect(screen.getByText('count: 0')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(onRehydrateStorageSpy).toHaveBeenCalledWith(
      undefined,
      new Error('getItem error'),
    )
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

    render(
      <StrictMode>
        <Counter />
      </StrictMode>,
    )

    expect(screen.getByText('count: 0')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(onRehydrateStorageSpy).toHaveBeenCalledWith({ count: 0 }, undefined)

    // Write something to the store
    act(() => {
      useBoundStore.setState({ count: 42 })
    })
    expect(screen.getByText('count: 42')).toBeInTheDocument()
    expect(setItemSpy).toHaveBeenCalledWith(
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
      return <div>count2: {count}</div>
    }

    render(
      <StrictMode>
        <Counter2 />
      </StrictMode>,
    )

    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(screen.getByText('count2: 42')).toBeInTheDocument()
    expect(onRehydrateStorageSpy2).toHaveBeenCalledWith(
      { count: 42 },
      undefined,
    )
  })

  it('can async migrate persisted state', async () => {
    const setItemSpy = vi.fn()
    const onRehydrateStorageSpy = vi.fn()
    const migrateSpy = vi.fn(async () => {
      await sleep(10)
      return { count: 99 }
    })

    const storage = {
      getItem: async () => {
        await sleep(10)
        return JSON.stringify({
          state: { count: 42 },
          version: 12,
        })
      },
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

    render(
      <StrictMode>
        <Counter />
      </StrictMode>,
    )

    expect(screen.getByText('count: 0')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(20))
    expect(screen.getByText('count: 99')).toBeInTheDocument()
    expect(migrateSpy).toHaveBeenCalledWith({ count: 42 }, 12)
    expect(setItemSpy).toHaveBeenCalledWith(
      'test-storage',
      JSON.stringify({
        state: { count: 99 },
        version: 13,
      }),
    )
    expect(onRehydrateStorageSpy).toHaveBeenCalledWith({ count: 99 }, undefined)
  })

  it('can merge partial persisted state', async () => {
    const storage = {
      getItem: async () => {
        await sleep(10)
        return JSON.stringify({
          state: { count: 42 },
        })
      },
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

    render(
      <StrictMode>
        <Component />
      </StrictMode>,
    )

    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(screen.getByText('count: 42')).toBeInTheDocument()
    expect(screen.getByText('name: test')).toBeInTheDocument()

    expect(useBoundStore.getState()).toEqual(
      expect.objectContaining({
        count: 42,
        name: 'test',
      }),
    )
  })

  it('can correctly handle a missing migrate function', async () => {
    console.error = vi.fn()
    const onRehydrateStorageSpy = vi.fn()
    const storage = {
      getItem: async () => {
        await sleep(10)
        return JSON.stringify({
          state: { count: 42 },
          version: 12,
        })
      },
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

    render(
      <StrictMode>
        <Counter />
      </StrictMode>,
    )

    expect(screen.getByText('count: 0')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(console.error).toHaveBeenCalled()
    expect(onRehydrateStorageSpy).toHaveBeenCalledWith({ count: 0 }, undefined)
  })

  it('can throw migrate error', async () => {
    console.error = vi.fn()
    const onRehydrateStorageSpy = vi.fn()

    const storage = {
      getItem: async () => {
        await sleep(10)
        return JSON.stringify({
          state: {},
          version: 12,
        })
      },
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

    render(
      <StrictMode>
        <Counter />
      </StrictMode>,
    )

    expect(screen.getByText('count: 0')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(onRehydrateStorageSpy).toHaveBeenCalledWith(
      undefined,
      new Error('migrate error'),
    )
  })

  it('passes the latest state to onRehydrateStorage and onHydrate on first hydrate', async () => {
    const onRehydrateStorageSpy = vi.fn()

    const storage = {
      getItem: async () => {
        await sleep(10)
        return JSON.stringify({ state: { count: 1 } })
      },
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
     * await act(() => vi.advanceTimersByTimeAsync(10))
     * expect(onHydrateSpy).toHaveBeenCalledWith({ count: 0 })
     */

    function Counter() {
      const { count } = useBoundStore()
      return <div>count: {count}</div>
    }

    render(
      <StrictMode>
        <Counter />
      </StrictMode>,
    )

    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(screen.getByText('count: 1')).toBeInTheDocument()

    // The 'onRehydrateStorage' spy is invoked prior to rehydration, so it should
    // be passed the default state.
    expect(onRehydrateStorageSpy).toHaveBeenCalledWith({ count: 0 })
  })

  it('gives the merged state to onRehydrateStorage', async () => {
    const onRehydrateStorageSpy = vi.fn()

    const storage = {
      getItem: async () => {
        await sleep(10)
        return JSON.stringify({
          state: { count: 1 },
          version: 0,
        })
      },
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

    render(
      <StrictMode>
        <Counter />
      </StrictMode>,
    )

    expect(screen.getByText('count: 0')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(onRehydrateStorageSpy).toHaveBeenCalledWith(
      { count: 1, unstorableMethod },
      undefined,
    )
  })

  it('can custom merge the stored state', async () => {
    const storage = {
      getItem: async () => {
        await sleep(10)
        return JSON.stringify({
          state: {
            count: 1,
            actions: {},
          },
          version: 0,
        })
      },
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

    render(
      <StrictMode>
        <Counter />
      </StrictMode>,
    )

    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(screen.getByText('count: 1')).toBeInTheDocument()
    expect(useBoundStore.getState()).toEqual({
      count: 1,
      actions: {
        unstorableMethod,
      },
    })
  })

  it("can merge the state when the storage item doesn't have a version", async () => {
    const storage = {
      getItem: async () => {
        await sleep(10)
        return JSON.stringify({
          state: {
            count: 1,
          },
        })
      },
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

    render(
      <StrictMode>
        <Counter />
      </StrictMode>,
    )

    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(screen.getByText('count: 1')).toBeInTheDocument()
    expect(useBoundStore.getState()).toEqual({
      count: 1,
    })
  })

  it('can manually rehydrate through the api', async () => {
    const storageValue = '{"state":{"count":1},"version":0}'

    const storage = {
      getItem: async () => {
        await sleep(10)
        return ''
      },
      setItem: () => {},
      removeItem: () => {},
    }

    const useBoundStore = create(
      persist(() => ({ count: 0 }), {
        name: 'test-storage',
        storage: createJSONStorage(() => storage),
      }),
    )

    storage.getItem = async () => {
      await sleep(10)
      return storageValue
    }
    const rehydratePromise = useBoundStore.persist.rehydrate()
    await act(() => vi.advanceTimersByTimeAsync(10))
    await rehydratePromise
    expect(useBoundStore.getState()).toEqual({
      count: 1,
    })
  })

  it('can check if the store has been hydrated through the api', async () => {
    const storage = {
      getItem: async () => {
        await sleep(10)
        return null
      },
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
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(useBoundStore.persist.hasHydrated()).toBe(true)

    const rehydratePromise = useBoundStore.persist.rehydrate()
    await act(() => vi.advanceTimersByTimeAsync(10))
    await rehydratePromise
    expect(useBoundStore.persist.hasHydrated()).toBe(true)
  })

  it('can skip initial hydration', async () => {
    const storage = {
      getItem: async (name: string) => {
        await sleep(10)
        return {
          state: { count: 42, name },
          version: 0,
        }
      },
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

    // Asserting store hasn't hydrated
    expect(useBoundStore.persist.hasHydrated()).toBe(false)

    const rehydratePromise = useBoundStore.persist.rehydrate()
    await act(() => vi.advanceTimersByTimeAsync(10))
    await rehydratePromise

    expect(useBoundStore.getState()).toEqual({
      count: 42,
      name: 'test-storage',
    })
    expect(onRehydrateStorageSpy).toHaveBeenCalledWith(
      { count: 42, name: 'test-storage' },
      undefined,
    )
  })

  it('handles state updates during onRehydrateStorage', async () => {
    const storage = {
      getItem: async () => {
        await sleep(10)
        return JSON.stringify({ state: { count: 1 } })
      },
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

    render(
      <StrictMode>
        <Counter />
      </StrictMode>,
    )

    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(screen.getByText('count: 2')).toBeInTheDocument()
    expect(useBoundStore.getState().count).toEqual(2)
  })

  it('can rehydrate state with custom deserialized Map', async () => {
    const onRehydrateStorageSpy = vi.fn()
    const storage = {
      getItem: async () => {
        await sleep(10)
        return JSON.stringify({
          state: {
            map: { type: 'Map', value: [['foo', 'bar']] },
          },
        })
      },
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

    render(
      <StrictMode>
        <MapDisplay />
      </StrictMode>,
    )

    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(screen.getByText('map: bar')).toBeInTheDocument()
    expect(onRehydrateStorageSpy).toHaveBeenCalledWith(
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

    render(
      <StrictMode>
        <MapDisplay />
      </StrictMode>,
    )

    expect(screen.getByText('map-content:')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(onRehydrateStorageSpy).toHaveBeenCalledWith({ map }, undefined)

    // Write something to the store
    const updatedMap = new Map(map).set('foo', 'bar')
    act(() => {
      useBoundStore.setState({ map: updatedMap })
    })
    expect(screen.getByText('map-content: bar')).toBeInTheDocument()

    expect(setItemSpy).toHaveBeenCalledWith(
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
      return <div>map-content2: {map.get('foo')}</div>
    }

    render(
      <StrictMode>
        <MapDisplay2 />
      </StrictMode>,
    )

    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(screen.getByText('map-content2: bar')).toBeInTheDocument()
    expect(onRehydrateStorageSpy2).toHaveBeenCalledWith(
      { map: updatedMap },
      undefined,
    )
  })
})
