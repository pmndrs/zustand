import { describe, expect, it, vi } from 'vitest'
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

describe('subscribe()', () => {
  it('should correctly have access to subscribe', () => {
    const { subscribe } = create(() => ({ value: 1 }))
    expect(typeof subscribe).toBe('function')
  })

  it('should not be called if new state identity is the same', () => {
    const spy = vi.fn()
    const initialState = { value: 1, other: 'a' }
    const useBoundStore = create(() => initialState)

    useBoundStore.subscribe(spy)
    useBoundStore.setState(initialState)
    expect(spy).not.toHaveBeenCalled()
  })

  it('should be called if new state identity is different', () => {
    const spy = vi.fn()
    const initialState = { value: 1, other: 'a' }
    const useBoundStore = create(() => initialState)

    useBoundStore.subscribe(spy)
    useBoundStore.setState({ ...useBoundStore.getState() })
    expect(spy).toHaveBeenCalledWith(initialState, initialState)
  })

  it('should not be called when state slice is the same', () => {
    const spy = vi.fn()
    const initialState = { value: 1, other: 'a' }
    const useBoundStore = create(subscribeWithSelector(() => initialState))

    useBoundStore.subscribe((s) => s.value, spy)
    useBoundStore.setState({ other: 'b' })
    expect(spy).not.toHaveBeenCalled()
  })

  it('should be called when state slice changes', () => {
    const spy = vi.fn()
    const initialState = { value: 1, other: 'a' }
    const useBoundStore = create(subscribeWithSelector(() => initialState))

    useBoundStore.subscribe((s) => s.value, spy)
    useBoundStore.setState({ value: initialState.value + 1 })
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith(initialState.value + 1, initialState.value)
  })

  it('should not be called when equality checker returns true', () => {
    const spy = vi.fn()
    const initialState = { value: 1, other: 'a' }
    const useBoundStore = create(subscribeWithSelector(() => initialState))

    useBoundStore.subscribe((s) => s, spy, { equalityFn: () => true })
    useBoundStore.setState({ value: initialState.value + 2 })
    expect(spy).not.toHaveBeenCalled()
  })

  it('should be called when equality checker returns false', () => {
    const spy = vi.fn()
    const initialState = { value: 1, other: 'a' }
    const useBoundStore = create(subscribeWithSelector(() => initialState))

    useBoundStore.subscribe((s) => s.value, spy, { equalityFn: () => false })
    useBoundStore.setState({ value: initialState.value + 2 })
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith(initialState.value + 2, initialState.value)
  })

  it('should unsubscribe correctly', () => {
    const spy = vi.fn()
    const initialState = { value: 1, other: 'a' }
    const useBoundStore = create(subscribeWithSelector(() => initialState))

    const unsub = useBoundStore.subscribe((s) => s.value, spy)

    useBoundStore.setState({ value: initialState.value + 1 })
    unsub()
    useBoundStore.setState({ value: initialState.value + 2 })

    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith(initialState.value + 1, initialState.value)
  })

  it('should call listener immediately when fireImmediately is true', () => {
    const spy = vi.fn()
    const initialState = { value: 1 }
    const useBoundStore = create(subscribeWithSelector(() => initialState))

    useBoundStore.subscribe((s) => s.value, spy, { fireImmediately: true })

    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith(1, 1)
  })

  it('should pass previous and current state to listener', () => {
    const spy = vi.fn()
    const useBoundStore = create(() => ({ count: 0 }))

    useBoundStore.subscribe(spy)
    useBoundStore.setState({ count: 1 })

    expect(spy).toHaveBeenCalledWith({ count: 1 }, { count: 0 })
  })

  it('should handle multiple subscribers', () => {
    const spy1 = vi.fn()
    const spy2 = vi.fn()
    const useBoundStore = create(() => ({ count: 0 }))

    useBoundStore.subscribe(spy1)
    useBoundStore.subscribe(spy2)
    useBoundStore.setState({ count: 1 })

    expect(spy1).toHaveBeenCalledTimes(1)
    expect(spy2).toHaveBeenCalledTimes(1)
  })

  it('should not notify unsubscribed listener while other listeners remain', () => {
    const spy1 = vi.fn()
    const spy2 = vi.fn()
    const useBoundStore = create(() => ({ count: 0 }))

    const unsub1 = useBoundStore.subscribe(spy1)
    useBoundStore.subscribe(spy2)

    unsub1()
    useBoundStore.setState({ count: 1 })

    expect(spy1).not.toHaveBeenCalled()
    expect(spy2).toHaveBeenCalledTimes(1)
  })
})
