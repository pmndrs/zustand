import { produce } from 'immer'
import type { Draft } from 'immer'
import create, { State, StateCreator, UseBoundStore } from 'zustand'
import {
  NamedSet,
  combine,
  devtools,
  persist,
  redux,
  subscribeWithSelector,
} from 'zustand/middleware'

type TImmerConfigFn<T extends State> = (
  fn: ((draft: Draft<T>) => void) | T,
  replace?: boolean
) => void
type TImmerConfig<T extends State> = StateCreator<T, TImmerConfigFn<T>>

interface ISelectors<T> {
  use: {
    [key in keyof T]: () => T[key]
  }
}

const immer =
  <T extends State>(config: TImmerConfig<T>): StateCreator<T> =>
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

const createSelectorHooks = <
  T extends State,
  TUseBoundStore extends UseBoundStore<T> = UseBoundStore<T>
>(
  store: TUseBoundStore
) => {
  const storeAsSelectors = store as unknown as ISelectors<T>
  storeAsSelectors.use = {} as ISelectors<T>['use']

  Object.keys(store.getState()).forEach((key) => {
    const storeKey = key as keyof T
    const selector = (state: T) => state[storeKey]

    storeAsSelectors.use[storeKey] = () => store(selector)
  })

  return store as TUseBoundStore & ISelectors<T>
}

interface ITestStateProps {
  testKey: string
  setTestKey: (testKey: string) => void
}

it('should have correct type when creating store with devtool', () => {
  const createStoreWithDevtool = <T extends State>(
    createState: StateCreator<T>,
    options = { name: 'prefix' }
  ): UseBoundStore<T> & ISelectors<T> => {
    return createSelectorHooks(create(devtools(createState, options)))
  }

  const testDevtoolStore = createStoreWithDevtool<ITestStateProps>(
    (set) => ({
      testKey: 'test',
      setTestKey: (testKey: string) => {
        set((state) => {
          state.testKey = testKey
        })
      },
    }),
    { name: 'test' }
  )

  const TestComponent = (): JSX.Element => {
    testDevtoolStore.use.testKey()
    testDevtoolStore.use.setTestKey()

    return <></>
  }
  TestComponent
})

it('should have correct type when creating store with devtool and immer', () => {
  const createStoreWithImmer = <T extends State>(
    createState: TImmerConfig<T>,
    options = { name: 'prefix' }
  ): UseBoundStore<T> & ISelectors<T> => {
    return createSelectorHooks(create(devtools(immer(createState), options)))
  }

  const testImmerStore = createStoreWithImmer<ITestStateProps>(
    (set) => ({
      testKey: 'test',
      setTestKey: (testKey: string) => {
        set((state) => {
          state.testKey = testKey
        })
      },
    }),
    { name: 'test' }
  )

  const TestComponent = (): JSX.Element => {
    testImmerStore.use.testKey()
    testImmerStore.use.setTestKey()

    return <></>
  }
  TestComponent
})

it('should have correct type when creating store with devtool and persist', () => {
  const createStoreWithPersist = <T extends State>(
    createState: StateCreator<T>,
    options = { name: 'prefix' },
    persistName = 'persist'
  ): UseBoundStore<T> & ISelectors<T> => {
    return createSelectorHooks(
      create(devtools(persist(createState, { name: persistName }), options))
    )
  }

  const testPersistStore = createStoreWithPersist<ITestStateProps>(
    (set) => ({
      testKey: 'test',
      setTestKey: (testKey: string) => {
        set((state) => {
          state.testKey = testKey
        })
      },
    }),
    { name: 'test' },
    'persist'
  )

  const TestComponent = (): JSX.Element => {
    testPersistStore.use.testKey()
    testPersistStore.use.setTestKey()

    return <></>
  }
  TestComponent
})

it('should have correct type when creating store without middleware', () => {
  const testStore = create<ITestStateProps>((set) => ({
    testKey: 'test',
    setTestKey: (testKey: string) => {
      set((state) => {
        state.testKey = testKey
      })
    },
  }))

  const TestComponent = (): JSX.Element => {
    testStore((state) => state.testKey)
    testStore((state) => state.setTestKey)

    return <></>
  }
  TestComponent
})

it('should have correct type when creating store with persist', () => {
  const createStoreWithPersist = <T extends State>(
    createState: StateCreator<T>,
    persistName = 'persist'
  ): UseBoundStore<T> & ISelectors<T> => {
    return createSelectorHooks(
      create(persist(createState, { name: persistName }))
    )
  }

  const testPersistStore = createStoreWithPersist<ITestStateProps>(
    (set) => ({
      testKey: 'test',
      setTestKey: (testKey: string) => {
        set((state) => {
          state.testKey = testKey
        })
      },
    }),
    'persist'
  )

  const TestComponent = (): JSX.Element => {
    testPersistStore.use.testKey()
    testPersistStore.use.setTestKey()

    return <></>
  }
  TestComponent
})

