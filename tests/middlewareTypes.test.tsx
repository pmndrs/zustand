import { produce } from 'immer'
import type { Draft } from 'immer'
import create, {
  GetState,
  SetState,
  State,
  StateCreator,
  StoreApi,
} from 'zustand'
import {
  PersistOptions,
  StoreApiWithDevtools,
  StoreApiWithPersist,
  StoreApiWithSubscribeWithSelector,
  combine,
  devtools,
  persist,
  redux,
  subscribeWithSelector,
} from 'zustand/middleware'

const immer =
  <
    T extends State,
    CustomSetState extends SetState<T>,
    CustomGetState extends GetState<T>,
    CustomStoreApi extends StoreApi<T>
  >(
    config: StateCreator<
      T,
      (partial: ((draft: Draft<T>) => void) | T, replace?: boolean) => void,
      CustomGetState,
      CustomStoreApi
    >
  ): StateCreator<T, CustomSetState, CustomGetState, CustomStoreApi> =>
  (set, get, api) =>
    config(
      (partial, replace) => {
        const nextState =
          typeof partial === 'function'
            ? produce(partial as (state: Draft<T>) => T)
            : (partial as T)
        return set(nextState, replace)
      },
      get,
      api
    )

type CounterState = {
  count: number
  inc: () => void
}

describe('counter state spec (no middleware)', () => {
  it('no middleware', () => {
    const useStore = create<CounterState>((set, get) => ({
      count: 0,
      inc: () => set({ count: get().count + 1 }, false),
    }))
    const TestComponent = () => {
      useStore((s) => s.count) * 2
      useStore((s) => s.inc)()
      useStore().count * 2
      useStore().inc()
      useStore.getState().count * 2
      useStore.getState().inc()
      return <></>
    }
    TestComponent
  })
})

describe('counter state spec (single middleware)', () => {
  it('immer', () => {
    const useStore = create<CounterState>(
      immer((set, get) => ({
        count: 0,
        inc: () =>
          set((state) => {
            state.count = get().count + 1
          }),
      }))
    )
    const TestComponent = () => {
      useStore((s) => s.count) * 2
      useStore((s) => s.inc)()
      useStore().count * 2
      useStore().inc()
      useStore.getState().count * 2
      useStore.getState().inc()
      return <></>
    }
    TestComponent
  })

  it('redux', () => {
    const useStore = create(
      redux<{ count: number }, { type: 'INC' }>(
        (state, action) => {
          switch (action.type) {
            case 'INC':
              return { ...state, count: state.count + 1 }
            default:
              return state
          }
        },
        { count: 0 }
      )
    )
    const TestComponent = () => {
      useStore((s) => s.count) * 2
      useStore((s) => s.dispatch)({ type: 'INC' })
      useStore().dispatch({ type: 'INC' })
      useStore.dispatch({ type: 'INC' })
      return <></>
    }
    TestComponent
  })

  it('devtools', () => {
    const useStore = create<
      CounterState,
      SetState<CounterState>,
      GetState<CounterState>,
      StoreApiWithDevtools<CounterState>
    >(
      devtools(
        (set, get) => ({
          count: 0,
          inc: () => set({ count: get().count + 1 }, false, 'inc'),
        }),
        { name: 'prefix' }
      )
    )
    const TestComponent = () => {
      useStore((s) => s.count) * 2
      useStore((s) => s.inc)()
      useStore().count * 2
      useStore().inc()
      useStore.getState().count * 2
      useStore.getState().inc()
      useStore.setState({ count: 0 }, false, 'reset')
      return <></>
    }
    TestComponent
  })

  it('subscribeWithSelector', () => {
    const useStore = create<
      CounterState,
      SetState<CounterState>,
      GetState<CounterState>,
      StoreApiWithSubscribeWithSelector<CounterState>
    >(
      subscribeWithSelector((set, get) => ({
        count: 1,
        inc: () => set({ count: get().count + 1 }, false),
      }))
    )
    const TestComponent = () => {
      useStore((s) => s.count) * 2
      useStore((s) => s.inc)()
      useStore().count * 2
      useStore().inc()
      useStore.getState().count * 2
      useStore.getState().inc()
      useStore.subscribe(
        (state) => state.count,
        (count) => console.log(count * 2)
      )
      return <></>
    }
    TestComponent
  })

  it('combine', () => {
    const useStore = create(
      combine({ count: 1 }, (set, get) => ({
        inc: () => set({ count: get().count + 1 }, false),
      }))
    )
    const TestComponent = () => {
      useStore((s) => s.count) * 2
      useStore((s) => s.inc)()
      useStore().count * 2
      useStore().inc()
      useStore.getState().count * 2
      useStore.getState().inc()
      return <></>
    }
    TestComponent
  })

  it('persist', () => {
    const useStore = create<
      CounterState,
      SetState<CounterState>,
      GetState<CounterState>,
      StoreApiWithPersist<CounterState>
    >(
      persist(
        (set, get) => ({
          count: 1,
          inc: () => set({ count: get().count + 1 }, false),
        }),
        { name: 'prefix' }
      )
    )
    const TestComponent = () => {
      useStore((s) => s.count) * 2
      useStore((s) => s.inc)()
      useStore().count * 2
      useStore().inc()
      useStore.getState().count * 2
      useStore.getState().inc()
      useStore.persist.hasHydrated()
      return <></>
    }
    TestComponent
  })

  it('persist without custom api (#638)', () => {
    const useStore = create<CounterState>(
      persist(
        (set, get) => ({
          count: 1,
          inc: () => set({ count: get().count + 1 }, false),
        }),
        { name: 'prefix' }
      )
    )
    const TestComponent = () => {
      useStore((s) => s.count) * 2
      useStore((s) => s.inc)()
      useStore().count * 2
      useStore().inc()
      useStore.getState().count * 2
      useStore.getState().inc()
      return <></>
    }
    TestComponent
  })
})

