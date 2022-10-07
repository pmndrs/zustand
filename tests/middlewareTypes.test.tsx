import create, { StoreApi } from 'zustand'
import {
  combine,
  devtools,
  persist,
  redux,
  subscribeWithSelector,
} from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import createVanilla from 'zustand/vanilla'

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
  let savedDEV: boolean
  beforeEach(() => {
    savedDEV = __DEV__
  })
  afterEach(() => {
    __DEV__ = savedDEV
  })

  it('immer', () => {
    const useBoundStore = create<CounterState>()(
      immer((set, get) => ({
        count: 0,
        inc: () =>
          set((state) => {
            state.count = get().count + 1
          }),
      }))
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

    const _testSubtyping: StoreApi<object> = createVanilla(
      immer(() => ({ count: 0 }))
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
        { count: 0 }
      )
    )
    const TestComponent = () => {
      useBoundStore((s) => s.count) * 2
      useBoundStore((s) => s.dispatch)({ type: 'INC' })
      useBoundStore().dispatch({ type: 'INC' })
      useBoundStore.dispatch({ type: 'INC' })
      return <></>
    }
    TestComponent

    const _testSubtyping: StoreApi<object> = createVanilla(
      redux((x) => x, { count: 0 })
    )
  })

  it('should enforce type constraint when ReduxAction is used', () => {
    type State = { count: number }
    type FeatureEventActions = {
      grumpiness: {
        increase: number
        decrease: number
        reset: undefined
      }
    }

    type EventName = Record<string, unknown>
    type FeatureEventMap = Record<string, EventName>
    type Separator = '/'

    // Credit given [here](https://stackoverflow.com/a/50375286/648789).
    type UnionToIntersection<U> = (
      U extends any ? (k: U) => void : never
    ) extends (k: infer I) => void
      ? I
      : never

    type PayloadOptionalIfUndefined<A> = A extends {
      type: infer T
      payload: undefined
    }
      ? { type: T; payload?: undefined }
      : A

    type ActionsIndex<
      Type extends FeatureEventMap,
      FeatureKey extends keyof Type = ''
    > = FeatureKey extends keyof Type
      ? {
          [EventKey in keyof Type[FeatureKey] as `${string &
            FeatureKey}${Separator}${string &
            EventKey}`]: Type[FeatureKey][EventKey]
        }
      : ActionsIndex<Type, keyof Type>

    type ActionsIntersect<Type extends FeatureEventMap> = UnionToIntersection<
      ActionsIndex<Type>
    >

    // To enforce typings for an `action` parameter of a `reducer` or `dispatch`.
    // By doing so, conditional expressions evalutating the `type` property of `action` type, will have the `payload` type
    // infered in the block scope of condition.
    // For more information, see '[Flux like patterns / "dispatching" actions](https://github.com/pmndrs/zustand/blob/main/docs/guides/flux-inspired-practice.md)' section of docs.
    // Credit given [here](https://stackoverflow.com/questions/73792053/typescript-argument-type-from-a-previous-argument-value).
    type ReduxAction<Type extends FeatureEventMap> = {
      [FeatureEvent in keyof ActionsIntersect<Type>]: {
        type: FeatureEvent
        payload: ActionsIntersect<Type>[FeatureEvent]
      }
    }[keyof ActionsIntersect<Type>]

    const useBoundStore = create(
      redux<
        State,
        PayloadOptionalIfUndefined<ReduxAction<FeatureEventActions>>
      >(
        // @ts-expect-error incorrect payload type for the 'grumpiness/reset' case.
        (state: State, { type, payload }: ReduxAction<FeatureEventActions>) => {
          switch (type) {
            case 'grumpiness/increase':
              return { count: state.count + payload }
            case 'grumpiness/decrease':
              return { count: state.count - payload }
            case 'grumpiness/reset':
              return { count: payload }
          }
        },
        { count: 0 }
      )
    )

    const TestComponent = () => {
      useBoundStore.dispatch({ type: 'grumpiness/increase', payload: 10 })
      // @ts-expect-error mispelled feature segment of type value
      useBoundStore.dispatch({ type: 'grumpy/increase', payload: 10 })
      // @ts-expect-error payload is required for given type value
      useBoundStore.dispatch({ type: 'grumpiness/increase' })

      useBoundStore.dispatch({
        type: 'grumpiness/increase',
        // @ts-expect-error incorrect type for payload
        payload: { count: 10 },
      })

      useBoundStore.dispatch({ type: 'grumpiness/reset' })

      // if desired, it still works the same as the line above
      useBoundStore.dispatch({ type: 'grumpiness/reset', payload: undefined })
    }
    TestComponent
  })

  it('devtools', () => {
    __DEV__ = false
    const useBoundStore = create<CounterState>()(
      devtools(
        (set, get) => ({
          count: 0,
          inc: () => set({ count: get().count + 1 }, false, 'inc'),
        }),
        { name: 'prefix' }
      )
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

    const _testSubtyping: StoreApi<object> = createVanilla(
      devtools(() => ({ count: 0 }))
    )
  })

  it('subscribeWithSelector', () => {
    const useBoundStore = create<CounterState>()(
      subscribeWithSelector((set, get) => ({
        count: 1,
        inc: () => set({ count: get().count + 1 }, false),
      }))
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
        (count) => console.log(count * 2)
      )
      return <></>
    }
    TestComponent

    const _testSubtyping: StoreApi<object> = createVanilla(
      subscribeWithSelector(() => ({ count: 0 }))
    )
  })

  it('combine', () => {
    const useBoundStore = create(
      combine({ count: 1 }, (set, get) => ({
        inc: () => set({ count: get().count + 1 }, false),
      }))
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

    const _testSubtyping: StoreApi<object> = createVanilla(
      combine({ count: 0 }, () => ({}))
    )
  })

  it('persist', () => {
    const useBoundStore = create<CounterState>()(
      persist(
        (set, get) => ({
          count: 1,
          inc: () => set({ count: get().count + 1 }, false),
        }),
        { name: 'prefix' }
      )
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

    const _testSubtyping: StoreApi<object> = createVanilla(
      persist(() => ({ count: 0 }))
    )
  })

  it('persist with partialize', () => {
    const useBoundStore = create<CounterState>()(
      persist(
        (set, get) => ({
          count: 1,
          inc: () => set({ count: get().count + 1 }, false),
        }),
        { name: 'prefix', partialize: (s) => s.count }
      )
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
        { name: 'prefix' }
      )
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
  let savedDEV: boolean
  beforeEach(() => {
    savedDEV = __DEV__
  })
  afterEach(() => {
    __DEV__ = savedDEV
  })

  it('immer & devtools', () => {
    __DEV__ = false
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
                { type: 'inc', by: 1 }
              ),
          }),
          { name: 'prefix' }
        )
      )
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
    __DEV__ = false
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
          { count: 0 }
        ),
        { name: 'prefix' }
      )
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
    __DEV__ = false
    const useBoundStore = create(
      devtools(
        combine({ count: 1 }, (set, get) => ({
          inc: () => set({ count: get().count + 1 }, false, 'inc'),
        })),
        { name: 'prefix' }
      )
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
        }))
      )
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
        (count) => console.log(count * 2)
      )
      return <></>
    }
    TestComponent
  })

  it('devtools & subscribeWithSelector', () => {
    __DEV__ = false
    const useBoundStore = create<CounterState>()(
      devtools(
        subscribeWithSelector((set, get) => ({
          count: 1,
          inc: () => set({ count: get().count + 1 }, false, 'inc'),
        })),
        { name: 'prefix' }
      )
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
        (count) => console.log(count * 2)
      )
      useBoundStore.setState({ count: 0 }, false, 'reset')
      return <></>
    }
    TestComponent
  })

  it('devtools & persist', () => {
    __DEV__ = false
    const useBoundStore = create<CounterState>()(
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
  let savedDEV: boolean
  beforeEach(() => {
    savedDEV = __DEV__
  })
  afterEach(() => {
    __DEV__ = savedDEV
  })

  it('devtools & persist & immer', () => {
    __DEV__ = false
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
          { name: 'count' }
        ),
        { name: 'prefix' }
      )
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
    __DEV__ = false
    const useBoundStore = create(
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
      useBoundStore((s) => s.count) * 2
      useBoundStore((s) => s.inc)()
      useBoundStore().count * 2
      useBoundStore().inc()
      useBoundStore.getState().count * 2
      useBoundStore.getState().inc()
      useBoundStore.subscribe(
        (state) => state.count,
        (count) => console.log(count * 2)
      )
      useBoundStore.setState({ count: 0 }, false, 'reset')
      return <></>
    }
    TestComponent
  })

  it('devtools & subscribeWithSelector & persist', () => {
    __DEV__ = false
    const useBoundStore = create<CounterState>()(
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
      useBoundStore((s) => s.count) * 2
      useBoundStore((s) => s.inc)()
      useBoundStore().count * 2
      useBoundStore().inc()
      useBoundStore.getState().count * 2
      useBoundStore.getState().inc()
      useBoundStore.subscribe(
        (state) => state.count,
        (count) => console.log(count * 2)
      )
      useBoundStore.setState({ count: 0 }, false, 'reset')
      useBoundStore.persist.hasHydrated()
      return <></>
    }
    TestComponent
  })
})

