// store/context-counter.store.spec.tsx

import { act, renderHook } from '@testing-library/react'
import { CounterProvider, createCounter, useContextCounter } from './context-counter.store'

// we declare the wrapper for the hook aka our prvoider with a creator
// store will be reset before each test
const wrapper = ({ children }: any) => (
  <CounterProvider createStore={createCounter}>
    {children}
  </CounterProvider>
)

// the tests are going to be exactly the same as the ones in the counter.store.spec.ts
// but this time we will just wrap them in a Context Provider

describe('Context Counter Store', () => {
  it('should have an initial value of 0', () => {
    const { result } = renderHook(() => useContextCounter(), { wrapper })
    expect(result.current.count).toBe(0)
  })

  it('should increment the value', () => {
    const { result } = renderHook(() => useContextCounter(), { wrapper })
    act(() => {
      result.current.increment()
      result.current.increment()
      result.current.increment()
      result.current.increment()
    })
    expect(result.current.count).toBe(4)
  })

  it('should decrement the value', () => {
    const { result } = renderHook(() => useContextCounter(), { wrapper })
    act(() => {
      result.current.decrement()
      result.current.decrement()
      result.current.decrement()
      result.current.decrement()
    })
    expect(result.current.count).toBe(-4)
  })

  it('should reset the value', () => {
    const { result } = renderHook(() => useContextCounter(), { wrapper })
    act(() => {
      result.current.increment()
      result.current.increment()
      result.current.increment()
    })
    expect(result.current.count).toBe(3)
    act(() => {
      result.current.reset()
    })
    expect(result.current.count).toBe(0)
  })
})