describe('counter state spec (double middleware)', () => {
  it('devtools & immer', () => {
    const useStore = create<
      CounterState,
      SetState<CounterState>,
      GetState<CounterState>,
      StoreApiWithDevtools<CounterState>
    >(
      devtools(
        immer((set, get) => ({
          count: 0,
          inc: () =>
            set((state) => {
              state.count = get().count + 1
            }),
        })),
        { name: 'prefix' }
      )
    )
    const TestComponent = () => {
      useStore((s) => s.count) * 2
      useStore((s) => s.inc)()
      useStore().count * 2
      useStore().inc()
      useStore.getState().count * 2
      useStore.getState().inc()
      useStore.setState({ count: 0 }, false, 'reset')
      return <></>
    }
    TestComponent
  })

  it('devtools & redux', () => {
    const useStore = create(
      devtools(
        redux<{ count: number }, { type: 'INC' }>(
          (state, action) => {
            switch (action.type) {
              case 'INC':
                return { ...state, count: state.count + 1 }
              default:
                return state
            }
          },
          { count: 0 }
        ),
        { name: 'prefix' }
      )
    )
    const TestComponent = () => {
      useStore((s) => s.count) * 2
      useStore((s) => s.dispatch)({ type: 'INC' })
      useStore().dispatch({ type: 'INC' })
      useStore.dispatch({ type: 'INC' })
      useStore.setState({ count: 0 }, false, 'reset')
      return <></>
    }
    TestComponent
  })

  it('devtools & combine', () => {
    const useStore = create(
      devtools(
        combine({ count: 1 }, (set, get) => ({
          inc: () => set({ count: get().count + 1 }, false, 'inc'),
        })),
        { name: 'prefix' }
      )
    )
    const TestComponent = () => {
      useStore((s) => s.count) * 2
      useStore((s) => s.inc)()
      useStore().count * 2
      useStore().inc()
      useStore.getState().count * 2
      useStore.getState().inc()
      useStore.setState({ count: 0 }, false, 'reset')
      return <></>
    }
    TestComponent
  })

  it('subscribeWithSelector & combine', () => {
    const useStore = create(
      subscribeWithSelector(
        combine({ count: 1 }, (set, get) => ({
          inc: () => set({ count: get().count + 1 }, false),
        }))
      )
    )
    const TestComponent = () => {
      useStore((s) => s.count) * 2
      useStore((s) => s.inc)()
      useStore().count * 2
      useStore().inc()
      useStore.getState().count * 2
      useStore.getState().inc()
      useStore.subscribe(
        (state) => state.count,
        (count) => console.log(count * 2)
      )
      return <></>
    }
    TestComponent
  })

  it('devtools & subscribeWithSelector', () => {
    const useStore = create<
      CounterState,
      SetState<CounterState>,
      GetState<CounterState>,
      StoreApiWithSubscribeWithSelector<CounterState> &
        StoreApiWithDevtools<CounterState>
    >(
      devtools(
        subscribeWithSelector((set, get) => ({
          count: 1,
          inc: () => set({ count: get().count + 1 }, false, 'inc'),
        })),
        { name: 'prefix' }
      )
    )
    const TestComponent = () => {
      useStore((s) => s.count) * 2
      useStore((s) => s.inc)()
      useStore().count * 2
      useStore().inc()
      useStore.getState().count * 2
      useStore.getState().inc()
      useStore.subscribe(
        (state) => state.count,
        (count) => console.log(count * 2)
      )
      useStore.setState({ count: 0 }, false, 'reset')
      return <></>
    }
    TestComponent
  })

  it('devtools & persist', () => {
    const useStore = create<
      CounterState,
      SetState<CounterState>,
      GetState<CounterState>,
      StoreApiWithPersist<CounterState> & StoreApiWithDevtools<CounterState>
    >(
      devtools(
        persist(
          (set, get) => ({
            count: 1,
            inc: () => set({ count: get().count + 1 }, false, 'inc'),
          }),
          { name: 'count' }
        ),
        { name: 'prefix' }
      )
    )
    const TestComponent = () => {
      useStore((s) => s.count) * 2
      useStore((s) => s.inc)()
      useStore().count * 2
      useStore().inc()
      useStore.getState().count * 2
      useStore.getState().inc()
      useStore.setState({ count: 0 }, false, 'reset')
      useStore.persist.hasHydrated()
      return <></>
    }
    TestComponent
  })
})

