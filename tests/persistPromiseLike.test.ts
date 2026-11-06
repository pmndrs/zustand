import { runInNewContext } from 'node:vm'
import { expect, it, vi } from 'vitest'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { PersistOptions } from 'zustand/middleware'
import { createStore } from 'zustand/vanilla'

type State = { count: number }

const saved = { state: { count: 42 }, version: 0 }
const migrated = { count: 43 }
const syncStorage = {
  getItem: () => saved,
  setItem: () => {},
  removeItem: () => {},
}

function createPromiseLike<T>(promise: Promise<T>): PromiseLike<T> {
  return {
    then(onFulfilled, onRejected) {
      return createPromiseLike(promise.then(onFulfilled, onRejected))
    },
  }
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: Error) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function createPersistedStore(
  options: Omit<PersistOptions<State>, 'name' | 'skipHydration'>,
) {
  return createStore(
    persist((): State => ({ count: 0 }), {
      name: 'test-storage',
      skipHydration: true,
      ...options,
    }),
  )
}

it('hydrates from a PromiseLike read through createJSONStorage', async () => {
  const store = createPersistedStore({
    storage: createJSONStorage<State>(() => ({
      ...syncStorage,
      getItem: () => createPromiseLike(Promise.resolve(JSON.stringify(saved))),
    })),
  })

  await store.persist.rehydrate()

  expect(store.getState()).toEqual(saved.state)
  expect(store.persist.hasHydrated()).toBe(true)
})

it('hydrates from a PromiseLike read through custom storage', async () => {
  const store = createPersistedStore({
    storage: {
      ...syncStorage,
      getItem: () => createPromiseLike(Promise.resolve(saved)),
    },
  })

  await store.persist.rehydrate()

  expect(store.getState()).toEqual(saved.state)
  expect(store.persist.hasHydrated()).toBe(true)
})

it('waits for a PromiseLike migration before writing the migrated state', async () => {
  const migration = deferred<State>()
  const setItem = vi.fn()
  const store = createPersistedStore({
    storage: { ...syncStorage, setItem },
    version: 1,
    migrate: () => createPromiseLike(migration.promise),
  })

  const hydration = store.persist.rehydrate()
  expect(setItem).not.toHaveBeenCalled()

  migration.resolve(migrated)
  await hydration

  expect(store.getState()).toEqual(migrated)
  expect(setItem).toHaveBeenCalledExactlyOnceWith('test-storage', {
    state: migrated,
    version: 1,
  })
})

it('reports a rejected PromiseLike migration without writing to storage', async () => {
  const error = new Error('migration failed')
  const migration = deferred<State>()
  const setItem = vi.fn()
  const completed = vi.fn()
  const store = createPersistedStore({
    storage: { ...syncStorage, setItem },
    version: 1,
    migrate: () => createPromiseLike(migration.promise),
    onRehydrateStorage: () => completed,
  })

  const hydration = store.persist.rehydrate()
  migration.reject(error)
  await Promise.all([hydration, migration.promise.catch(() => {})])

  expect(setItem).not.toHaveBeenCalled()
  expect(store.persist.hasHydrated()).toBe(false)
  expect(completed).toHaveBeenCalledExactlyOnceWith(undefined, error)
})

it('waits for a PromiseLike migration write before completing hydration', async () => {
  const write = deferred<void>()
  const setItem = vi.fn(() => createPromiseLike(write.promise))
  const completed = vi.fn()
  const store = createPersistedStore({
    storage: { ...syncStorage, setItem },
    version: 1,
    migrate: () => migrated,
    onRehydrateStorage: () => completed,
  })

  const hydration = store.persist.rehydrate()
  expect(setItem).toHaveBeenCalledOnce()
  expect(store.persist.hasHydrated()).toBe(false)
  expect(completed).not.toHaveBeenCalled()

  write.resolve()
  await hydration

  expect(store.persist.hasHydrated()).toBe(true)
  expect(completed).toHaveBeenCalledExactlyOnceWith(migrated, undefined)
})

it('reports a rejected PromiseLike migration write', async () => {
  const error = new Error('write failed')
  const write = deferred<void>()
  const completed = vi.fn()
  const store = createPersistedStore({
    storage: {
      ...syncStorage,
      setItem: () => createPromiseLike(write.promise),
    },
    version: 1,
    migrate: () => migrated,
    onRehydrateStorage: () => completed,
  })

  const hydration = store.persist.rehydrate()
  write.reject(error)
  await Promise.all([hydration, write.promise.catch(() => {})])

  expect(store.persist.hasHydrated()).toBe(false)
  expect(completed).toHaveBeenCalledExactlyOnceWith(undefined, error)
})

it('returns a native Promise while applying synchronous hydration immediately', async () => {
  const store = createPersistedStore({ storage: syncStorage })

  expect(store.getState()).toEqual({ count: 0 })
  const hydration = store.persist.rehydrate()

  expect(hydration).toBeInstanceOf(Promise)
  expect(store.getState()).toEqual(saved.state)
  expect(store.persist.hasHydrated()).toBe(true)
  await hydration
})

it('uses the migration result from a cross-realm Promise', async () => {
  const migration: Promise<State> = runInNewContext('Promise.resolve(state)', {
    state: migrated,
  })
  expect(migration).not.toBeInstanceOf(Promise)
  const store = createPersistedStore({
    storage: syncStorage,
    version: 1,
    migrate: () => migration,
  })

  await store.persist.rehydrate()

  expect(store.getState()).toEqual(migrated)
})
