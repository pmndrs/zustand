import { expect, it, vi } from 'vitest'
import { persist } from 'zustand/middleware'
import { createStore } from 'zustand/vanilla'
import { legacyThenable } from './legacyThenable.test-utils'

it.each([false, true])(
  'restores nested state synchronously and awaits its public Promise (manual = %s)',
  async (manual) => {
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
    const done = new Promise<void>((resolve) => {
      store.persist.onFinishHydration((state) => {
        finished(state)
        resolve()
      })
    })
    const hydration = manual ? store.persist.rehydrate() : undefined
    expect(store.getState()).toEqual({ count: 42 })
    expect(other.getState()).toEqual({ count: 7 })
    expect(other.persist.hasHydrated()).toBe(true)
    expect(setItem).toHaveBeenCalledOnce()
    expect(store.persist.hasHydrated()).toBe(false)
    expect(completed).not.toHaveBeenCalled()
    expect(finished).not.toHaveBeenCalled()

    await done
    await hydration
    expect(store.persist.hasHydrated()).toBe(true)
    expect(completed).toHaveBeenCalledExactlyOnceWith({ count: 42 }, undefined)
    expect(finished).toHaveBeenCalledExactlyOnceWith({ count: 42 })
  },
)

it('awaits the public hydration Promise of a separately loaded middleware instance', async () => {
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
  expect(store.getState()).toEqual({ count: 42 })
  expect(other.getState()).toEqual({ count: 7 })
  expect(other.persist.hasHydrated()).toBe(true)
  expect(store.persist.hasHydrated()).toBe(false)
  expect(completed).not.toHaveBeenCalled()

  await new Promise<void>((resolve) => {
    store.persist.onFinishHydration(() => resolve())
  })
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
  async (manual) => {
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
    const hydration = manual ? store.persist.rehydrate() : undefined

    expect(store.getState()).toEqual({ count: 42 })
    expect(store.persist.hasHydrated()).toBe(true)
    expect(completed).toHaveBeenCalledExactlyOnceWith({ count: 42 }, undefined)
    await hydration
  },
)

it.each([false, true])(
  'does not leave hydration pending for a rejected legacy wrapper (manual = %s)',
  async (manual) => {
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
    const hydration = manual ? store.persist.rehydrate() : undefined

    // Preserve the base implementation's completion behavior. Propagating
    // errors from legacy write results is a separate, existing limitation.
    expect(store.persist.hasHydrated()).toBe(true)
    expect(completed).toHaveBeenCalledExactlyOnceWith({ count: 42 }, undefined)
    await hydration
  },
)

it('keeps synchronous write handling for a later hydration while an older read is pending', async () => {
  type Stored = { state: { count: number }; version: number }
  let resolve!: (value: Stored) => void
  const pendingRead = new Promise<Stored>((done) => {
    resolve = done
  })
  const completed = vi.fn()
  const setItem = vi.fn(() =>
    legacyThenable(() => {
      throw new Error('legacy write error')
    })(undefined),
  )
  let reads = 0
  const store = createStore(
    persist(() => ({ count: 0 }), {
      name: 'repeated-hydration',
      version: 1,
      skipHydration: true,
      storage: {
        getItem: () =>
          ++reads === 1 ? pendingRead : { state: { count: 42 }, version: 0 },
        setItem,
        removeItem: () => {},
      },
      migrate: (state) => state as { count: number },
      onRehydrateStorage: () => completed,
    }),
  )

  const older = store.persist.rehydrate()
  const newer = store.persist.rehydrate()
  expect(store.getState()).toEqual({ count: 42 })
  expect(store.persist.hasHydrated()).toBe(true)
  expect(completed).toHaveBeenCalledExactlyOnceWith({ count: 42 }, undefined)
  await newer

  resolve({ state: { count: 7 }, version: 0 })
  await older
  expect(store.getState()).toEqual({ count: 42 })
  expect(setItem).toHaveBeenCalledOnce()
  expect(completed).toHaveBeenCalledOnce()
})

it('keeps the outer synchronous write handling after a nested hydration returns', async () => {
  const other = createStore(
    persist(() => ({ count: 0 }), {
      name: 'nested-sync',
      skipHydration: true,
      storage: {
        getItem: () => ({ state: { count: 7 }, version: 0 }),
        setItem: () => {},
        removeItem: () => {},
      },
    }),
  )
  let nested!: Promise<void>
  const completed = vi.fn()
  const store = createStore(
    persist(() => ({ count: 0 }), {
      name: 'outer-sync',
      version: 1,
      skipHydration: true,
      storage: {
        getItem: () => ({ state: { count: 42 }, version: 0 }),
        setItem: () => {
          nested = other.persist.rehydrate()
          return legacyThenable(() => {
            throw new Error('legacy write error')
          })(undefined)
        },
        removeItem: () => {},
      },
      migrate: (state) => state as { count: number },
      onRehydrateStorage: () => completed,
    }),
  )

  const hydration = store.persist.rehydrate()
  expect(other.getState()).toEqual({ count: 7 })
  expect(store.getState()).toEqual({ count: 42 })
  expect(store.persist.hasHydrated()).toBe(true)
  expect(completed).toHaveBeenCalledExactlyOnceWith({ count: 42 }, undefined)
  await Promise.all([hydration, nested])
})
