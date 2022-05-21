import { act, renderHook } from '@testing-library/react';
import { useCounter } from './counter.store';

describe('Counter Store', () => {
  it('should have an initial value of 0', () => {
    const { result } = renderHook(() => useCounter());
    expect(result.current.count).toBe(0);
  });

  it('should increment the value', () => {
    const { result } = renderHook(() => useCounter());
    act(() => {
      result.current.increment();
      result.current.increment();
      result.current.increment();
      result.current.increment();
    });
    expect(result.current.count).toBe(4);
  });

  it('should decrement the value', () => {
    const { result } = renderHook(() => useCounter());
    act(() => {
      result.current.decrement();
      result.current.decrement();
      result.current.decrement();
      result.current.decrement();
    });
    expect(result.current.count).toBe(-4);
  });

  it('should reset the value', () => {
    const { result } = renderHook(() => useCounter());
    act(() => {
      result.current.increment();
      result.current.increment();
      result.current.increment();
    });
    expect(result.current.count).toBe(3);
    act(() => {
      result.current.reset();
    });
    expect(result.current.count).toBe(0);
  });
});
