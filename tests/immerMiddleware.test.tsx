import { describe, expect, it } from 'vitest'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { createStore } from 'zustand/vanilla'

describe('immer middleware', () => {
  it('typical case', () => {
    type CounterState = {
      count: number
      inc: () => void
    }

    const useBoundStore = create<CounterState>()(
      immer((set, get) => ({
        count: 0,
        inc: () =>
          set((state) => {
            state.count = get().count + 1
          }),
      })),
    )

    expect(useBoundStore.getState().count).toEqual(0)

    useBoundStore.getState().inc()

    expect(useBoundStore.getState().count).toEqual(1)
  })

  it('`replace` must not be `false` in `setState`', () => {
    const store = createStore<Record<string, any>>()(immer(() => ({})))

    expect(() => {
      store.setState((state) => {
        state.x = 3
      }, /* replace */ false)
    }).toThrow('must be `true`')
  })

  it('must pass a function to `setState`', () => {
    const store = createStore<Record<string, any>>()(immer(() => ({})))

    expect(() => {
      store.setState({ x: 3 })
    }).toThrow('must pass a function')
  })

  // Bug: https://github.com/pmndrs/zustand/discussions/2480
  it('delete key at root of state', () => {
    type State = Record<string, any>

    const store = createStore<State>()(immer(() => ({})))

    expect(store.getState()).toEqual({})

    store.setState((state) => {
      state.x = 3
    })

    expect(store.getState()).toEqual({ x: 3 })
    store.setState((state) => {
      delete state.x
    })
    expect(store.getState()).toEqual({})
  })
})
