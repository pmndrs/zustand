import create, {
  Destroy,
  EqualityChecker,
  GetState,
  PartialState,
  SetState,
  State,
  StateCreator,
  StateListener,
  StateSelector,
  StoreApi,
  Subscribe,
  UseBoundStore,
} from 'zustand'

it('can use exposed types', () => {
  interface ExampleState {
    num: number
    numGet: () => number
    numGetState: () => number
    numSet: (v: number) => void
    numSetState: (v: number) => void
  }

  const listener: StateListener<ExampleState> = (state) => {
    if (state) {
      const value = state.num * state.numGet() * state.numGetState()
      state.numSet(value)
      state.numSetState(value)
    }
  }
  const selector: StateSelector<ExampleState, number> = (state) => state.num
  const partial: PartialState<ExampleState, 'num' | 'numGet'> = {
    num: 2,
    numGet: () => 2,
  }
  const partialFn: PartialState<ExampleState, 'num' | 'numGet'> = (state) => ({
    ...state,
    num: 2,
  })
  const equalityFn: EqualityChecker<ExampleState> = (state, newState) =>
    state !== newState

  const storeApi = create<ExampleState>((set, get) => ({
    num: 1,
    numGet: () => get().num,
    numGetState: () => {
      // TypeScript can't get the type of storeApi when it trys to enforce the signature of numGetState.
      // Need to explicitly state the type of storeApi.getState().num or storeApi type will be type 'any'.
      const result: number = storeApi.getState().num
      return result
    },
    numSet: (v) => {
      set({ num: v })
    },
    numSetState: (v) => {
      storeApi.setState({ num: v })
    },
  }))
  const useStore = storeApi

  const stateCreator: StateCreator<ExampleState> = (set, get) => ({
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
    _getState: GetState<ExampleState>,
    _partialState: PartialState<ExampleState, 'num' | 'numGet'>,
    _setState: SetState<ExampleState>,
    _state: State,
    _stateListener: StateListener<ExampleState>,
    _stateSelector: StateSelector<ExampleState, number>,
    _storeApi: StoreApi<ExampleState>,
    _subscribe: Subscribe<ExampleState>,
    _destroy: Destroy,
    _equalityFn: EqualityChecker<ExampleState>,
    _stateCreator: StateCreator<ExampleState>,
    _useStore: UseBoundStore<ExampleState>
  ) {
    expect(true).toBeTruthy()
  }

  checkAllTypes(
    storeApi.getState,
    Math.random() > 0.5 ? partial : partialFn,
    storeApi.setState,
    storeApi.getState(),
    listener,
    selector,
    storeApi,
    storeApi.subscribe,
    storeApi.destroy,
    equalityFn,
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

  const store = create<Count>((set) => ({
    count: 0,
    // @ts-expect-error we shouldn't be able to set count to undefined
    a: () => set(() => ({ count: undefined })),
    // @ts-expect-error we shouldn't be able to set count to undefined
    b: () => set({ count: undefined }),
    c: () => set({ count: 1 }),
  }))

  const setState: AssertEqual<typeof store.setState, SetState<Count>> = true
  expect(setState).toEqual(true)

  // ok, should not error
  store.setState({ count: 1 })
  store.setState({})
  store.setState(() => undefined)
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

  const setState: AssertEqual<typeof store.setState, SetState<State>> = true
  expect(setState).toEqual(true)

  // ok, should not error
  store.setState((previous) => {
    if (previous.count === 0) {
      return { count: 1 }
    }
    return { count: 0 }
  })
  store.setState<'count', 'something'>((previous) => {
    if (previous.count === 0) {
      return { count: 1 }
    }
    if (previous.count === 1) {
      return previous
    }
    return { something: 'foo' }
  })

  // @ts-expect-error Type '{ something: boolean; count?: undefined; }' is not assignable to type 'State'.
  store.setState<'count', 'something'>((previous) => {
    if (previous.count === 0) {
      return { count: 1 }
    }
    return { something: true }
  })
})
