import { describe, expect, it, vi } from 'vitest'
import { create } from 'zustand'
import { combine } from 'zustand/middleware'
import { createStore } from 'zustand/vanilla'

describe('combine middleware', () => {
  it('should merge initial state with creator return value', () => {
    const useBoundStore = create(
      combine({ count: 0, text: 'hello' }, (set) => ({
        inc: () => set((state) => ({ count: state.count + 1 })),
        setText: (text: string) => set({ text }),
      })),
    )

    expect(useBoundStore.getState().count).toBe(0)
    expect(useBoundStore.getState().text).toBe('hello')
    expect(typeof useBoundStore.getState().inc).toBe('function')
    expect(typeof useBoundStore.getState().setText).toBe('function')
  })

  it('should update state via actions', () => {
    const useBoundStore = create(
      combine({ count: 0 }, (set) => ({
        inc: () => set((state) => ({ count: state.count + 1 })),
      })),
    )

    useBoundStore.getState().inc()
    expect(useBoundStore.getState().count).toBe(1)

    useBoundStore.getState().inc()
    expect(useBoundStore.getState().count).toBe(2)
  })

  it('should work with setState directly', () => {
    const useBoundStore = create(
      combine({ count: 0 }, () => ({
        doubled: () => 0,
      })),
    )

    useBoundStore.setState({ count: 5 })
    expect(useBoundStore.getState().count).toBe(5)
  })

  it('should work with vanilla createStore', () => {
    const store = createStore(
      combine({ value: 'initial' }, (set) => ({
        update: (value: string) => set({ value }),
      })),
    )

    expect(store.getState().value).toBe('initial')
    store.getState().update('updated')
    expect(store.getState().value).toBe('updated')
  })

  it('should provide get and api to creator', () => {
    const store = createStore(
      combine({ count: 0 }, (set, get, api) => ({
        inc: () => set({ count: get().count + 1 }),
        reset: () => api.setState({ count: 0 }, true),
      })),
    )

    store.getState().inc()
    store.getState().inc()
    expect(store.getState().count).toBe(2)

    store.getState().reset()
    expect(store.getState().count).toBe(0)
  })

  it('should notify subscribers on state change', () => {
    const spy = vi.fn()
    const store = createStore(
      combine({ count: 0 }, (set) => ({
        inc: () => set((state) => ({ count: state.count + 1 })),
      })),
    )

    store.subscribe(spy)
    store.getState().inc()

    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('should preserve initial state in getInitialState', () => {
    const store = createStore(
      combine({ count: 0 }, (set) => ({
        inc: () => set((state) => ({ count: state.count + 1 })),
      })),
    )

    store.getState().inc()
    expect(store.getState().count).toBe(1)
    expect(store.getInitialState().count).toBe(0)
  })
})
