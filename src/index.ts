import { useEffect, useLayoutEffect, useReducer, useRef } from 'react'
import createImpl, {
  Destroy,
  EqualityChecker,
  GetState,
  SetState,
  State,
  StateCreator,
  StateSelector,
  Subscribe,
  StoreApi,
} from './vanilla'
export * from './vanilla'

// For server-side rendering: https://github.com/react-spring/zustand/pull/34
// Deno support: https://github.com/pmndrs/zustand/issues/347
const isSSR =
  typeof window === 'undefined' ||
  !window.navigator ||
  /ServerSideRendering|^Deno\//.test(window.navigator.userAgent)

const useIsomorphicLayoutEffect = isSSR ? useEffect : useLayoutEffect

export interface UseStore<T extends State> {
  (): T
  <U>(selector: StateSelector<T, U>, equalityFn?: EqualityChecker<U>): U
  setState: SetState<T>
  getState: GetState<T>
  subscribe: Subscribe<T>
  destroy: Destroy
}

export default function create<TState extends State>(
  createState: StateCreator<TState> | StoreApi<TState>
): UseStore<TState> {
  const api: StoreApi<TState> =
    typeof createState === 'function' ? createImpl(createState) : createState

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

    return hasNewStateSlice
      ? (newStateSlice as StateSlice)
      : currentSliceRef.current
  }

  Object.assign(useStore, api)

  // For backward compatibility (No TS types for this)
  useStore[Symbol.iterator] = function* () {
    console.warn(
      '[useStore, api] = create() is deprecated and will be removed in v4'
    )
    yield useStore
    yield api
  }

  return useStore
}
