import { expect, it, vi } from 'vitest'
import { persist } from 'zustand/middleware'
import { createStore } from 'zustand/vanilla'
import { createPromiseLike } from './test-utils'

const createWriteStore = (write: unknown, completed = vi.fn()) =>
  createStore(
    persist(() => ({ count: 0 }), {
      name: 'legacy-interop',
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

it('does not read catch accessors on PromiseLike write results', async () => {
  const getter = vi.fn(() => {
    throw new Error('unrelated catch getter')
  })
  const write = createPromiseLike(Promise.resolve())
  Object.defineProperty(write, 'catch', { get: getter })
  const store = createWriteStore(write)

  await store.persist.rehydrate()

  expect(store.persist.hasHydrated()).toBe(true)
  expect(getter).not.toHaveBeenCalled()
})

it('does not invoke unrelated catch actions on chaining PromiseLikes', async () => {
  const action = vi.fn()
  const write = createPromiseLike(Promise.resolve())
  Object.defineProperty(write, 'catch', { value: action })
  const store = createWriteStore(write)

  await store.persist.rehydrate()

  expect(store.persist.hasHydrated()).toBe(true)
  expect(action).not.toHaveBeenCalled()
})

it('does not invoke unrelated catch actions after synchronous fulfillment', async () => {
  const action = vi.fn()
  const write: PromiseLike<void> = {
    then(onFulfilled) {
      try {
        const value = onFulfilled?.(undefined)
        return value === undefined
          ? (write as PromiseLike<never>)
          : Promise.resolve(value)
      } catch (error) {
        return Promise.reject(error)
      }
    },
  }
  Object.defineProperty(write, 'catch', { value: action })
  const store = createWriteStore(write)

  await store.persist.rehydrate()

  expect(store.persist.hasHydrated()).toBe(true)
  expect(action).not.toHaveBeenCalled()
})

it('does not turn optional catch introspection failures into hydration errors', async () => {
  const write = new Proxy(createPromiseLike(Promise.resolve()), {
    getOwnPropertyDescriptor: () => {
      throw new Error('optional introspection failed')
    },
  })
  const completed = vi.fn()
  const store = createWriteStore(write, completed)

  await store.persist.rehydrate()

  expect(store.persist.hasHydrated()).toBe(true)
  expect(completed).toHaveBeenCalledExactlyOnceWith({ count: 42 }, undefined)
})

it('does not inspect unrelated catch getters on native Promises', async () => {
  const getter = vi.fn(() => {
    throw new Error('unrelated native catch getter')
  })
  const write = Promise.resolve()
  Object.defineProperty(write, 'catch', { get: getter })
  const store = createWriteStore(write)

  await store.persist.rehydrate()

  expect(store.persist.hasHydrated()).toBe(true)
  expect(getter).not.toHaveBeenCalled()
})

it('rejects with a hydration callback error without invoking it twice', async () => {
  const writeError = new Error('write failed')
  const callbackError = new Error('callback failed')
  const write = createPromiseLike(Promise.reject(writeError))
  const completed = vi.fn(() => {
    throw callbackError
  })
  const store = createWriteStore(write, completed)

  await expect(store.persist.rehydrate()).rejects.toBe(callbackError)

  expect(completed).toHaveBeenCalledExactlyOnceWith(undefined, writeError)
})
