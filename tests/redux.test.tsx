import { describe, expect, it, vi } from 'vitest'
import { create } from 'zustand'
import { redux } from 'zustand/middleware'
import { createStore } from 'zustand/vanilla'

type CounterState = { count: number }
type CounterAction =
  | { type: 'INCREMENT' }
  | { type: 'DECREMENT' }
  | { type: 'SET'; payload: number }

const counterReducer = (
  state: CounterState,
  action: CounterAction,
): CounterState => {
  switch (action.type) {
    case 'INCREMENT':
      return { count: state.count + 1 }
    case 'DECREMENT':
      return { count: state.count - 1 }
    case 'SET':
      return { count: action.payload }
    default:
      return state
  }
}

describe('redux middleware', () => {
  it('should create store with initial state', () => {
    const store = createStore(redux(counterReducer, { count: 0 }))

    expect(store.getState().count).toBe(0)
    expect(typeof store.getState().dispatch).toBe('function')
  })

  it('should dispatch actions and update state', () => {
    const store = createStore(redux(counterReducer, { count: 0 }))

    store.getState().dispatch({ type: 'INCREMENT' })
    expect(store.getState().count).toBe(1)

    store.getState().dispatch({ type: 'INCREMENT' })
    expect(store.getState().count).toBe(2)

    store.getState().dispatch({ type: 'DECREMENT' })
    expect(store.getState().count).toBe(1)
  })

  it('should handle actions with payload', () => {
    const store = createStore(redux(counterReducer, { count: 0 }))

    store.getState().dispatch({ type: 'SET', payload: 42 })
    expect(store.getState().count).toBe(42)
  })

  it('should return the dispatched action', () => {
    const store = createStore(redux(counterReducer, { count: 0 }))

    const action = store.getState().dispatch({ type: 'INCREMENT' })
    expect(action).toEqual({ type: 'INCREMENT' })
  })

  it('should notify subscribers on dispatch', () => {
    const spy = vi.fn()
    const store = createStore(redux(counterReducer, { count: 0 }))

    store.subscribe(spy)
    store.getState().dispatch({ type: 'INCREMENT' })

    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('should not notify subscribers when state is unchanged', () => {
    const spy = vi.fn()
    const reducer = (state: { count: number }) => state
    const store = createStore(
      redux(reducer as typeof counterReducer, { count: 0 }),
    )

    store.subscribe(spy)
    store.getState().dispatch({ type: 'INCREMENT' })

    expect(spy).not.toHaveBeenCalled()
  })

  it('should work with create (React)', () => {
    const useBoundStore = create(redux(counterReducer, { count: 0 }))

    expect(useBoundStore.getState().count).toBe(0)

    useBoundStore.getState().dispatch({ type: 'INCREMENT' })
    expect(useBoundStore.getState().count).toBe(1)
  })

  it('should also expose dispatch on the api object', () => {
    const store = createStore(redux(counterReducer, { count: 0 }))

    ;(store as any).dispatch({ type: 'SET', payload: 10 })
    expect(store.getState().count).toBe(10)
  })

  it('should set dispatchFromDevtools flag', () => {
    const store = createStore(redux(counterReducer, { count: 0 }))

    expect((store as any).dispatchFromDevtools).toBe(true)
  })
})
