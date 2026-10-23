import { runInNewContext } from 'node:vm'
import { describe, expect, it, vi } from 'vitest'
import { persist } from 'zustand/middleware'
import { createStore } from 'zustand/vanilla'
import { createPromiseLike } from './test-utils'

describe.each([
  ['read', 'native Promise'],
  ['migration', 'native Promise'],
  ['read', 'another realm'],
  ['migration', 'another realm'],
  ['read', 'PromiseLike without catch'],
  ['migration', 'PromiseLike without catch'],
])(
  'write completion after an asynchronous %s using %s',
  (asynchronous, inputKind) => {
    const createInputPromise = <T>(value: T): PromiseLike<T> => {
      if (inputKind === 'another realm') {
        return runInNewContext('Promise.resolve(value)', { value })
      }
      const promise = Promise.resolve(value)
      return inputKind === 'native Promise'
        ? promise
        : createPromiseLike(promise)
    }

    describe.each(['another realm', 'PromiseLike without catch'])(
      'write returns %s',
      (kind) => {
        it.each([false, true])(
          'waits for the write and reports its result (rejects = %s)',
          async (rejects) => {
            let resolve!: () => void
            let reject!: (error: Error) => void
            const native = new Promise<void>((ok, bad) => {
              resolve = ok
              reject = bad
            })
            const write: PromiseLike<void> =
              kind === 'another realm'
                ? runInNewContext(
                    'new Promise((resolve, reject) => native.then(resolve, reject))',
                    { native },
                  )
                : createPromiseLike(native)
            // Handle ignored inputs as well, so a failing implementation does
            // not leave an unhandled rejection behind during this regression test.
            write.then(undefined, () => {})
            const saved = { count: 42 }
            const completed = vi.fn()
            const setItem = vi.fn(() => write)
            const store = createStore(
              persist(() => ({ count: 0 }), {
                name: 'write-compatibility',
                version: 1,
                skipHydration: true,
                storage: {
                  getItem: () =>
                    asynchronous === 'read'
                      ? createInputPromise({ state: saved, version: 0 })
                      : { state: saved, version: 0 },
                  setItem,
                  removeItem: () => {},
                },
                migrate: () =>
                  asynchronous === 'migration'
                    ? createInputPromise(saved)
                    : saved,
                onRehydrateStorage: () => completed,
              }),
            )
            const hydration = store.persist.rehydrate()
            await new Promise((done) => setTimeout(done, 0))
            const premature = store.persist.hasHydrated()
            const earlyCalls = completed.mock.calls.length
            const error = new Error('write failed')
            if (rejects) reject(error)
            else resolve()
            await hydration

            expect(setItem).toHaveBeenCalledOnce()
            expect(premature).toBe(false)
            expect(earlyCalls).toBe(0)
            expect(store.persist.hasHydrated()).toBe(!rejects)
            expect(completed).toHaveBeenCalledExactlyOnceWith(
              rejects ? undefined : saved,
              rejects ? error : undefined,
            )
          },
        )
      },
    )
  },
)

it.each([false, true])(
  'handles synchronous hydration rejection through catch (callback throws = %s)',
  async (throws) => {
    const error = new Error('hydration callback failed')
    const store = createStore(
      persist(() => ({ count: 0 }), {
        name: 'catch-compatibility',
        skipHydration: true,
        storage: {
          getItem: () => ({ state: { count: 42 }, version: 0 }),
          setItem: () => {},
          removeItem: () => {},
        },
        onRehydrateStorage: () => () => {
          if (throws) throw error
        },
      }),
    )
    const hydration = store.persist.rehydrate()
    const rejected = vi.fn()
    await hydration.catch(rejected)
    expect(rejected.mock.calls).toEqual(throws ? [[error]] : [])
  },
)

