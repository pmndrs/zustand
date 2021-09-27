import { useMemo } from 'react'
import { useSyncExternalStore } from 'use-sync-external-store'
import createStore, {
  Destroy,
  EqualityChecker,
  GetState,
  SetState,
  State,
  StateCreator,
  StateSelector,
  StoreApi,
  Subscribe,
} from './vanilla'

export function useStore<T extends State>(api: StoreApi<T>): T
export function useStore<T extends State, U>(
  api: StoreApi<T>,
  selector: StateSelector<T, U>,
  equalityFn?: EqualityChecker<U>
): U
export function useStore<TState extends State, StateSlice>(
  api: StoreApi<TState>,
  selector: StateSelector<TState, StateSlice> = api.getState as any,
  equalityFn: EqualityChecker<StateSlice> = Object.is
) {
  const getSnapshot = useMemo(() => {
    let lastSnapshot: TState | undefined
    let lastSlice: StateSlice | undefined
    return () => {
      let slice = lastSlice
      const snapshot = api.getState()
      if (lastSnapshot === undefined || !Object.is(lastSnapshot, snapshot)) {
        slice = selector(snapshot)
        if (lastSlice === undefined || !equalityFn(lastSlice, slice)) {
          lastSlice = slice
        } else {
          slice = lastSlice
        }
        lastSnapshot = snapshot
      }
      return slice
    }
  }, [api, selector, equalityFn])
  return useSyncExternalStore(api.subscribe, getSnapshot)
}

export interface UseBoundStore<T extends State> {
  (): T
  <U>(selector: StateSelector<T, U>, equalityFn?: EqualityChecker<U>): U
  setState: SetState<T>
  getState: GetState<T>
  subscribe: Subscribe<T>
  destroy: Destroy
}

export default function create<TState extends State>(
  createState: StateCreator<TState> | StoreApi<TState>
): UseBoundStore<TState> {
  const api: StoreApi<TState> =
    typeof createState === 'function' ? createStore(createState) : createState

  const useBoundStore: any = (selector?: any, equalityFn?: any) =>
    useStore(api, selector, equalityFn)

  Object.assign(useBoundStore, api)

  return useBoundStore
}
