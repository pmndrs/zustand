import { expect, it, vi } from 'vitest'
import { persist } from 'zustand/middleware'
import { createStore } from 'zustand/vanilla'
import { legacyThenable } from './legacyThenable.test-utils'

it.each([false, true])(
  'finishes nested synchronous hydration before returning (manual = %s)',
  (manual) => {
    const other = createStore(
      persist(() => ({ count: 0 }), {
        name: 'other',
        skipHydration: true,
        storage: {
          getItem: () => ({ state: { count: 7 }, version: 0 }),
          setItem: () => {},
          removeItem: () => {},
        },
      }),
    )
    const completed = vi.fn()
    const setItem = vi.fn(() => other.persist.rehydrate())
    const store = createStore(
      persist(() => ({ count: 0 }), {
        name: 'main',
        version: 1,
        skipHydration: manual,
        storage: {
          getItem: () => ({ state: { count: 42 }, version: 0 }),
          setItem,
          removeItem: () => {},
        },
        migrate: (state) => state as { count: number },
        onRehydrateStorage: () => completed,
      }),
    )
    const finished = vi.fn()
    store.persist.onFinishHydration(finished)
    if (manual) {
      store.persist.rehydrate()
    }
    expect(finished.mock.calls).toEqual(manual ? [[{ count: 42 }]] : [])
    expect(store.getState()).toEqual({ count: 42 })
    expect(other.getState()).toEqual({ count: 7 })
    expect(setItem).toHaveBeenCalledOnce()
    expect(store.persist.hasHydrated()).toBe(true)
    expect(completed).toHaveBeenCalledExactlyOnceWith({ count: 42 }, undefined)
  },
)

it('preserves synchronous hydration across separately loaded middleware instances', async () => {
  vi.resetModules()
  const { persist: otherPersist } = await import('zustand/middleware')
  expect(otherPersist).not.toBe(persist)
  const other = createStore(
    otherPersist(() => ({ count: 0 }), {
      name: 'other',
      skipHydration: true,
      storage: {
        getItem: () => ({ state: { count: 7 }, version: 0 }),
        setItem: () => {},
        removeItem: () => {},
      },
    }),
  )
  const completed = vi.fn()
  const store = createStore(
    persist(() => ({ count: 0 }), {
      name: 'main',
      version: 1,
      storage: {
        getItem: () => ({ state: { count: 42 }, version: 0 }),
        setItem: () => other.persist.rehydrate(),
        removeItem: () => {},
      },
      migrate: (state) => state as { count: number },
      onRehydrateStorage: () => completed,
    }),
  )
  expect(store.persist.hasHydrated()).toBe(true)
  expect(completed).toHaveBeenCalledExactlyOnceWith({ count: 42 }, undefined)
})

it('keeps callable then fields inside stored state without invoking them', () => {
  const then = vi.fn()
  const saved = { count: 42, then }
  const store = createStore(
    persist(() => ({ count: 0, then }), {
      name: 'state-actions',
      storage: {
        getItem: () => ({ state: saved, version: 0 }),
        setItem: () => {},
        removeItem: () => {},
      },
    }),
  )
  expect(store.getState()).toEqual(saved)
  expect(store.persist.hasHydrated()).toBe(true)
  expect(then).not.toHaveBeenCalled()
})

it.each([false, true])(
  'finishes synchronously with a write result from the previous implementation (manual = %s)',
  (manual) => {
    const completed = vi.fn()
    const store = createStore(
      persist(() => ({ count: 0 }), {
        name: 'legacy',
        version: 1,
        skipHydration: manual,
        storage: {
          getItem: () => ({ state: { count: 42 }, version: 0 }),
          setItem: () => legacyThenable(() => undefined)(undefined),
          removeItem: () => {},
        },
        migrate: (state) => state as { count: number },
        onRehydrateStorage: () => completed,
      }),
    )
    if (manual) store.persist.rehydrate()

    expect(store.getState()).toEqual({ count: 42 })
    expect(store.persist.hasHydrated()).toBe(true)
    expect(completed).toHaveBeenCalledExactlyOnceWith({ count: 42 }, undefined)
  },
)

it.each([false, true])(
  'does not leave hydration pending for a rejected legacy wrapper (manual = %s)',
  (manual) => {
    const completed = vi.fn()
    const store = createStore(
      persist(() => ({ count: 0 }), {
        name: 'legacy-rejection',
        version: 1,
        skipHydration: manual,
        storage: {
          getItem: () => ({ state: { count: 42 }, version: 0 }),
          setItem: () =>
            legacyThenable(() => {
              throw new Error('legacy hydration callback failed')
            })(undefined),
          removeItem: () => {},
        },
        migrate: (state) => state as { count: number },
        onRehydrateStorage: () => completed,
      }),
    )
    if (manual) store.persist.rehydrate()

    // Preserve the base implementation's completion behavior. Propagating
    // errors from legacy write results is a separate, existing limitation.
    expect(store.persist.hasHydrated()).toBe(true)
    expect(completed).toHaveBeenCalledExactlyOnceWith({ count: 42 }, undefined)
  },
)
