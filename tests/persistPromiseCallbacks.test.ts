import { expect, expectTypeOf, it, vi } from 'vitest'
import { persist } from 'zustand/middleware'
import { createStore } from 'zustand/vanilla'
import { createPromiseLike } from './test-utils'

const startHydration = (callback = () => {}) => {
  const store = createStore(
    persist(() => ({ count: 0 }), {
      name: 'promise-callbacks',
      skipHydration: true,
      storage: {
        getItem: () =>
          createPromiseLike(
            Promise.resolve({ state: { count: 42 }, version: 0 }),
          ),
        setItem: () => {},
        removeItem: () => {},
      },
      onRehydrateStorage: () => callback,
    }),
  )
  const hydration = store.persist.rehydrate()
  expectTypeOf(hydration).toEqualTypeOf<Promise<void>>()
  expect(hydration).toBeInstanceOf(Promise)
  return hydration
}

it.each(['onHydrate', 'onRehydrateStorage'])(
  'rejects rehydrate when %s throws before reading storage',
  async (hook) => {
    const error = new Error('hydration start failed')
    const onHydrationStart = vi.fn(() => {
      throw error
    })
    const getItem = vi.fn(() => ({ state: { count: 42 }, version: 0 }))
    const store = createStore(
      persist(() => ({ count: 0 }), {
        name: 'hydration-start-error',
        skipHydration: true,
        storage: {
          getItem,
          setItem: () => {},
          removeItem: () => {},
        },
      }),
    )
    if (hook === 'onHydrate') {
      store.persist.onHydrate(onHydrationStart)
    } else {
      store.persist.setOptions({ onRehydrateStorage: onHydrationStart })
    }

    const hydration = store.persist.rehydrate()

    expect(hydration).toBeInstanceOf(Promise)
    await expect(hydration).rejects.toBe(error)
    expect(onHydrationStart).toHaveBeenCalledExactlyOnceWith({ count: 0 })
    expect(getItem).not.toHaveBeenCalled()
    expect(store.getState()).toEqual({ count: 0 })
    expect(store.persist.hasHydrated()).toBe(false)
  },
)

it('passes fulfillment errors to the next rejection handler', async () => {
  const error = new Error('fulfillment failed')
  const sameStep = vi.fn()
  const nextStep = vi.fn(() => 'recovered')
  const result = await startHydration()
    .then(() => {
      throw error
    }, sameStep)
    .then(undefined, nextStep)
  expect(sameStep).not.toHaveBeenCalled()
  expect(nextStep).toHaveBeenCalledExactlyOnceWith(error)
  expect(result).toBe('recovered')
})

it('passes values and errors through omitted callbacks', async () => {
  const value = await startHydration()
    .then(() => 42)
    .then(null)
    .then(undefined)
    .then(undefined, null)
  expect(value).toBe(42)

  const error = new Error('callback failed')
  const rejected = vi.fn()
  await startHydration(() => {
    throw error
  })
    .then(null, null)
    .then(undefined, undefined)
    .then(undefined, rejected)
  expect(rejected).toHaveBeenCalledExactlyOnceWith(error)
})

it('waits for a catchless result returned by a fulfillment handler', async () => {
  let resolveResult!: (value: number) => void
  const pending = new Promise<number>((resolve) => {
    resolveResult = resolve
  })
  const hydration = startHydration()
  const onFulfilled = vi.fn(() => createPromiseLike(pending))
  const completed = vi.fn()
  const result = hydration.then(onFulfilled).then(completed)
  await hydration
  expect(onFulfilled).toHaveBeenCalledExactlyOnceWith(undefined)
  expect(completed).not.toHaveBeenCalled()
  resolveResult(42)
  await result
  expect(completed).toHaveBeenCalledExactlyOnceWith(42)
})

it.each([false, true])(
  'adopts a catchless result returned by a rejection handler (rejects = %s)',
  async (rejects) => {
    const original = new Error('hydration failed')
    const recoveryError = new Error('recovery failed')
    const recover = vi.fn(() =>
      createPromiseLike(
        rejects ? Promise.reject(recoveryError) : Promise.resolve(42),
      ),
    )
    const onFulfilled = vi.fn()
    const onRejected = vi.fn()
    await startHydration(() => {
      throw original
    })
      .then(undefined, recover)
      .then(onFulfilled, onRejected)
    expect(recover).toHaveBeenCalledExactlyOnceWith(original)
    expect(onFulfilled.mock.calls).toEqual(rejects ? [] : [[42]])
    expect(onRejected.mock.calls).toEqual(rejects ? [[recoveryError]] : [])
  },
)

