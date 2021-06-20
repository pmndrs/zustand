import { produce } from 'immer'
import type { Draft } from 'immer'
import create, { UseStore } from '../src'
import { State, StateCreator } from '../src/vanilla'
import { devtools, NamedSet, persist } from '../src/middleware'

type TImmerConfigFn<T extends State> = (fn: (draft: Draft<T>) => void) => void
type TImmerConfig<T extends State> = StateCreator<T, TImmerConfigFn<T>>

interface ISelectors<T> {
  use: {
    [key in keyof T]: () => T[key]
  }
}

const immer = <T extends State>(
  config: TImmerConfig<T>
): StateCreator<T, NamedSet<T>> => {
  return (set, get, api) => {
    return config((fn) => set(produce<T>(fn)), get, api)
  }
}

const createSelectorHooks = <T extends State>(store: UseStore<T>) => {
  const storeAsSelectors = store as unknown as ISelectors<T>
  storeAsSelectors.use = {} as ISelectors<T>['use']

  Object.keys(store.getState()).forEach((key) => {
    const storeKey = key as keyof T
    const selector = (state: T) => state[storeKey]

    storeAsSelectors.use[storeKey] = () => store(selector)
  })

  return store as UseStore<T> & ISelectors<T>
}

interface ITestStateProps {
  testKey: string
  setTestKey: (testKey: string) => void
}

it('should have correct type when creating store with devtool', () => {
  const createStoreWithDevtool = <T extends State>(
    createState: StateCreator<T>,
    prefix = 'prefix'
  ): UseStore<T> & ISelectors<T> => {
    return createSelectorHooks(create(devtools(createState, prefix)))
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
    'test'
  )

  const TestComponent = (): JSX.Element => {
    testDevtoolStore.use.testKey()
    testDevtoolStore.use.setTestKey()

    return <></>
  }
})

it('should have correct type when creating store with devtool and immer', () => {
  const createStoreWithImmer = <T extends State>(
    createState: TImmerConfig<T>,
    prefix = 'prefix'
  ): UseStore<T> & ISelectors<T> => {
    return createSelectorHooks(create(devtools(immer(createState), prefix)))
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
    'test'
  )

  const TestComponent = (): JSX.Element => {
    testImmerStore.use.testKey()
    testImmerStore.use.setTestKey()

    return <></>
  }
})

it('should have correct type when creating store with devtool and persist', () => {
  const createStoreWithPersist = <T extends State>(
    createState: StateCreator<T>,
    prefix = 'prefix',
    persistName = 'persist'
  ): UseStore<T> & ISelectors<T> => {
    return createSelectorHooks(
      create(devtools(persist(createState, { name: persistName }), prefix))
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
    'test',
    'persist'
  )

  const TestComponent = (): JSX.Element => {
    testPersistStore.use.testKey()
    testPersistStore.use.setTestKey()

    return <></>
  }
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
})

it('should have correct type when creating store with persist', () => {
  const createStoreWithPersist = <T extends State>(
    createState: StateCreator<T>,
    persistName = 'persist'
  ): UseStore<T> & ISelectors<T> => {
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
})

it('should have correct type when creating store with immer', () => {
  const createStoreWithImmer = <T extends State>(
    createState: TImmerConfig<T>
  ): UseStore<T> & ISelectors<T> => {
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
})

it('should have correct type when creating store with devtool, persist and immer', () => {
  const createStoreWithPersistAndImmer = <T extends State>(
    createState: TImmerConfig<T>,
    prefix = 'prefix',
    persistName = 'persist'
  ): UseStore<T> & ISelectors<T> => {
    return createSelectorHooks(
      create(
        devtools(persist(immer(createState), { name: persistName }), prefix)
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
    'test'
  )

  const TestComponent = (): JSX.Element => {
    testPersistImmerStore.use.testKey()
    testPersistImmerStore.use.setTestKey()

    return <></>
  }
})