describe('counter state spec (triple middleware)', () => {
  it('devtools & persist & immer', () => {
    const useStore = create<
      CounterState,
      SetState<CounterState>,
      GetState<CounterState>,
      StoreApiWithPersist<CounterState> & StoreApiWithDevtools<CounterState>
    >(
      devtools(
        persist(
          immer((set, get) => ({
            count: 0,
            inc: () =>
              set((state) => {
                state.count = get().count + 1
              }),
          })),
          { name: 'count' }
        ),
        { name: 'prefix' }
      )
    )
    const TestComponent = () => {
      useStore((s) => s.count) * 2
      useStore((s) => s.inc)()
      useStore().count * 2
      useStore().inc()
      useStore.getState().count * 2
      useStore.getState().inc()
      useStore.setState({ count: 0 }, false, 'reset')
      useStore.persist.hasHydrated()
      return <></>
    }
    TestComponent
  })

  it('devtools & subscribeWithSelector & combine', () => {
    const useStore = create(
      devtools(
        subscribeWithSelector(
          combine({ count: 1 }, (set, get) => ({
            inc: () => set({ count: get().count + 1 }, false, 'inc'),
          }))
        ),
        { name: 'prefix' }
      )
    )
    const TestComponent = () => {
      useStore((s) => s.count) * 2
      useStore((s) => s.inc)()
      useStore().count * 2
      useStore().inc()
      useStore.getState().count * 2
      useStore.getState().inc()
      useStore.subscribe(
        (state) => state.count,
        (count) => console.log(count * 2)
      )
      useStore.setState({ count: 0 }, false, 'reset')
      return <></>
    }
    TestComponent
  })

  it('devtools & subscribeWithSelector & persist', () => {
    const useStore = create<
      CounterState,
      SetState<CounterState>,
      GetState<CounterState>,
      StoreApiWithSubscribeWithSelector<CounterState> &
        StoreApiWithPersist<CounterState> &
        StoreApiWithDevtools<CounterState>
    >(
      devtools(
        subscribeWithSelector(
          persist(
            (set, get) => ({
              count: 0,
              inc: () => set({ count: get().count + 1 }, false),
            }),
            { name: 'count' }
          )
        ),
        { name: 'prefix' }
      )
    )
    const TestComponent = () => {
      useStore((s) => s.count) * 2
      useStore((s) => s.inc)()
      useStore().count * 2
      useStore().inc()
      useStore.getState().count * 2
      useStore.getState().inc()
      useStore.subscribe(
        (state) => state.count,
        (count) => console.log(count * 2)
      )
      useStore.setState({ count: 0 }, false, 'reset')
      useStore.persist.hasHydrated()
      return <></>
    }
    TestComponent
  })
})

