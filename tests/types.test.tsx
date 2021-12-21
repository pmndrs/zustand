import create, { createWithState, Store, StoreInitializer, UseBoundStore } from 'zustand'

it('can use exposed types', () => {
  interface ExampleState {
    num: number
    numGet: () => number
    numGetState: () => number
    numSet: (v: number) => void
    numSetState: (v: number) => void
  }

  const store = createWithState<ExampleState>()((set, get) => ({
    num: 1,
    numGet: () => get().num,
    numGetState: () => {
      // TypeScript can't get the type of storeApi when it trys to enforce the signature of numGetState.
      // Need to explicitly state the type of storeApi.getState().num or storeApi type will be type 'any'.
      const result: number = store.getState().num
      return result
    },
    numSet: (v) => {
      set({ num: v })
    },
    numSetState: (v) => {
      store.setState({ num: v })
    },
  }))
  const useStore = store

  const stateCreator: StoreInitializer<ExampleState, [], []> = (set, get) => ({
    num: 1,
    numGet: () => get().num,
    numGetState: () => get().num,
    numSet: (v) => {
      set({ num: v })
    },
    numSetState: (v) => {
      set({ num: v })
    },
  })

  function checkAllTypes(
    _getState: Store<ExampleState>['getState'],
    _setState: Store<ExampleState>['setState'],
    _state: ExampleState,
    _store: Store<ExampleState>,
    _subscribe: Store<ExampleState>['subscribe'],
    _destroy: Store<ExampleState>['destroy'],
    _stateCreator: StoreInitializer<ExampleState, [], []>,
    _useStore: UseBoundStore<Store<ExampleState>>
  ) {
    expect(true).toBeTruthy()
  }

  checkAllTypes(
    store.getState,
    store.setState,
    store.getState(),
    store,
    store.subscribe,
    store.destroy,
    stateCreator,
    useStore
  )
})

type AssertEqual<Type, Expected> = Type extends Expected
  ? Expected extends Type
    ? true
    : never
  : never

it('should have correct (partial) types for setState', () => {
  type Count = { count: number }

  const store = createWithState<Count>()((set) => ({
    count: 0,
    // @ts-expect-error we shouldn't be able to set count to undefined
    a: () => set(() => ({ count: undefined })),
    // @ts-expect-error we shouldn't be able to set count to undefined
    b: () => set({ count: undefined }),
    c: () => set({ count: 1 }),
  }))

  const setState: AssertEqual<typeof store.setState, Store<Count>['setState']> = true
  expect(setState).toEqual(true)

  // ok, should not error
  store.setState({ count: 1 })
  store.setState({})
  store.setState((previous) => previous)

  // @ts-expect-error type undefined is not assignable to type number
  store.setState({ count: undefined })
  // @ts-expect-error type undefined is not assignable to type number
  store.setState((state) => ({ ...state, count: undefined }))
})

it('should allow for different partial keys to be returnable from setState', () => {
  type State = { count: number; something: string }

  const store = create<State>(() => ({
    count: 0,
    something: 'foo',
  }))

  const setState: AssertEqual<typeof store.setState, Store<State>['setState']> = true
  expect(setState).toEqual(true)

  // ok, should not error
  store.setState((previous) => {
    if (previous.count === 0) {
      return { count: 1 }
    }
    return { count: 0 }
  })
  store.setState((previous) => {
    if (previous.count === 0) {
      return { count: 1 }
    }
    if (previous.count === 1) {
      return previous
    }
    return { something: 'foo' }
  })

  // @ts-expect-error Type '{ something: boolean; count?: undefined; }' is not assignable to type 'State'.
  store.setState((previous) => {
    if (previous.count === 0) {
      return { count: 1 }
    }
    return { something: true }
  })
})
