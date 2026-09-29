import { runInNewContext } from 'node:vm'
import { describe, expect, it, vi } from 'vitest'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { StorageValue } from 'zustand/middleware'
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
        : promise,
    resolve,
    reject,
  }
}

const setup = (kind: string, json: boolean) => {
  const read = deferred<string | StorageValue<State> | null>(kind)
  // A broken implementation may ignore the rejected storage Promise.
  read.promise.then(undefined, () => {})
  const setItem = vi.fn()
  const completed = vi.fn()
  const storage = json
    ? createJSONStorage<State>(() => ({
        getItem: () => read.promise as Promise<string | null>,
        setItem,
        removeItem: () => {},
      }))!
    : {
        getItem: () => read.promise as Promise<StorageValue<State> | null>,
        setItem,
        removeItem: () => {},
      }
  const store = createStore(
    persist((): State => ({ drafts: [] }), {
      name: 'drafts',
      skipHydration: true,
      storage,
      onRehydrateStorage: () => completed,
    }),
  )
  return { read, store, setItem, completed }
}

describe.each(['native', 'another realm', 'PromiseLike without catch'])(
  'persist storage Promise from %s',
  (kind) => {
    describe.each([false, true])('createJSONStorage = %s', (json) => {
      it('waits for storage before completing hydration', async () => {
        const { read, store, setItem, completed } = setup(kind, json)
        const hydration = store.persist.rehydrate()
        expect(store.persist.hasHydrated()).toBe(false)
        expect(completed).not.toHaveBeenCalled()

        const saved = { state: { drafts: ['saved draft'] }, version: 0 }
        read.resolve(json ? JSON.stringify(saved) : saved)
        await hydration

        expect(store.getState()).toEqual(saved.state)
        expect(store.persist.hasHydrated()).toBe(true)
        expect(completed).toHaveBeenCalledExactlyOnceWith(
          saved.state,
          undefined,
        )
        expect(setItem).not.toHaveBeenCalled()
      })

      it('reports storage rejection without completing hydration or writing defaults', async () => {
        const { read, store, setItem, completed } = setup(kind, json)
        const hydration = store.persist.rehydrate()
        const error = new Error('storage read failed')
        read.reject(error)
        await hydration

        expect(store.getState()).toEqual({ drafts: [] })
        expect(store.persist.hasHydrated()).toBe(false)
        expect(completed).toHaveBeenCalledExactlyOnceWith(undefined, error)
        expect(setItem).not.toHaveBeenCalled()
      })

      it('handles an asynchronously missing entry', async () => {
        const { read, store, setItem, completed } = setup(kind, json)
        const hydration = store.persist.rehydrate()
        read.resolve(null)
        await hydration

        expect(store.getState()).toEqual({ drafts: [] })
        expect(store.persist.hasHydrated()).toBe(true)
        expect(completed).toHaveBeenCalledExactlyOnceWith(
          { drafts: [] },
          undefined,
        )
        expect(setItem).not.toHaveBeenCalled()
      })
    })

    it('reports invalid JSON after the storage value resolves', async () => {
      const { read, store, setItem, completed } = setup(kind, true)
      const hydration = store.persist.rehydrate()
      expect(completed).not.toHaveBeenCalled()
      read.resolve('{')
      await hydration

      expect(store.persist.hasHydrated()).toBe(false)
      expect(completed).toHaveBeenCalledExactlyOnceWith(
        undefined,
        expect.any(SyntaxError),
      )
      expect(setItem).not.toHaveBeenCalled()
    })
  },
)

it.each(['another realm', 'PromiseLike without catch'])(
  'ignores a stale %s migration after a newer hydration completes',
  async (kind) => {
    const older = deferred<State>(kind)
    const newer = deferred<State>(kind)
    const completed = vi.fn()
    const setItem = vi.fn()
    const migrate = vi
      .fn()
      .mockReturnValueOnce(older.promise)
      .mockReturnValueOnce(newer.promise)
    const store = createStore(
      persist((): State => ({ drafts: [] }), {
        name: 'drafts',
        version: 1,
        skipHydration: true,
        storage: {
          getItem: () => ({ state: { drafts: ['saved draft'] }, version: 0 }),
          setItem,
          removeItem: () => {},
        },
        migrate,
        onRehydrateStorage: () => completed,
      }),
    )
    const first = store.persist.rehydrate()
    const second = store.persist.rehydrate()
    const latest = { drafts: ['latest draft'] }
    newer.resolve(latest)
    await second
    older.resolve({ drafts: ['stale draft'] })
    await first

    expect(store.getState()).toEqual(latest)
    expect(store.persist.hasHydrated()).toBe(true)
    expect(setItem).toHaveBeenCalledExactlyOnceWith('drafts', {
      state: latest,
      version: 1,
    })
    expect(completed).toHaveBeenCalledExactlyOnceWith(latest, undefined)
  },
)

it.each(['another realm', 'PromiseLike without catch'])(
  'does not restore a pending %s read after storage is cleared',
  async (kind) => {
    const { read, store, setItem, completed } = setup(kind, true)
    const hydration = store.persist.rehydrate()
    store.persist.clearStorage()
    read.resolve(
      JSON.stringify({ state: { drafts: ['old draft'] }, version: 0 }),
    )
    await hydration

    expect(store.getState()).toEqual({ drafts: [] })
    expect(store.persist.hasHydrated()).toBe(false)
    expect(completed).not.toHaveBeenCalled()
    expect(setItem).not.toHaveBeenCalled()
  },
)

it.each(['native', 'another realm'])(
  'preserves standalone JSON storage rejection handling for a %s Promise',
  async (kind) => {
    const read = deferred<string | null>(kind)
    const storage = createJSONStorage<State>(() => ({
      getItem: () => read.promise,
      setItem: () => {},
      removeItem: () => {},
    }))!
    const result = storage.getItem(
      'drafts',
    ) as Promise<StorageValue<State> | null>
    const rejected = vi.fn()
    const handled = result.catch(rejected)
    read.resolve('{')
    await handled
    expect(rejected).toHaveBeenCalledExactlyOnceWith(expect.any(SyntaxError))
  },
)

it.each(['native', 'another realm', 'PromiseLike without catch'])(
  'returns a Promise supporting finally for an asynchronous %s hydration',
  async (kind) => {
    const { read, store } = setup(kind, false)
    const finished = vi.fn()
    const hydration = store.persist.rehydrate()
    if (!hydration) throw new Error('Expected asynchronous hydration')
    const completion = hydration.finally(finished)
    read.resolve({ state: { drafts: ['saved draft'] }, version: 0 })
    await completion

    expect(finished).toHaveBeenCalledOnce()
    expect(store.getState()).toEqual({ drafts: ['saved draft'] })
    expect(store.persist.hasHydrated()).toBe(true)
  },
)