describe('counter state spec (quadruple middleware)', () => {
  let savedDEV: boolean
  beforeEach(() => {
    savedDEV = __DEV__
  })
  afterEach(() => {
    __DEV__ = savedDEV
  })

  it('devtools & subscribeWithSelector & persist & immer (#616)', () => {
    __DEV__ = false
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
            { name: 'count' }
          )
        ),
        { name: 'prefix' }
      )
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
        (count) => console.log(count * 2)
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
          { name: 'name' }
        )
      )
    )
    const TestComponent = () => {
      useBoundStore((s) => s.foo)
      useBoundStore().foo
      useBoundStore.getState().foo
      useBoundStore.subscribe(
        (state) => state.foo,
        (foo) => console.log(foo)
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
          } as MyState) // NOTE: Asserting the entire state works too.
      )
    )
    const TestComponent = () => {
      useBoundStore((s) => s.foo)
      useBoundStore().foo
      useBoundStore.getState().foo
      useBoundStore.subscribe(
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
    const useBoundStore = create<MyState>()(
      persist(
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
        ['zustand/persist', CounterState]
      ]
    >(
      subscribeWithSelector(
        persist(
          (set, get) => ({
            count: 0,
            inc: () => set({ count: get().count + 1 }, false),
          }),
          { name: 'count' }
        )
      )
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
        (count) => console.log(count * 2)
      )
      useBoundStore.setState({ count: 0 }, false)
      useBoundStore.persist.hasHydrated()
      return <></>
    }
    TestComponent
  })
})
