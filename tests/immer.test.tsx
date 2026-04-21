import { describe, expect, it } from 'vitest'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { createStore } from 'zustand/vanilla'

describe('immer middleware', () => {
  it('should mutate state via an immer draft (function updater)', () => {
    type State = { count: number; inc: () => void }
    const useBoundStore = create<State>()(
      immer((set) => ({
        count: 0,
        inc: () =>
          set((state) => {
            state.count += 1
          }),
      })),
    )

    useBoundStore.getState().inc()
    expect(useBoundStore.getState().count).toBe(1)
  })

  it('should not apply produce when updater is not a function', () => {
    type State = { count: number; name: string }
    const useBoundStore = create<State>()(
      immer(() => ({ count: 0, name: 'zustand' })),
    )

    useBoundStore.setState({ count: 5 })
    expect(useBoundStore.getState()).toEqual({ count: 5, name: 'zustand' })
  })

  it('should replace the entire state when replace flag is true', () => {
    type State = { a: number; b?: number }
    const useBoundStore = create<State>()(immer(() => ({ a: 1, b: 2 })))

    useBoundStore.setState({ a: 9 }, true)
    expect(useBoundStore.getState()).toEqual({ a: 9 })
  })

  it('should produce nested state updates via a draft without mutating the previous state', () => {
    type State = {
      user: { name: string; tags: string[] }
      addTag: (tag: string) => void
    }
    const useBoundStore = create<State>()(
      immer((set) => ({
        user: { name: 'bear', tags: ['a'] },
        addTag: (tag) =>
          set((state) => {
            state.user.tags.push(tag)
          }),
      })),
    )

    const previousUser = useBoundStore.getState().user
    useBoundStore.getState().addTag('b')

    expect(useBoundStore.getState().user.tags).toEqual(['a', 'b'])
    expect(useBoundStore.getState().user).not.toBe(previousUser)
    expect(previousUser.tags).toEqual(['a'])
  })

  it('should work with vanilla createStore', () => {
    type State = { count: number }
    const store = createStore<State>()(immer(() => ({ count: 0 })))

    store.setState((state) => {
      state.count = 10
    })

    expect(store.getState().count).toBe(10)
  })
})
