import { describe, it } from 'vitest'
import { create } from 'zustand'
import type { StoreApi } from 'zustand'
import {
  combine,
  devtools,
  persist,
  redux,
  subscribeWithSelector,
} from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { createStore } from 'zustand/vanilla'

type CounterState = {
  count: number
  inc: () => void
}

describe('counter state spec (no middleware)', () => {
  it('no middleware', () => {
    const useBoundStore = create<CounterState>((set, get) => ({
      count: 0,
      inc: () => set({ count: get().count + 1 }, false),
    }))
    const TestComponent = () => {
      useBoundStore((s) => s.count) * 2
      useBoundStore((s) => s.inc)()
      useBoundStore().count * 2
      useBoundStore().inc()
      useBoundStore.getState().count * 2
      useBoundStore.getState().inc()
      return <></>
    }
    TestComponent
  })
})

describe('counter state spec (single middleware)', () => {
  it('immer', () => {
    const useBoundStore = create<CounterState>()(
      immer((set, get) => ({
        count: 0,
        inc: () =>
          set((state) => {
            state.count = get().count + 1
          }),
      })),
    )
    const TestComponent = () => {
      useBoundStore((s) => s.count) * 2
      useBoundStore((s) => s.inc)()
      useBoundStore().count * 2
      useBoundStore().inc()
      useBoundStore.getState().count * 2
      useBoundStore.getState().inc()
      return <></>
    }
    TestComponent

    const _testSubtyping: StoreApi<object> = createStore(
      immer(() => ({ count: 0 })),
    )
  })

  it('redux', () => {
    const useBoundStore = create(
      redux<{ count: number }, { type: 'INC' }>(
        (state, action) => {
          switch (action.type) {
            case 'INC':
              return { ...state, count: state.count + 1 }
            default:
              return state
          }
        },
        { count: 0 },
      ),
    )
    const TestComponent = () => {
      useBoundStore((s) => s.count) * 2
      useBoundStore((s) => s.dispatch)({ type: 'INC' })
      useBoundStore().dispatch({ type: 'INC' })
      useBoundStore.dispatch({ type: 'INC' })
      return <></>
    }
    TestComponent

    const _testSubtyping: StoreApi<object> = createStore(
      redux((x) => x, { count: 0 }),
    )
  })

  it('devtools', () => {
    const useBoundStore = create<CounterState>()(
      devtools(
        (set, get) => ({
          count: 0,
          inc: () => set({ count: get().count + 1 }, false, 'inc'),
        }),
        { name: 'prefix' },
      ),
    )
    const TestComponent = () => {
      useBoundStore((s) => s.count) * 2
      useBoundStore((s) => s.inc)()
      useBoundStore().count * 2
      useBoundStore().inc()
      useBoundStore.getState().count * 2
      useBoundStore.getState().inc()
      useBoundStore.setState({ count: 0 }, false, 'reset')
      return <></>
    }
    TestComponent

    const _testSubtyping: StoreApi<object> = createStore(
      devtools(() => ({ count: 0 })),
    )
  })

  it('subscribeWithSelector', () => {
    const useBoundStore = create<CounterState>()(
      subscribeWithSelector((set, get) => ({
        count: 1,
        inc: () => set({ count: get().count + 1 }, false),
      })),
    )
    const TestComponent = () => {
      useBoundStore((s) => s.count) * 2
      useBoundStore((s) => s.inc)()
      useBoundStore().count * 2
      useBoundStore().inc()
      useBoundStore.getState().count * 2
      useBoundStore.getState().inc()
      useBoundStore.subscribe(
        (state) => state.count,
        (count) => console.log(count * 2),
      )
      return <></>
    }
    TestComponent

    const _testSubtyping: StoreApi<object> = createStore(
      subscribeWithSelector(() => ({ count: 0 })),
    )
  })

  it('combine', () => {
    const useBoundStore = create(
      combine({ count: 1 }, (set, get) => ({
        inc: () => set({ count: get().count + 1 }, false),
      })),
    )
    const TestComponent = () => {
      useBoundStore((s) => s.count) * 2
      useBoundStore((s) => s.inc)()
      useBoundStore().count * 2
      useBoundStore().inc()
      useBoundStore.getState().count * 2
      useBoundStore.getState().inc()
      return <></>
    }
    TestComponent

    const _testSubtyping: StoreApi<object> = createStore(
      combine({ count: 0 }, () => ({})),
    )
  })

  it('persist', () => {
    const useBoundStore = create<CounterState>()(
      persist(
        (set, get) => ({
          count: 1,
          inc: () => set({ count: get().count + 1 }, false),
        }),
        { name: 'prefix' },
      ),
    )
    const TestComponent = () => {
      useBoundStore((s) => s.count) * 2
      useBoundStore((s) => s.inc)()
      useBoundStore().count * 2
      useBoundStore().inc()
      useBoundStore.getState().count * 2
      useBoundStore.getState().inc()
      useBoundStore.persist.hasHydrated()
      return <></>
    }
    TestComponent

    const _testSubtyping: StoreApi<object> = createStore(
      persist(() => ({ count: 0 }), { name: 'prefix' }),
    )
  })

  it('persist with partialize', () => {
    const useBoundStore = create<CounterState>()(
      persist(
        (set, get) => ({
          count: 1,
          inc: () => set({ count: get().count + 1 }, false),
        }),
        { name: 'prefix', partialize: (s) => s.count },
      ),
    )
    const TestComponent = () => {
      useBoundStore((s) => s.count) * 2
      useBoundStore((s) => s.inc)()
      useBoundStore().count * 2
      useBoundStore().inc()
      useBoundStore.getState().count * 2
      useBoundStore.getState().inc()
      useBoundStore.persist.hasHydrated()
      useBoundStore.persist.setOptions({
        // @ts-expect-error to test if the partialized state is inferred as number
        partialize: () => 'not-a-number',
      })
      return <></>
    }
    TestComponent
  })

  it('persist without custom api (#638)', () => {
    const useBoundStore = create<CounterState>()(
      persist(
        (set, get) => ({
          count: 1,
          inc: () => set({ count: get().count + 1 }, false),
        }),
        { name: 'prefix' },
      ),
    )
    const TestComponent = () => {
      useBoundStore((s) => s.count) * 2
      useBoundStore((s) => s.inc)()
      useBoundStore().count * 2
      useBoundStore().inc()
      useBoundStore.getState().count * 2
      useBoundStore.getState().inc()
      return <></>
    }
    TestComponent
  })
})

