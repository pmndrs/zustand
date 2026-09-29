import { expect, it, vi } from 'vitest'
import { persist } from 'zustand/middleware'
import type { StorageValue } from 'zustand/middleware'
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
          ) as Promise<StorageValue<{ count: number }>>,
        setItem: () => {},
        removeItem: () => {},
      },
      onRehydrateStorage: () => callback,
    }),
  )
  const hydration = store.persist.rehydrate()
  if (!hydration) throw new Error('Expected hydration result')
  return hydration
}

it('passes fulfillment errors to the next rejection handler', async () => {
  const error = new Error('fulfillment failed')
  const sameStep = vi.fn()
  const nextStep = vi.fn(() => 'recovered')
  const result = await startHydration()
    .then(() => {
      throw error
    }, sameStep)
    .catch(nextStep)
  expect(sameStep).not.toHaveBeenCalled()
  expect(nextStep).toHaveBeenCalledExactlyOnceWith(error)
  expect(result).toBe('recovered')
})

it('passes values and errors through omitted callbacks', async () => {
  const value = await startHydration()
    .then(() => 42)
    .then(null)
    .then(undefined)
    .catch()
    .finally(null)
  expect(value).toBe(42)

  const error = new Error('callback failed')
  const rejected = vi.fn()
  await startHydration(() => {
    throw error
  })
    .then(null, null)
    .catch(undefined)
    .finally(undefined)
    .catch(rejected)
  expect(rejected).toHaveBeenCalledExactlyOnceWith(error)
})

it('waits for a catchless finally result without changing the original value', async () => {
  let completeCleanup!: () => void
  const cleanup = new Promise<void>((resolve) => {
    completeCleanup = resolve
  })
  const hydration = startHydration().then(() => 42)
  const finallyCallback = vi.fn(() => createPromiseLike(cleanup))
  const completed = vi.fn()
  const result = hydration.finally(finallyCallback).then(completed)
  await hydration
  expect(finallyCallback).toHaveBeenCalledExactlyOnceWith()
  expect(completed).not.toHaveBeenCalled()
  completeCleanup()
  await result
  expect(completed).toHaveBeenCalledExactlyOnceWith(42)
})

it.each([false, true])(
  'preserves or replaces rejection when finally settles (cleanup rejects = %s)',
  async (cleanupRejects) => {
    const original = new Error('hydration failed')
    const cleanupError = new Error('cleanup failed')
    const onFinally = vi.fn(() =>
      createPromiseLike(
        cleanupRejects ? Promise.reject(cleanupError) : Promise.resolve(),
      ),
    )
    const onRejected = vi.fn()
    await startHydration(() => {
      throw original
    })
      .finally(onFinally)
      .catch(onRejected)
    expect(onFinally).toHaveBeenCalledExactlyOnceWith()
    expect(onRejected).toHaveBeenCalledExactlyOnceWith(
      cleanupRejects ? cleanupError : original,
    )
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
        getItem: () => pending as Promise<never>,
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
})
