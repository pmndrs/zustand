import { act, render, waitFor } from '@testing-library/react'
import create from 'zustand'
import { persist } from 'zustand/middleware'

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

  const getItemSpy = jest.fn()
  const setItemSpy = jest.fn()
  const removeItemSpy = jest.fn()

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
    const onRehydrateStorageSpy = jest.fn()
    const storage = {
      getItem: async (name: string) =>
        JSON.stringify({
          state: { count: 42, name },
          version: 0,
        }),
      setItem: () => {},
      removeItem: () => {},
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
      removeItem: () => {},
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
    await waitFor(() => {
      expect(onRehydrateStorageSpy).toBeCalledWith(
        undefined,
        new Error('getItem error')
      )
    })
  })

  it('can persist state', async () => {
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

    function Counter() {
      const { count } = useStore()
      return <div>count: {count}</div>
    }

    const { findByText } = render(<Counter />)
    await findByText('count: 0')
    await waitFor(() => {
      expect(onRehydrateStorageSpy).toBeCalledWith({ count: 0 }, undefined)
    })

    // Write something to the store
    act(() => useStore.setState({ count: 42 }))
    await findByText('count: 42')
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
    function Counter2() {
      const { count } = useStore2()
      return <div>count: {count}</div>
    }

    const { findByText: findByText2 } = render(<Counter2 />)
    await findByText2('count: 42')
    await waitFor(() => {
      expect(onRehydrateStorageSpy2).toBeCalledWith({ count: 42 }, undefined)
    })
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

    function Counter() {
      const { count } = useStore()
      return <div>count: {count}</div>
    }

    const { findByText } = render(<Counter />)

    await findByText('count: 0')
    await waitFor(() => {
      expect(console.error).toHaveBeenCalled()
      expect(onRehydrateStorageSpy).toBeCalledWith({ count: 0 }, undefined)
    })
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

    function Counter() {
      const { count } = useStore()
      return <div>count: {count}</div>
    }

    const { findByText } = render(<Counter />)

    await findByText('count: 0')
    await waitFor(() => {
      expect(onRehydrateStorageSpy).toBeCalledWith(
        undefined,
        new Error('migrate error')
      )
    })
  })

  it('gives the merged state to onRehydrateStorage', async () => {
    const onRehydrateStorageSpy = jest.fn()

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

    const useStore = create(
      persist(() => ({ count: 0, unstorableMethod }), {
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
    await waitFor(() => {
      expect(onRehydrateStorageSpy).toBeCalledWith(
        { count: 1, unstorableMethod },
        undefined
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

    function Counter() {
      const { count } = useStore()
      return <div>count: {count}</div>
    }

    const { findByText } = render(<Counter />)

    await findByText('count: 1')
    expect(useStore.getState()).toEqual({
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

    const useStore = create(
      persist(() => ({ count: 0 }), {
        name: 'test-storage',
        getStorage: () => storage,
        deserialize: (str) => JSON.parse(str),
      })
    )

    function Counter() {
      const { count } = useStore()
      return <div>count: {count}</div>
    }

    const { findByText } = render(<Counter />)

    await findByText('count: 1')
    expect(useStore.getState()).toEqual({
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

    const useStore = create(
      persist(() => ({ count: 0 }), {
        name: 'test-storage',
        getStorage: () => storage,
      })
    )

    storage.getItem = async () => storageValue
    await useStore.persist.rehydrate()
    expect(useStore.getState()).toEqual({
      count: 1,
    })
  })

  it('can check if the store has been hydrated through the api', async () => {
    const storage = {
      getItem: async () => null,
      setItem: () => {},
      removeItem: () => {},
    }

    const useStore = create(
      persist(() => ({ count: 0 }), {
        name: 'test-storage',
        getStorage: () => storage,
      })
    )
    expect(useStore.persist.hasHydrated()).toBe(false)
    await new Promise((resolve) => useStore.persist.onFinishHydration(resolve))
    expect(useStore.persist.hasHydrated()).toBe(true)

    await useStore.persist.rehydrate()
    expect(useStore.persist.hasHydrated()).toBe(true)
  })
})
