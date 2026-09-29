import { runInNewContext } from 'node:vm'
import { describe, expect, it, vi } from 'vitest'
import { persist } from 'zustand/middleware'
import { createStore } from 'zustand/vanilla'
import { createPromiseLike } from './test-utils'

describe.each(['read', 'migration'])(
  'write completion after an asynchronous %s',
  (asynchronous) => {
    describe.each(['another realm', 'PromiseLike without catch'])(
      'write returns %s',
      (kind) => {
        it.each([false, true])(
          'preserves the existing write completion and error handling (rejects = %s)',
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
                      ? Promise.resolve({ state: saved, version: 0 })
                      : { state: saved, version: 0 },
                  setItem,
                  removeItem: () => {},
                },
                migrate: () =>
                  asynchronous === 'migration' ? Promise.resolve(saved) : saved,
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
  'preserves catch on synchronous hydration results (callback throws = %s)',
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
    if (!hydration) throw new Error('Expected a hydration result')
    const rejected = vi.fn()
    await hydration.catch(rejected)
    expect(rejected.mock.calls).toEqual(throws ? [[error]] : [])
  },
)

describe.each(['read', 'migration'])(
  'completion order after an asynchronous %s',
  (asynchronous) => {
    it.each([undefined, null, false, 0, 'saved'])(
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
