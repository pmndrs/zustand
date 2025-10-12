import { act, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { create } from 'zustand'
import { history } from 'zustand/middleware'

type CounterState = {
  count: number
  inc: () => void
  dec: () => void
  setCount: (count: number) => void
}

it('should create a store with history middleware', () => {
  const useStore = create<CounterState>()(
    history(
      (set) => ({
        count: 0,
        inc: () => set((state) => ({ count: state.count + 1 })),
        dec: () => set((state) => ({ count: state.count - 1 })),
        setCount: (count) => set({ count }),
      }),
      { maxHistorySize: 10 }
    )
  )

  const store = useStore.getState()
  expect(store.history).toBeDefined()
  expect(store.history.past).toHaveLength(1)
  expect(store.history.future).toHaveLength(0)
  expect(store.history.canUndo).toBe(false)
  expect(store.history.canRedo).toBe(false)
})

it('should track state changes in history', () => {
  const useStore = create<CounterState>()(
    history((set) => ({
      count: 0,
      inc: () => set((state) => ({ count: state.count + 1 })),
      dec: () => set((state) => ({ count: state.count - 1 })),
      setCount: (count) => set({ count }),
    }))
  )

  // Initial state
  expect(useStore.getState().count).toBe(0)
  expect(useStore.getState().history.past).toHaveLength(1)

  // First change
  act(() => {
    useStore.getState().inc()
  })
  expect(useStore.getState().count).toBe(1)
  expect(useStore.getState().history.past).toHaveLength(2)
  expect(useStore.getState().history.canUndo).toBe(true)

  // Second change
  act(() => {
    useStore.getState().inc()
  })
  expect(useStore.getState().count).toBe(2)
  expect(useStore.getState().history.past).toHaveLength(3)
  expect(useStore.getState().history.canUndo).toBe(true)
})

it('should undo state changes', () => {
  const useStore = create<CounterState>()(
    history((set) => ({
      count: 0,
      inc: () => set((state) => ({ count: state.count + 1 })),
      dec: () => set((state) => ({ count: state.count - 1 })),
      setCount: (count) => set({ count }),
    }))
  )

  // Make some changes
  act(() => {
    useStore.getState().inc()
    useStore.getState().inc()
  })
  expect(useStore.getState().count).toBe(2)

  // Undo once
  act(() => {
    useStore.getState().history.undo()
  })
  expect(useStore.getState().count).toBe(1)
  expect(useStore.getState().history.canUndo).toBe(true)
  expect(useStore.getState().history.canRedo).toBe(true)

  // Undo again
  act(() => {
    useStore.getState().history.undo()
  })
  expect(useStore.getState().count).toBe(0)
  expect(useStore.getState().history.canUndo).toBe(false)
  expect(useStore.getState().history.canRedo).toBe(true)
})

it('should redo state changes', () => {
  const useStore = create<CounterState>()(
    history((set) => ({
      count: 0,
      inc: () => set((state) => ({ count: state.count + 1 })),
      dec: () => set((state) => ({ count: state.count - 1 })),
      setCount: (count) => set({ count }),
    }))
  )

  // Make changes and undo
  act(() => {
    useStore.getState().inc()
    useStore.getState().inc()
    useStore.getState().history.undo()
    useStore.getState().history.undo()
  })
  expect(useStore.getState().count).toBe(0)
  expect(useStore.getState().history.canRedo).toBe(true)

  // Redo once
  act(() => {
    useStore.getState().history.redo()
  })
  expect(useStore.getState().count).toBe(1)
  expect(useStore.getState().history.canRedo).toBe(true)

  // Redo again
  act(() => {
    useStore.getState().history.redo()
  })
  expect(useStore.getState().count).toBe(2)
  expect(useStore.getState().history.canRedo).toBe(false)
})

it('should clear future when new action is performed after undo', () => {
  const useStore = create<CounterState>()(
    history((set) => ({
      count: 0,
      inc: () => set((state) => ({ count: state.count + 1 })),
      dec: () => set((state) => ({ count: state.count - 1 })),
      setCount: (count) => set({ count }),
    }))
  )

  // Make changes, undo, then make new change
  act(() => {
    useStore.getState().inc()
    useStore.getState().inc()
    useStore.getState().history.undo()
    useStore.getState().dec() // New action after undo
  })

  expect(useStore.getState().count).toBe(0)
  expect(useStore.getState().history.future).toHaveLength(0)
  expect(useStore.getState().history.canRedo).toBe(false)
})

it('should respect maxHistorySize option', () => {
  const useStore = create<CounterState>()(
    history(
      (set) => ({
        count: 0,
        inc: () => set((state) => ({ count: state.count + 1 })),
        dec: () => set((state) => ({ count: state.count - 1 })),
        setCount: (count) => set({ count }),
      }),
      { maxHistorySize: 3 }
    )
  )

  // Make more changes than maxHistorySize
  act(() => {
    for (let i = 0; i < 5; i++) {
      useStore.getState().inc()
    }
  })

  expect(useStore.getState().count).toBe(5)
  expect(useStore.getState().history.past).toHaveLength(3) // Should be limited to 3
})

it('should clear history', () => {
  const useStore = create<CounterState>()(
    history((set) => ({
      count: 0,
      inc: () => set((state) => ({ count: state.count + 1 })),
      dec: () => set((state) => ({ count: state.count - 1 })),
      setCount: (count) => set({ count }),
    }))
  )

  // Make changes
  act(() => {
    useStore.getState().inc()
    useStore.getState().inc()
  })

  expect(useStore.getState().history.past).toHaveLength(3)

  // Clear history
  act(() => {
    useStore.getState().history.clearHistory()
  })

  expect(useStore.getState().history.past).toHaveLength(1)
  expect(useStore.getState().history.future).toHaveLength(0)
  expect(useStore.getState().history.canUndo).toBe(false)
  expect(useStore.getState().history.canRedo).toBe(false)
})

it('should get history snapshot', () => {
  const useStore = create<CounterState>()(
    history((set) => ({
      count: 0,
      inc: () => set((state) => ({ count: state.count + 1 })),
      dec: () => set((state) => ({ count: state.count - 1 })),
      setCount: (count) => set({ count }),
    }))
  )

  // Make changes and undo
  act(() => {
    useStore.getState().inc()
    useStore.getState().inc()
    useStore.getState().history.undo()
  })

  const historySnapshot = useStore.getState().history.getHistory()
  
  expect(historySnapshot.past).toHaveLength(2)
  expect(historySnapshot.future).toHaveLength(1)
  expect(historySnapshot.present.count).toBe(1)
  expect(historySnapshot.past[0].state.count).toBe(0)
  expect(historySnapshot.past[1].state.count).toBe(1)
  expect(historySnapshot.future[0].state.count).toBe(2)
})

it('should include timestamps in history entries', () => {
  const useStore = create<CounterState>()(
    history((set) => ({
      count: 0,
      inc: () => set((state) => ({ count: state.count + 1 })),
      dec: () => set((state) => ({ count: state.count - 1 })),
      setCount: (count) => set({ count }),
    }))
  )

  const beforeTime = Date.now()
  
  act(() => {
    useStore.getState().inc()
  })

  const afterTime = Date.now()
  const historyEntry = useStore.getState().history.past[1]
  
  expect(historyEntry.timestamp).toBeGreaterThanOrEqual(beforeTime)
  expect(historyEntry.timestamp).toBeLessThanOrEqual(afterTime)
})

it('should work with React components', () => {
  const useStore = create<CounterState>()(
    history((set) => ({
      count: 0,
      inc: () => set((state) => ({ count: state.count + 1 })),
      dec: () => set((state) => ({ count: state.count - 1 })),
      setCount: (count) => set({ count }),
    }))
  )

  const TestComponent = () => {
    const { count, inc, history } = useStore()
    
    return (
      <div>
        <span data-testid="count">{count}</span>
        <button data-testid="inc" onClick={inc}>
          Increment
        </button>
        <button data-testid="undo" onClick={history.undo}>
          Undo
        </button>
        <span data-testid="can-undo">{history.canUndo.toString()}</span>
      </div>
    )
  }

  render(<TestComponent />)

  expect(screen.getByTestId('count')).toHaveTextContent('0')
  expect(screen.getByTestId('can-undo')).toHaveTextContent('false')

  act(() => {
    screen.getByTestId('inc').click()
  })

  expect(screen.getByTestId('count')).toHaveTextContent('1')
  expect(screen.getByTestId('can-undo')).toHaveTextContent('true')

  act(() => {
    screen.getByTestId('undo').click()
  })

  expect(screen.getByTestId('count')).toHaveTextContent('0')
  expect(screen.getByTestId('can-undo')).toHaveTextContent('false')
})