it('should have correct type when creating store with immer', () => {
  const createStoreWithImmer = <T extends State>(
    createState: TImmerConfig<T>
  ): UseBoundStore<T> & ISelectors<T> => {
    return createSelectorHooks(create(immer(createState)))
  }

  const testImmerStore = createStoreWithImmer<ITestStateProps>((set) => ({
    testKey: 'test',
    setTestKey: (testKey: string) => {
      set((state) => {
        state.testKey = testKey
      })
    },
  }))

  const TestComponent = (): JSX.Element => {
    testImmerStore.use.testKey()
    testImmerStore.use.setTestKey()

    return <></>
  }
  TestComponent
})

it('should have correct type when creating store with devtool, persist and immer', () => {
  const createStoreWithPersistAndImmer = <T extends State>(
    createState: TImmerConfig<T>,
    options = { name: 'prefix' },
    persistName = 'persist'
  ): UseBoundStore<T> & ISelectors<T> => {
    return createSelectorHooks(
      create(
        devtools(persist(immer(createState), { name: persistName }), options)
      )
    )
  }

  const testPersistImmerStore = createStoreWithPersistAndImmer<ITestStateProps>(
    (set) => ({
      testKey: 'test',
      setTestKey: (testKey: string) => {
        set((state) => {
          state.testKey = testKey
        })
      },
    }),
    { name: 'test' }
  )

  const TestComponent = (): JSX.Element => {
    testPersistImmerStore.use.testKey()
    testPersistImmerStore.use.setTestKey()

    return <></>
  }
  TestComponent
})

it('should have correct type when creating store with devtools', () => {
  const useStore = create<ITestStateProps>(
    devtools((set) => ({
      testKey: 'test',
      setTestKey: (testKey: string) => {
        set((state) => ({
          testKey: state.testKey + testKey,
        }))
      },
    }))
  )

  const TestComponent = (): JSX.Element => {
    useStore().testKey
    useStore().setTestKey('')
    useStore.getState().testKey
    useStore.getState().setTestKey('')

    return <></>
  }
  TestComponent
})

it('should have correct type when creating store with redux', () => {
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

  const TestComponent = (): JSX.Element => {
    useStore().dispatch({ type: 'INC' })
    useStore.dispatch({ type: 'INC' })

    return <></>
  }
  TestComponent
})

it('should combine devtools and immer', () => {
  const useStore = create<ITestStateProps>(
    devtools(
      immer((set) => ({
        testKey: 'test',
        setTestKey: (testKey: string) => {
          set((state) => {
            state.testKey = testKey
          })
        },
      }))
    )
  )

  const TestComponent = (): JSX.Element => {
    useStore().testKey
    useStore().setTestKey('')
    useStore.getState().testKey
    useStore.getState().setTestKey('')

    return <></>
  }
  TestComponent
})

it('should combine devtools and redux', () => {
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
      )
    )
  )

  const TestComponent = (): JSX.Element => {
    useStore().dispatch({ type: 'INC' })
    useStore.dispatch({ type: 'INC' })

    return <></>
  }
  TestComponent
})

it('should combine devtools and combine', () => {
  const useStore = create(
    devtools(
      combine({ count: 1 }, (set, get) => ({
        inc: () => set({ count: get().count + 1 }, false, 'inc'),
      }))
    )
  )

  const TestComponent = (): JSX.Element => {
    useStore().count
    useStore().inc()
    useStore.getState().count
    useStore.getState().inc()

    return <></>
  }
  TestComponent
})

it('should combine subscribeWithSelector and combine', () => {
  const useStore = create(
    subscribeWithSelector(
      combine({ count: 1 }, (set, get) => ({
        inc: () => set({ count: get().count + 1 }, false),
        // FIXME hope this to fail // @ts-expect-error
        incInvalid: () => set({ count: get().count + 1 }, false, 'inc'),
      }))
    )
  )

  const TestComponent = (): JSX.Element => {
    useStore().count
    useStore().inc()
    useStore.getState().count
    useStore.getState().inc()
    useStore.subscribe(
      (state) => state.count,
      (count) => console.log(count * 2)
    )

    return <></>
  }
  TestComponent
})

it('should combine devtools and subscribeWithSelector', () => {
  const useStore = create(
    devtools(
      subscribeWithSelector<
        {
          count: number
          inc: () => void
        },
        NamedSet<{
          count: number
          inc: () => void
        }>
      >((set, get) => ({
        count: 1,
        inc: () => set({ count: get().count + 1 }, false, 'inc'),
      }))
    )
  )

  const TestComponent = (): JSX.Element => {
    useStore().count
    useStore().inc()
    useStore.getState().count
    useStore.getState().inc()
    useStore.subscribe(
      (state) => state.count,
      (count) => console.log(count * 2)
    )

    return <></>
  }
  TestComponent
})

it('should combine devtools, subscribeWithSelector and combine', () => {
  const useStore = create(
    devtools(
      subscribeWithSelector(
        combine({ count: 1 }, (set, get) => ({
          inc: () => set({ count: get().count + 1 }, false, 'inc'),
        }))
      )
    )
  )

  const TestComponent = (): JSX.Element => {
    useStore().count
    useStore().inc()
    useStore.getState().count
    useStore.getState().inc()
    useStore.subscribe(
      (state) => state.count,
      (count) => console.log(count * 2)
    )

    return <></>
  }
  TestComponent
})
