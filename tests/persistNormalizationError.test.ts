import { expect, it, vi } from 'vitest'
import { persist } from 'zustand/middleware'
import { createStore } from 'zustand/vanilla'

it.each(['constructor', 'then accessor'])(
  'preserves the original migration error when the %s throws during normalization',
  async (kind) => {
    const saved = { count: 42 }
    const error = new Error('normalization failed')
    let migration: Promise<typeof saved>
    if (kind === 'constructor') {
      migration = Promise.resolve(saved)
      Object.defineProperty(migration, 'constructor', {
        get() {
          throw error
        },
      })
    } else {
      const promise = Promise.resolve(saved)
      let reads = 0
      migration = {
        get then() {
          if (++reads === 2) throw error
          return promise.then.bind(promise)
        },
      } as Promise<typeof saved>
    }
    const completed = vi.fn()
    const setItem = vi.fn()
    const store = createStore(
      persist(() => ({ count: 0 }), {
        name: 'normalization',
        version: 1,
        skipHydration: true,
        storage: {
          getItem: () => ({ state: saved, version: 0 }),
          setItem,
          removeItem: () => {},
        },
        migrate: () => migration,
        onRehydrateStorage: () => completed,
      }),
    )

    await store.persist.rehydrate()

    expect(store.persist.hasHydrated()).toBe(false)
    expect(store.getState()).toEqual({ count: 0 })
    expect(completed).toHaveBeenCalledExactlyOnceWith(undefined, error)
    expect(setItem).not.toHaveBeenCalled()
  },
)