describe.each(['read', 'migration'])(
  'completion order after an asynchronous %s',
  (asynchronous) => {
    it.each([undefined, null, false, 0, 'saved', { saved: true }, () => {}])(
      'does not defer completion for a synchronous write returning %s',
      async (writeResult) => {
        const events: string[] = []
        const saved = { count: 42 }
        const store = createStore(
          persist(() => ({ count: 0 }), {
            name: 'completion-order',
            version: 1,
            skipHydration: true,
            storage: {
              getItem: () =>
                asynchronous === 'read'
                  ? Promise.resolve({ state: saved, version: 0 })
                  : { state: saved, version: 0 },
              setItem: () => writeResult,
              removeItem: () => {},
            },
            migrate: () =>
              asynchronous === 'migration' ? Promise.resolve(saved) : saved,
            onRehydrateStorage: () => () => {
              events.push('hydration completed')
            },
          }),
        )
        const hydration = store.persist.rehydrate()
        const other = Promise.resolve()
          .then(() => {})
          .then(() => {})
          .then(() => events.push('other callback'))
        await Promise.all([hydration, other])
        expect(events).toEqual(['hydration completed', 'other callback'])
      },
    )
  },
)

it.each([false, true])(
  'does not inspect then accessors on a synchronous write value (throws = %s)',
  async (throws) => {
    const getter = vi.fn(() => {
      if (throws) throw new Error('then accessor failed')
      return undefined
    })
    const writeResult = {
      get then() {
        return getter()
      },
    }
    const completed = vi.fn()
    const store = createStore(
      persist(() => ({ count: 0 }), {
        name: 'write-value-getter',
        version: 1,
        skipHydration: true,
        storage: {
          getItem: () => ({ state: { count: 42 }, version: 0 }),
          setItem: () => writeResult,
          removeItem: () => {},
        },
        migrate: (state) => state as { count: number },
        onRehydrateStorage: () => completed,
      }),
    )
    await store.persist.rehydrate()
    expect(getter).not.toHaveBeenCalled()
    expect(store.persist.hasHydrated()).toBe(true)
    expect(completed).toHaveBeenCalledExactlyOnceWith({ count: 42 }, undefined)
  },
)

it.each([false, true])(
  'awaits a native Promise write after synchronous reads and migration (rejects = %s)',
  async (rejects) => {
    let resolve!: () => void
    let reject!: (error: Error) => void
    const write = new Promise<void>((ok, bad) => {
      resolve = ok
      reject = bad
    })
    const completed = vi.fn()
    const store = createStore(
      persist(() => ({ count: 0 }), {
        name: 'sync-chain-native-write',
        version: 1,
        skipHydration: true,
        storage: {
          getItem: () => ({ state: { count: 42 }, version: 0 }),
          setItem: () => write,
          removeItem: () => {},
        },
        migrate: (state) => state as { count: number },
        onRehydrateStorage: () => completed,
      }),
    )
    const hydration = store.persist.rehydrate()
    expect(store.getState()).toEqual({ count: 42 })
    expect(store.persist.hasHydrated()).toBe(false)
    expect(completed).not.toHaveBeenCalled()

    const error = new Error('write failed')
    if (rejects) reject(error)
    else resolve()
    await hydration

    expect(store.persist.hasHydrated()).toBe(!rejects)
    expect(completed).toHaveBeenCalledExactlyOnceWith(
      rejects ? undefined : { count: 42 },
      rejects ? error : undefined,
    )
  },
)

it.each(['value', 'getter'])(
  'does not interpret an external Promise sync %s as internal metadata',
  async (kind) => {
    const syncRead = vi.fn(() => {
      throw new Error('unrelated sync getter')
    })
    class StoragePromise<T> extends Promise<T> {}
    Object.defineProperty(
      StoragePromise.prototype,
      'sync',
      kind === 'value' ? { value: true } : { get: syncRead },
    )
    const events: string[] = []
    const store = createStore(
      persist(() => ({ count: 0 }), {
        name: 'external-sync-property',
        version: 1,
        skipHydration: true,
        storage: {
          getItem: () =>
            StoragePromise.resolve({ state: { count: 42 }, version: 0 }),
          setItem: () => ({ saved: true }),
          removeItem: () => {},
        },
        migrate: (state) => state as { count: number },
        onRehydrateStorage: () => () => {
          events.push('hydration completed')
        },
      }),
    )
    const hydration = store.persist.rehydrate()
    const other = Promise.resolve()
      .then(() => {})
      .then(() => {})
      .then(() => events.push('other callback'))
    await Promise.all([hydration, other])

    expect(syncRead).not.toHaveBeenCalled()
    expect(store.getState()).toEqual({ count: 42 })
    expect(store.persist.hasHydrated()).toBe(true)
    expect(events).toEqual(['hydration completed', 'other callback'])
  },
)
