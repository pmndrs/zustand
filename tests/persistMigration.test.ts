import { runInNewContext } from 'node:vm'
import { describe, expect, it, vi } from 'vitest'
import { createJSONStorage, persist } from 'zustand/middleware'
import { createStore } from 'zustand/vanilla'
import { createPromiseLike } from './test-utils'

type State = { drafts: string[] }
type Deferred<T> = {
  promise: Promise<T>
  resolve: (value: T) => void
  reject: (error: Error) => void
}

const deferred = <T>(kind: string): Deferred<T> => {
  if (kind === 'another realm') {
    return runInNewContext(`(() => {
      let resolve, reject;
      const promise = new Promise((res, rej) => { resolve = res; reject = rej });
      return { promise, resolve, reject };
    })()`)
  }
  let resolve!: (value: T) => void
  let reject!: (error: Error) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return {
    promise:
      kind === 'PromiseLike without catch'
        ? (createPromiseLike(promise) as Promise<T>)
        : kind === 'compatible implementation'
          ? {
              then: promise.then.bind(promise),
              catch: promise.catch.bind(promise),
              finally: promise.finally.bind(promise),
              [Symbol.toStringTag]: 'Promise',
            }
          : promise,
    resolve,
    reject,
  }
}

describe.each([
  'native',
  'another realm',
  'compatible implementation',
  'PromiseLike without catch',
])('persist migration with a Promise from %s', (kind) => {
  it('waits for migration before replacing persisted data and advancing its version', async () => {
    const original = { state: { drafts: ['saved draft'] }, version: 1 }
    let stored = JSON.stringify(original)
    const setItem = vi.fn((_: string, value: string) => {
      stored = value
    })
    const migration = deferred<State>(kind)
    const migrate = vi.fn(() => migration.promise)
    const options = {
      name: 'drafts',
      version: 2,
      skipHydration: true,
      storage: createJSONStorage<State>(() => ({
        getItem: () => stored,
        setItem,
        removeItem: () => {},
      })),
      partialize: (state: State) => ({ drafts: state.drafts }),
      migrate,
    }
    const store = createStore(persist((): State => ({ drafts: [] }), options))

    const hydration = store.persist.rehydrate()

    expect(setItem).not.toHaveBeenCalled()
    expect(JSON.parse(stored)).toEqual(original)
    expect(store.persist.hasHydrated()).toBe(false)

    const migrated = { drafts: ['migrated saved draft'] }
    migration.resolve(migrated)
    await hydration

    expect(store.getState()).toEqual(migrated)
    expect(JSON.parse(stored)).toEqual({ state: migrated, version: 2 })
    expect(store.persist.hasHydrated()).toBe(true)
    expect(setItem).toHaveBeenCalledTimes(1)

    const reloaded = createStore(
      persist((): State => ({ drafts: [] }), options),
    )
    await reloaded.persist.rehydrate()
    expect(reloaded.getState()).toEqual(migrated)
    expect(migrate).toHaveBeenCalledTimes(1)
  })

  it('preserves stored data and reports a rejected migration', async () => {
    const original = JSON.stringify({
      state: { drafts: ['saved draft'] },
      version: 1,
    })
    let stored = original
    const setItem = vi.fn((_: string, value: string) => {
      stored = value
    })
    const migration = deferred<State>(kind)
    // Keep a rejected input handled even when the implementation ignores it.
    migration.promise.then(undefined, () => {})
    const completed = vi.fn()
    const store = createStore(
      persist((): State => ({ drafts: [] }), {
        name: 'drafts',
        version: 2,
        skipHydration: true,
        storage: createJSONStorage<State>(() => ({
          getItem: () => stored,
          setItem,
          removeItem: () => {},
        })),
        partialize: (state) => ({ drafts: state.drafts }),
        migrate: () => migration.promise,
        onRehydrateStorage: () => completed,
      }),
    )
    const hydration = store.persist.rehydrate()
    const error = new Error('migration failed')
    migration.reject(error)
    await hydration

    expect(stored).toBe(original)
    expect(setItem).not.toHaveBeenCalled()
    expect(completed).toHaveBeenCalledExactlyOnceWith(undefined, error)
    expect(store.persist.hasHydrated()).toBe(false)
  })
})

describe('persist synchronous migration', () => {
  it.each([undefined, null, false, 0, 'not a function'])(
    'preserves a non-callable then field (%s) without deferring hydration',
    (then) => {
      const catchAction = vi.fn()
      const finallyAction = vi.fn()
      const fields = { then, catch: catchAction, finally: finallyAction }
      let stored = JSON.stringify({
        state: { drafts: ['saved draft'] },
        version: 1,
      })
      const migrated = { drafts: ['migrated draft'], ...fields }
      const completed = vi.fn()
      const store = createStore(
        persist(() => ({ drafts: [] as string[], ...fields }), {
          name: 'drafts',
          version: 2,
          storage: createJSONStorage<State>(() => ({
            getItem: () => stored,
            setItem: (_, value) => {
              stored = value
            },
            removeItem: () => {},
          })),
          partialize: ({ drafts }) => ({ drafts }),
          migrate: () => migrated,
          onRehydrateStorage: () => completed,
        }),
      )

      expect(store.persist.hasHydrated()).toBe(true)
      expect(store.getState()).toEqual(migrated)
      expect(JSON.parse(stored)).toEqual({
        state: { drafts: migrated.drafts },
        version: 2,
      })
      expect(completed).toHaveBeenCalledExactlyOnceWith(migrated, undefined)
      expect(catchAction).not.toHaveBeenCalled()
      expect(finallyAction).not.toHaveBeenCalled()
    },
  )
})

it('uses the resolved state from a chainable PromiseLike carrying state fields', async () => {
  let stored = JSON.stringify({
    state: { drafts: ['saved draft'] },
    version: 1,
  })
  const migrated = { drafts: ['migrated draft'] }
  const promiseLike = createPromiseLike(Promise.resolve(migrated))
  const store = createStore(
    persist((): State => ({ drafts: [] }), {
      name: 'drafts',
      version: 2,
      skipHydration: true,
      storage: createJSONStorage<State>(() => ({
        getItem: () => stored,
        setItem: (_, value) => {
          stored = value
        },
        removeItem: () => {},
      })),
      partialize: ({ drafts }) => ({ drafts }),
      migrate: () => ({ drafts: ['unresolved draft'], ...promiseLike }),
    }),
  )

  await store.persist.rehydrate()

  expect(store.getState()).toEqual(migrated)
  expect(JSON.parse(stored)).toEqual({ state: migrated, version: 2 })
  expect(store.persist.hasHydrated()).toBe(true)
})