describe('counter state spec (quadruple middleware)', () => {
  it('devtools & subscribeWithSelector & persist & immer (#616)', () => {
    const useStore = create<
      CounterState,
      SetState<CounterState>,
      GetState<CounterState>,
      StoreApiWithSubscribeWithSelector<CounterState> &
        StoreApiWithPersist<CounterState> &
        StoreApiWithDevtools<CounterState>
    >(
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
            { name: 'count' }
          )
        ),
        { name: 'prefix' }
      )
    )
    const TestComponent = () => {
      useStore((s) => s.count) * 2
      useStore((s) => s.inc)()
      useStore().count * 2
      useStore().inc()
      useStore.getState().count * 2
      useStore.getState().inc()
      useStore.subscribe(
        (state) => state.count,
        (count) => console.log(count * 2)
      )
      useStore.setState({ count: 0 }, false, 'reset')
      useStore.persist.hasHydrated()
      return <></>
    }
    TestComponent
  })
})

describe('more complex state spec with subscribeWithSelector', () => {
  it('#619, #632', () => {
    type MyState = {
      foo: boolean
    }
    const useStore = create(
      subscribeWithSelector(
        // NOTE: Adding type annotation to inner middleware works.
        persist<
          MyState,
          SetState<MyState>,
          GetState<MyState>,
          StoreApiWithSubscribeWithSelector<MyState> &
            StoreApiWithPersist<MyState>
        >(
          () => ({
            foo: true,
          }),
          { name: 'name' }
        )
      )
    )
    const TestComponent = () => {
      useStore((s) => s.foo)
      useStore().foo
      useStore.getState().foo
      useStore.subscribe(
        (state) => state.foo,
        (foo) => console.log(foo)
      )
      useStore.persist.hasHydrated()
      return <></>
    }
    TestComponent
  })

  it('#631', () => {
    type MyState = {
      foo: number | null
    }
    const useStore = create<
      MyState,
      SetState<MyState>,
      GetState<MyState>,
      StoreApiWithSubscribeWithSelector<MyState>
    >(
      subscribeWithSelector(
        () =>
          ({
            foo: 1,
          } as MyState) // NOTE: Asserting the entire state works too.
      )
    )
    const TestComponent = () => {
      useStore((s) => s.foo)
      useStore().foo
      useStore.getState().foo
      useStore.subscribe(
        (state) => state.foo,
        (foo) => console.log(foo)
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
    // NOTE: This is a simplified middleware type without persist api
    type MyPersist = (
      config: StateCreator<MyState>,
      options: PersistOptions<MyState>
    ) => StateCreator<MyState>
    const useStore = create<MyState>(
      (persist as MyPersist)(
        (set) => ({
          token: undefined,
          authenticated: false,
          authenticate: async (_username, _password) => {
            set({ authenticated: true })
          },
        }),
        { name: 'auth-store' }
      )
    )
    const TestComponent = () => {
      useStore((s) => s.authenticated)
      useStore((s) => s.authenticate)('u', 'p')
      useStore().authenticated
      useStore().authenticate('u', 'p')
      useStore.getState().authenticated
      useStore.getState().authenticate('u', 'p')
      return <></>
    }
    TestComponent
  })
})
