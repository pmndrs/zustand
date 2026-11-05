import { expect, it, vi } from 'vitest'
import { persist } from 'zustand/middleware'
import { createStore } from 'zustand/vanilla'
import { legacyThenable } from './legacyThenable.test-utils'
import { createPromiseLike } from './test-utils'

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
  'awaits a synchronous PromiseLike write result (manual = %s)',
  async (manual) => {
    const completed = vi.fn()
    const write: PromiseLike<void> = {
      then(onFulfilled) {
        try {
          return Promise.resolve(
            onFulfilled ? onFulfilled(undefined) : (undefined as never),
          )
        } catch (error) {
          return Promise.reject(error)
        }
      },
    }
    const store = createStore(
      persist(() => ({ count: 0 }), {
        name: 'synchronous-promise-like',
        version: 1,
        skipHydration: manual,
        storage: {
          getItem: () => ({ state: { count: 42 }, version: 0 }),
          setItem: () => write,
          removeItem: () => {},
        },
        migrate: (state) => state as { count: number },
        onRehydrateStorage: () => completed,
      }),
    )
    const hydration = manual ? store.persist.rehydrate() : undefined

    expect(store.getState()).toEqual({ count: 42 })
    await hydration
    expect(store.persist.hasHydrated()).toBe(true)
    expect(completed).toHaveBeenCalledExactlyOnceWith({ count: 42 }, undefined)
  },
)

it.each([false, true])(
  'reports a PromiseLike write rejection after awaiting hydration (manual = %s)',
  async (manual) => {
    const error = new Error('write failed')
    let finish!: () => void
    const done = new Promise<void>((resolve) => {
      finish = resolve
    })
    const completed = vi.fn(() => finish())
    const store = createStore(
      persist(() => ({ count: 0 }), {
        name: 'promise-like-rejection',
        version: 1,
        skipHydration: manual,
        storage: {
          getItem: () => ({ state: { count: 42 }, version: 0 }),
          setItem: () => createPromiseLike(Promise.reject(error)),
          removeItem: () => {},
        },
        migrate: (state) => state as { count: number },
        onRehydrateStorage: () => completed,
      }),
    )
    const hydration = manual ? store.persist.rehydrate() : undefined

    await hydration
    await done
    expect(store.persist.hasHydrated()).toBe(false)
    expect(completed).toHaveBeenCalledExactlyOnceWith(undefined, error)
  },
)

it('settles a later hydration while an older read is pending', async () => {
  type Stored = { state: { count: number }; version: number }
  let resolve!: (value: Stored) => void
  const pendingRead = new Promise<Stored>((done) => {
    resolve = done
  })
  const completed = vi.fn()
  const error = new Error('write failed')
  const setItem = vi.fn(() => createPromiseLike(Promise.reject(error)))
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
  await newer
  expect(store.persist.hasHydrated()).toBe(false)
  expect(completed).toHaveBeenCalledExactlyOnceWith(undefined, error)

  resolve({ state: { count: 7 }, version: 0 })
  await older
  expect(store.getState()).toEqual({ count: 42 })
  expect(setItem).toHaveBeenCalledOnce()
  expect(completed).toHaveBeenCalledOnce()
})

it('settles an outer hydration after a nested hydration returns', async () => {
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
  const error = new Error('write failed')
  const store = createStore(
    persist(() => ({ count: 0 }), {
      name: 'outer-sync',
      version: 1,
      skipHydration: true,
      storage: {
        getItem: () => ({ state: { count: 42 }, version: 0 }),
        setItem: () => {
          nested = other.persist.rehydrate()
          return createPromiseLike(Promise.reject(error))
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
  await hydration
  await nested
  expect(store.persist.hasHydrated()).toBe(false)
  expect(completed).toHaveBeenCalledExactlyOnceWith(undefined, error)
})

it.each([false, true])(
  'returns an awaitable native Promise for a fulfilled legacy write (manual = %s)',
  async (manual) => {
    const completed = vi.fn()
    const store = createStore(
      persist(() => ({ count: 0 }), {
        name: 'legacy-fulfillment',
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
    expect(hydration instanceof Promise).toBe(manual)
    await hydration
    expect(store.persist.hasHydrated()).toBe(true)
    expect(completed).toHaveBeenCalledExactlyOnceWith({ count: 42 }, undefined)
  },
)

it.each([false, true])(
  'leaves hydration pending for a rejected legacy write (manual = %s)',
  async (manual) => {
    const error = new Error('legacy hydration callback failed')
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
              throw error
            })(undefined),
          removeItem: () => {},
        },
        migrate: (state) => state as { count: number },
        onRehydrateStorage: () => completed,
      }),
    )
    const hydration = manual ? store.persist.rehydrate() : undefined
    const settled = vi.fn()
    void hydration?.then(settled, settled)

    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(store.getState()).toEqual({ count: 42 })
    expect(store.persist.hasHydrated()).toBe(false)
    expect(completed).not.toHaveBeenCalled()
    expect(settled).not.toHaveBeenCalled()
  },
)

it('keeps an older read from overwriting state when a newer legacy write stays pending', async () => {
  type Stored = { state: { count: number }; version: number }
  let resolve!: (value: Stored) => void
  const pendingRead = new Promise<Stored>((done) => {
    resolve = done
  })
  const completed = vi.fn()
  const error = new Error('legacy write error')
  const setItem = vi.fn(() =>
    legacyThenable(() => {
      throw error
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
  const settled = vi.fn()
  void newer.then(settled, settled)
  expect(store.getState()).toEqual({ count: 42 })

  resolve({ state: { count: 7 }, version: 0 })
  await older
  expect(store.getState()).toEqual({ count: 42 })
  expect(setItem).toHaveBeenCalledOnce()
  expect(store.persist.hasHydrated()).toBe(false)
  expect(completed).not.toHaveBeenCalled()
  expect(settled).not.toHaveBeenCalled()
})

it('finishes nested hydration when the outer legacy write stays pending', async () => {
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
  const error = new Error('legacy write error')
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
            throw error
          })(undefined)
        },
        removeItem: () => {},
      },
      migrate: (state) => state as { count: number },
      onRehydrateStorage: () => completed,
    }),
  )

  const hydration = store.persist.rehydrate()
  const settled = vi.fn()
  void hydration.then(settled, settled)
  expect(other.getState()).toEqual({ count: 7 })
  expect(store.getState()).toEqual({ count: 42 })
  await nested
  expect(other.persist.hasHydrated()).toBe(true)
  expect(store.persist.hasHydrated()).toBe(false)
  expect(completed).not.toHaveBeenCalled()
  expect(settled).not.toHaveBeenCalled()
})
