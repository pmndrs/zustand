import {
  useMemo,
  // @ts-ignore
  unstable_createMutableSource as createMutableSource,
  // @ts-ignore
  unstable_useMutableSource as useMutableSource,
} from 'react'

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

  const source = createMutableSource(api, () => api.getState())

  const FUNCTION_SYMBOL = Symbol()
  const functionMap = new WeakMap<Function, { [FUNCTION_SYMBOL]: Function }>()

  const useStore: any = <StateSlice>(
    selector: StateSelector<TState, StateSlice> = api.getState as any,
    equalityFn: EqualityChecker<StateSlice> = Object.is
  ) => {
    const getSnapshot = useMemo(() => {
      let lastSlice: StateSlice | undefined
      return () => {
        let slice = lastSlice
        try {
          slice = selector(api.getState())
          if (lastSlice !== undefined && equalityFn(lastSlice, slice)) {
            slice = lastSlice
          } else {
            lastSlice = slice
          }
        } catch (error) {
          // ignore and let react reschedule update
        }
        // Unfortunately, returning a function is not supported
        // https://github.com/facebook/react/issues/18823
        if (typeof slice === 'function') {
          if (functionMap.has(slice)) {
            return functionMap.get(slice)
          }
          const wrappedFunction = { [FUNCTION_SYMBOL]: slice }
          functionMap.set(slice, wrappedFunction)
          return wrappedFunction
        }
        return slice
      }
    }, [selector, equalityFn])
    const snapshot = useMutableSource(source, getSnapshot, api.subscribe)
    if (
      snapshot &&
      (snapshot as { [FUNCTION_SYMBOL]: unknown })[FUNCTION_SYMBOL]
    ) {
      return snapshot[FUNCTION_SYMBOL]
    }
    return snapshot
  }

  Object.assign(useStore, api)

  return useStore
}