describe('counter state spec (double middleware)', () => {
  it('immer & devtools', () => {
    const useBoundStore = create<CounterState>()(
      immer(
        devtools(
          (set, get) => ({
            count: 0,
            inc: () =>
              set(
                (state) => {
                  state.count = get().count + 1
                },
                false,
                { type: 'inc', by: 1 },
              ),
          }),
          { name: 'prefix' },
        ),
      ),
    )
    const TestComponent = () => {
      useBoundStore((s) => s.count) * 2
      useBoundStore((s) => s.inc)()
      useBoundStore().count * 2
      useBoundStore().inc()
      useBoundStore.getState().count * 2
      useBoundStore.getState().inc()
      useBoundStore.setState({ count: 0 }, false, 'reset')
      return <></>
    }
    TestComponent
  })

  it('devtools & redux', () => {
    const useBoundStore = create(
      devtools(
        redux(
          (state, action: { type: 'INC' }) => {
            switch (action.type) {
              case 'INC':
                return { ...state, count: state.count + 1 }
              default:
                return state
            }
          },
          { count: 0 },
        ),
        { name: 'prefix' },
      ),
    )
    const TestComponent = () => {
      useBoundStore((s) => s.count) * 2
      useBoundStore((s) => s.dispatch)({ type: 'INC' })
      useBoundStore().dispatch({ type: 'INC' })
      useBoundStore.dispatch({ type: 'INC' })
      useBoundStore.setState({ count: 0 }, false, 'reset')
      return <></>
    }
    TestComponent
  })

  it('devtools & combine', () => {
    const useBoundStore = create(
      devtools(
        combine({ count: 1 }, (set, get) => ({
          inc: () => set({ count: get().count + 1 }, false, 'inc'),
        })),
        { name: 'prefix' },
      ),
    )
    const TestComponent = () => {
      useBoundStore((s) => s.count) * 2
      useBoundStore((s) => s.inc)()
      useBoundStore().count * 2
      useBoundStore().inc()
      useBoundStore.getState().count * 2
      useBoundStore.getState().inc()
      useBoundStore.setState({ count: 0 }, false, 'reset')
      return <></>
    }
    TestComponent
  })

  it('subscribeWithSelector & combine', () => {
    const useBoundStore = create(
      subscribeWithSelector(
        combine({ count: 1 }, (set, get) => ({
          inc: () => set({ count: get().count + 1 }, false),
        })),
      ),
    )
    const TestComponent = () => {
      useBoundStore((s) => s.count) * 2
      useBoundStore((s) => s.inc)()
      useBoundStore().count * 2
      useBoundStore().inc()
      useBoundStore.getState().count * 2
      useBoundStore.getState().inc()
      useBoundStore.subscribe(
        (state) => state.count,
        (count) => console.log(count * 2),
      )
      return <></>
    }
    TestComponent
  })

  it('devtools & subscribeWithSelector', () => {
    const useBoundStore = create<CounterState>()(
      devtools(
        subscribeWithSelector((set, get) => ({
          count: 1,
          inc: () => set({ count: get().count + 1 }, false, 'inc'),
        })),
        { name: 'prefix' },
      ),
    )
    const TestComponent = () => {
      useBoundStore((s) => s.count) * 2
      useBoundStore((s) => s.inc)()
      useBoundStore().count * 2
      useBoundStore().inc()
      useBoundStore.getState().count * 2
      useBoundStore.getState().inc()
      useBoundStore.subscribe(
        (state) => state.count,
        (count) => console.log(count * 2),
      )
      useBoundStore.setState({ count: 0 }, false, 'reset')
      return <></>
    }
    TestComponent
  })

  it('devtools & persist', () => {
    const useBoundStore = create<CounterState>()(
      devtools(
        persist(
          (set, get) => ({
            count: 1,
            inc: () => set({ count: get().count + 1 }, false, 'inc'),
          }),
          { name: 'count' },
        ),
        { name: 'prefix' },
      ),
    )
    const TestComponent = () => {
      useBoundStore((s) => s.count) * 2
      useBoundStore((s) => s.inc)()
      useBoundStore().count * 2
      useBoundStore().inc()
      useBoundStore.getState().count * 2
      useBoundStore.getState().inc()
      useBoundStore.setState({ count: 0 }, false, 'reset')
      useBoundStore.persist.hasHydrated()
      return <></>
    }
    TestComponent
  })
})

