import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { type Mock } from 'vitest'
import { create } from 'zustand'
import { syncStore } from '../src/middleware'

type TestState = {
  count: number
  user: string
  increment: () => void
}

describe('syncStore middleware', () => {
  let mockPostMessage: Mock
  let mockEventListener: Mock

  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()

    // Mock کردن BroadcastChannel
    mockPostMessage = vi.fn()
    mockEventListener = vi.fn()

    global.BroadcastChannel = vi.fn().mockImplementation(() => ({
      postMessage: mockPostMessage,
      onmessage: mockEventListener,
      close: vi.fn(),
    }))
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should sync state via BroadcastChannel', async () => {
    const useStore1 = create(
      syncStore<TestState>({
        name: 'test-channel',
        fields: ['count'],
      })((set) => ({
        count: 0,
        user: 'guest',
        increment: () => set((s) => ({ count: s.count + 1 })),
      })),
    )

    const useStore2 = create(
      syncStore<TestState>({
        name: 'test-channel',
        fields: ['count'],
      })((set) => ({
        count: 0,
        user: 'guest',
        increment: () => set((s) => ({ count: s.count + 1 })),
      })),
    )

    
    mockEventListener.mockImplementation((event, listener) => {
      if (event === 'message') {
        listener({ data: { count: 1 } })
      }
    })

    useStore1.getState().increment()
    vi.advanceTimersByTime(100)

    expect(useStore2.getState().count).toBe(1)
    expect(useStore2.getState().user).toBe('guest')
  })

  it('should use localStorage fallback', async () => {
    const originalBroadcastChannel = global.BroadcastChannel
    global.BroadcastChannel = undefined as any

    const useStore = create(
      syncStore<TestState>({
        name: 'test-storage',
        fields: ['count'],
      })((set) => ({
        count: 0,
        user: 'guest',
        increment: () => set((s) => ({ count: s.count + 1 })),
      })),
    )

    useStore.getState().increment()
    vi.advanceTimersByTime(100)

    expect(JSON.parse(localStorage.getItem('test-storage')!)).toEqual({
      count: 1,
    })

    global.BroadcastChannel = originalBroadcastChannel
  })

  it('should ignore non-synced fields', async () => {
    const useStore1 = create(
      syncStore<TestState>({
        name: 'test-channel',
        fields: ['count'],
      })((set) => ({
        count: 0,
        user: 'guest',
        increment: () => set((s) => ({ count: s.count + 1 })),
      })),
    )

    const useStore2 = create(
      syncStore<TestState>({
        name: 'test-channel',
        fields: ['count'],
      })((set) => ({
        count: 0,
        user: 'guest',
        increment: () => set((s) => ({ count: s.count + 1 })),
      })),
    )

    useStore1.setState({ user: 'admin' })
    vi.advanceTimersByTime(100)

    expect(useStore2.getState().user).toBe('guest')
  })
})
