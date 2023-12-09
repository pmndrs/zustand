import { describe, expect, it, vi } from 'vitest'
import { subscribeWithSelector } from 'zustand/middleware'
import { createStore } from 'zustand/vanilla'

describe('subscribe()', () => {
  it('should not be called if new state identity is the same', () => {
    const spy = vi.fn()
    const initialState = { value: 1, other: 'a' }
    const { setState, subscribe } = createStore(() => initialState)

    subscribe(spy)
    setState(initialState)
    expect(spy).not.toHaveBeenCalled()
  })

  it('should be called if new state identity is different', () => {
    const spy = vi.fn()
    const initialState = { value: 1, other: 'a' }
    const { setState, getState, subscribe } = createStore(() => initialState)

    subscribe(spy)
    setState({ ...getState() })
    expect(spy).toHaveBeenCalledWith(initialState, initialState)
  })

  it('should not be called when state slice is the same', () => {
    const spy = vi.fn()
    const initialState = { value: 1, other: 'a' }
    const { setState, subscribe } = createStore(
      subscribeWithSelector(() => initialState),
    )

    subscribe((s) => s.value, spy)
    setState({ other: 'b' })
    expect(spy).not.toHaveBeenCalled()
  })

  it('should be called when state slice changes', () => {
    const spy = vi.fn()
    const initialState = { value: 1, other: 'a' }
    const { setState, subscribe } = createStore(
      subscribeWithSelector(() => initialState),
    )

    subscribe((s) => s.value, spy)
    setState({ value: initialState.value + 1 })
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith(initialState.value + 1, initialState.value)
  })

  it('should not be called when equality checker returns true', () => {
    const spy = vi.fn()
    const initialState = { value: 1, other: 'a' }
    const { setState, subscribe } = createStore(
      subscribeWithSelector(() => initialState),
    )

    subscribe((s) => s, spy, { equalityFn: () => true })
    setState({ value: initialState.value + 2 })
    expect(spy).not.toHaveBeenCalled()
  })

  it('should be called when equality checker returns false', () => {
    const spy = vi.fn()
    const initialState = { value: 1, other: 'a' }
    const { setState, subscribe } = createStore(
      subscribeWithSelector(() => initialState),
    )

    subscribe((s) => s.value, spy, { equalityFn: () => false })
    setState({ value: initialState.value + 2 })
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith(initialState.value + 2, initialState.value)
  })

  it('should unsubscribe correctly', () => {
    const spy = vi.fn()
    const initialState = { value: 1, other: 'a' }
    const { setState, subscribe } = createStore(
      subscribeWithSelector(() => initialState),
    )

    const unsub = subscribe((s) => s.value, spy)

    setState({ value: initialState.value + 1 })
    unsub()
    setState({ value: initialState.value + 2 })

    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith(initialState.value + 1, initialState.value)
  })

  it('should keep consistent behavior with equality check', () => {
    const spy = vi.fn()
    const initialState = { value: 1, other: 'a' }
    const { getState, setState, subscribe } = createStore(
      subscribeWithSelector(() => initialState),
    )

    const isRoughEqual = (x: number, y: number) => Math.abs(x - y) < 1
    setState({ value: 0 })
    spy.mockReset()
    const spy2 = vi.fn()
    let prevValue = getState().value
    const unsub = subscribe((s) => {
      if (isRoughEqual(prevValue, s.value)) {
        // skip assuming values are equal
        return
      }
      spy(s.value, prevValue)
      prevValue = s.value
    })
    const unsub2 = subscribe((s) => s.value, spy2, { equalityFn: isRoughEqual })
    setState({ value: 0.5 })
    setState({ value: 1 })
    unsub()
    unsub2()
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith(1, 0)
    expect(spy2).toHaveBeenCalledTimes(1)
    expect(spy2).toHaveBeenCalledWith(1, 0)
  })
})