describe('counter state spec (triple middleware)', () => {
  it('devtools & persist & immer', () => {
    const useBoundStore = create<CounterState>()(
      devtools(
        persist(
          immer((set, get) => ({
            count: 0,
            inc: () =>
              set((state) => {
                state.count = get().count + 1
              }),
          })),
          { name: 'count' },
        ),
        { name: 'prefix' },
      ),
    )
    const TestComponent = () => {
      useBoundStore((s) => s.count) * 2
      useBoundStore((s) => s.inc)()
      useBoundStore().count * 2
      useBoundStore().inc()
      useBoundStore.getState().count * 2
      useBoundStore.getState().inc()
      useBoundStore.setState({ count: 0 }, false, 'reset')
      useBoundStore.persist.hasHydrated()
      return <></>
    }
    TestComponent
  })

  it('devtools & subscribeWithSelector & combine', () => {
    const useBoundStore = create(
      devtools(
        subscribeWithSelector(
          combine({ count: 1 }, (set, get) => ({
            inc: () => set({ count: get().count + 1 }, false, 'inc'),
          })),
        ),
        { name: 'prefix' },
      ),
    )
    const TestComponent = () => {
      useBoundStore((s) => s.count) * 2
      useBoundStore((s) => s.inc)()
      useBoundStore().count * 2
      useBoundStore().inc()
      useBoundStore.getState().count * 2
      useBoundStore.getState().inc()
      useBoundStore.subscribe(
        (state) => state.count,
        (count) => console.log(count * 2),
      )
      useBoundStore.setState({ count: 0 }, false, 'reset')
      return <></>
    }
    TestComponent
  })

  it('devtools & subscribeWithSelector & persist', () => {
    const useBoundStore = create<CounterState>()(
      devtools(
        subscribeWithSelector(
          persist(
            (set, get) => ({
              count: 0,
              inc: () => set({ count: get().count + 1 }, false),
            }),
            { name: 'count' },
          ),
        ),
        { name: 'prefix' },
      ),
    )
    const TestComponent = () => {
      useBoundStore((s) => s.count) * 2
      useBoundStore((s) => s.inc)()
      useBoundStore().count * 2
      useBoundStore().inc()
      useBoundStore.getState().count * 2
      useBoundStore.getState().inc()
      useBoundStore.subscribe(
        (state) => state.count,
        (count) => console.log(count * 2),
      )
      useBoundStore.setState({ count: 0 }, false, 'reset')
      useBoundStore.persist.hasHydrated()
      return <></>
    }
    TestComponent
  })
})

