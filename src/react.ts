import {
  useDebugValue,
  useEffect,
  useLayoutEffect,
  useReducer,
  useRef,
} from 'react'
import createStore, {
  EqualityChecker,
  GetState,
  SetState,
  State,
  StateCreator,
  StateSelector,
  StoreApi,
} from './vanilla'

// For server-side rendering: https://github.com/pmndrs/zustand/pull/34
// Deno support: https://github.com/pmndrs/zustand/issues/347
const isSSR =
  typeof window === 'undefined' ||
  !window.navigator ||
  /ServerSideRendering|^Deno\//.test(window.navigator.userAgent)

const useIsomorphicLayoutEffect = isSSR ? useEffect : useLayoutEffect

export type UseBoundStore<
  T extends State,
  CustomStoreApi extends StoreApi<T> = StoreApi<T>
> = {
  (): T
  <U>(selector: StateSelector<T, U>, equalityFn?: EqualityChecker<U>): U
} & CustomStoreApi

function create<
  TState extends State,
  CustomSetState,
  CustomGetState,
  CustomStoreApi extends StoreApi<TState>
>(
  createState:
    | StateCreator<TState, CustomSetState, CustomGetState, CustomStoreApi>
    | CustomStoreApi
): UseBoundStore<TState, CustomStoreApi>

function create<TState extends State>(
  createState:
    | StateCreator<TState, SetState<TState>, GetState<TState>, any>
    | StoreApi<TState>
): UseBoundStore<TState, StoreApi<TState>>

function create<
  TState extends State,
  CustomSetState,
  CustomGetState,
  CustomStoreApi extends StoreApi<TState>
>(
  createState:
    | StateCreator<TState, CustomSetState, CustomGetState, CustomStoreApi>
    | CustomStoreApi
): UseBoundStore<TState, CustomStoreApi> {
  const api: CustomStoreApi =
    typeof createState === 'function' ? createStore(createState) : createState

  const useStore: any = <StateSlice>(
    selector: StateSelector<TState, StateSlice> = api.getState as any,
    equalityFn: EqualityChecker<StateSlice> = Object.is
  ) => {
    const [, forceUpdate] = useReducer((c) => c + 1, 0) as [never, () => void]

    const state = api.getState()
    const stateRef = useRef(state)
    const selectorRef = useRef(selector)
    const equalityFnRef = useRef(equalityFn)
    const erroredRef = useRef(false)

    const currentSliceRef = useRef<StateSlice>()
    if (currentSliceRef.current === undefined) {
      currentSliceRef.current = selector(state)
    }

    let newStateSlice: StateSlice | undefined
    let hasNewStateSlice = false

    // The selector or equalityFn need to be called during the render phase if
    // they change. We also want legitimate errors to be visible so we re-run
    // them if they errored in the subscriber.
    if (
      stateRef.current !== state ||
      selectorRef.current !== selector ||
      equalityFnRef.current !== equalityFn ||
      erroredRef.current
    ) {
      // Using local variables to avoid mutations in the render phase.
      newStateSlice = selector(state)
      hasNewStateSlice = !equalityFn(
        currentSliceRef.current as StateSlice,
        newStateSlice
      )
    }

    // Syncing changes in useEffect.
    useIsomorphicLayoutEffect(() => {
      if (hasNewStateSlice) {
        currentSliceRef.current = newStateSlice as StateSlice
      }
      stateRef.current = state
      selectorRef.current = selector
      equalityFnRef.current = equalityFn
      erroredRef.current = false
    })

    const stateBeforeSubscriptionRef = useRef(state)
    useIsomorphicLayoutEffect(() => {
      const listener = () => {
        try {
          const nextState = api.getState()
          const nextStateSlice = selectorRef.current(nextState)
          if (
            !equalityFnRef.current(
              currentSliceRef.current as StateSlice,
              nextStateSlice
            )
          ) {
            stateRef.current = nextState
            currentSliceRef.current = nextStateSlice
            forceUpdate()
          }
        } catch (error) {
          erroredRef.current = true
          forceUpdate()
        }
      }
      const unsubscribe = api.subscribe(listener)
      if (api.getState() !== stateBeforeSubscriptionRef.current) {
        listener() // state has changed before subscription
      }
      return unsubscribe
    }, [])

    const sliceToReturn = hasNewStateSlice
      ? (newStateSlice as StateSlice)
      : currentSliceRef.current
    useDebugValue(sliceToReturn)
    return sliceToReturn
  }

  Object.assign(useStore, api)

  return useStore
}

export default create