it('does not inspect catch or finally on an external pending PromiseLike', () => {
  const catchAccess = vi.fn(() => {
    throw new Error('unrelated catch read')
  })
  const finallyAccess = vi.fn(() => {
    throw new Error('unrelated finally read')
  })
  const pending: PromiseLike<never> = {
    then: () => pending,
  }
  Object.defineProperties(pending, {
    catch: { get: catchAccess },
    finally: { get: finallyAccess },
  })
  const completed = vi.fn()
  const store = createStore(
    persist(() => ({ count: 0 }), {
      name: 'pending-promise',
      storage: {
        getItem: () => pending,
        setItem: () => {},
        removeItem: () => {},
      },
      onRehydrateStorage: () => completed,
    }),
  )
  expect(store.persist.hasHydrated()).toBe(false)
  expect(completed).not.toHaveBeenCalled()
  expect(catchAccess).not.toHaveBeenCalled()
  expect(finallyAccess).not.toHaveBeenCalled()

  store.persist.rehydrate()
  expect(store.persist.hasHydrated()).toBe(false)
  expect(catchAccess).not.toHaveBeenCalled()
  expect(finallyAccess).not.toHaveBeenCalled()
})

const startSyncHydration = () => {
  const store = createStore(
    persist(() => ({ count: 0 }), {
      name: 'synchronous-result',
      skipHydration: true,
      storage: {
        getItem: () => ({ state: { count: 42 }, version: 0 }),
        setItem: () => {},
        removeItem: () => {},
      },
    }),
  )
  const hydration = store.persist.rehydrate()
  expectTypeOf(hydration).toEqualTypeOf<Promise<void>>()
  expect(hydration).toBeInstanceOf(Promise)
  expect(store.getState()).toEqual({ count: 42 })
  expect(store.persist.hasHydrated()).toBe(true)
  return hydration
}

it('restores state synchronously and runs public Promise callbacks asynchronously', async () => {
  const events: string[] = []
  const error = new Error('consumer failed')
  const recovered = vi.fn(() => {
    events.push('recovered')
    return 42
  })
  const completed = vi.fn(() => {
    events.push('completed')
  })
  const hydration = startSyncHydration()
  const result = hydration
    .then(() => {
      events.push('fulfilled')
      throw error
    })
    .catch(recovered)
    .then(completed)
  events.push('returned')
  expect(events).toEqual(['returned'])
  expect(recovered).not.toHaveBeenCalled()
  expect(completed).not.toHaveBeenCalled()

  await result
  expect(recovered).toHaveBeenCalledExactlyOnceWith(error)
  expect(completed).toHaveBeenCalledExactlyOnceWith(42)
  expect(events).toEqual(['returned', 'fulfilled', 'recovered', 'completed'])
})

it.each([false, true])(
  'awaits a catchless callback result after synchronous hydration (rejects = %s)',
  async (rejects) => {
    let resolve!: (value: number) => void
    let reject!: (error: Error) => void
    const pending = new Promise<number>((ok, bad) => {
      resolve = ok
      reject = bad
    })
    const error = new Error('consumer result failed')
    const completed = vi.fn()
    const recovered = vi.fn(() => 7)
    const result = startSyncHydration()
      .then(() => createPromiseLike(pending))
      .then(undefined, recovered)
      .then(completed)
    expect(completed).not.toHaveBeenCalled()

    if (rejects) reject(error)
    else resolve(42)
    await result

    expect(recovered.mock.calls).toEqual(rejects ? [[error]] : [])
    expect(completed).toHaveBeenCalledExactlyOnceWith(rejects ? 7 : 42)
  },
)

it.each([false, true])(
  'waits for catchless cleanup returned from finally (rejects = %s)',
  async (rejects) => {
    let resolve!: () => void
    let reject!: (error: Error) => void
    const cleanup = new Promise<void>((ok, bad) => {
      resolve = ok
      reject = bad
    })
    let started!: () => void
    const cleanupStarted = new Promise<void>((done) => {
      started = done
    })
    const fulfilled = vi.fn()
    const rejected = vi.fn()
    const result = startSyncHydration()
      .then(() => 42)
      .finally(() => {
        started()
        return createPromiseLike(cleanup)
      })
      .then(fulfilled, rejected)

    await cleanupStarted
    expect(fulfilled).not.toHaveBeenCalled()
    expect(rejected).not.toHaveBeenCalled()

    const error = new Error('cleanup failed')
    if (rejects) reject(error)
    else resolve()
    await result

    expect(fulfilled.mock.calls).toEqual(rejects ? [] : [[42]])
    expect(rejected.mock.calls).toEqual(rejects ? [[error]] : [])
  },
)