describe('counter state spec (quadruple middleware)', () => {
  it('devtools & subscribeWithSelector & persist & immer (#616)', () => {
    const useBoundStore = create<CounterState>()(
      devtools(
        subscribeWithSelector(
          persist(
            immer((set, get) => ({
              count: 0,
              inc: () =>
                set((state) => {
                  state.count = get().count + 1
                }),
            })),
            { name: 'count' },
          ),
        ),
        { name: 'prefix' },
      ),
    )
    const TestComponent = () => {
      useBoundStore((s) => s.count) * 2
      useBoundStore((s) => s.inc)()
      useBoundStore().count * 2
      useBoundStore().inc()
      useBoundStore.getState().count * 2
      useBoundStore.getState().inc()
      useBoundStore.subscribe(
        (state) => state.count,
        (count) => console.log(count * 2),
      )
      useBoundStore.setState({ count: 0 }, false, 'reset')
      useBoundStore.persist.hasHydrated()
      return <></>
    }
    TestComponent
  })
})

describe('more complex state spec with subscribeWithSelector', () => {
  it('#619, #632', () => {
    const useBoundStore = create(
      subscribeWithSelector(
        persist(
          () => ({
            foo: true,
          }),
          { name: 'name' },
        ),
      ),
    )
    const TestComponent = () => {
      useBoundStore((s) => s.foo)
      useBoundStore().foo
      useBoundStore.getState().foo
      useBoundStore.subscribe(
        (state) => state.foo,
        (foo) => console.log(foo),
      )
      useBoundStore.persist.hasHydrated()
      return <></>
    }
    TestComponent
  })

  it('#631', () => {
    type MyState = {
      foo: number | null
    }
    const useBoundStore = create<MyState>()(
      subscribeWithSelector(
        () =>
          ({
            foo: 1,
          }) as MyState, // NOTE: Asserting the entire state works too.
      ),
    )
    const TestComponent = () => {
      useBoundStore((s) => s.foo)
      useBoundStore().foo
      useBoundStore.getState().foo
      useBoundStore.subscribe(
        (state) => state.foo,
        (foo) => console.log(foo),
      )
      return <></>
    }
    TestComponent
  })

  it('#650', () => {
    type MyState = {
      token: string | undefined
      authenticated: boolean
      authenticate: (username: string, password: string) => Promise<void>
    }
    const useBoundStore = create<MyState>()(
      persist(
        (set) => ({
          token: undefined,
          authenticated: false,
          authenticate: async (_username, _password) => {
            set({ authenticated: true })
          },
        }),
        { name: 'auth-store' },
      ),
    )
    const TestComponent = () => {
      useBoundStore((s) => s.authenticated)
      useBoundStore((s) => s.authenticate)('u', 'p')
      useBoundStore().authenticated
      useBoundStore().authenticate('u', 'p')
      useBoundStore.getState().authenticated
      useBoundStore.getState().authenticate('u', 'p')
      return <></>
    }
    TestComponent
  })
})

describe('create with explicitly annotated mutators', () => {
  it('subscribeWithSelector & persist', () => {
    const useBoundStore = create<
      CounterState,
      [
        ['zustand/subscribeWithSelector', never],
        ['zustand/persist', CounterState],
      ]
    >(
      subscribeWithSelector(
        persist(
          (set, get) => ({
            count: 0,
            inc: () => set({ count: get().count + 1 }, false),
          }),
          { name: 'count' },
        ),
      ),
    )
    const TestComponent = () => {
      useBoundStore((s) => s.count) * 2
      useBoundStore((s) => s.inc)()
      useBoundStore().count * 2
      useBoundStore().inc()
      useBoundStore.getState().count * 2
      useBoundStore.getState().inc()
      useBoundStore.subscribe(
        (state) => state.count,
        (count) => console.log(count * 2),
      )
      useBoundStore.setState({ count: 0 }, false)
      useBoundStore.persist.hasHydrated()
      return <></>
    }
    TestComponent
  })
})
