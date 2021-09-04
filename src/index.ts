import { useMemo, useState } from 'react'
// @ts-ignore
import { useSyncExternalStore } from 'use-sync-external-store'
import createImpl, {
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

  const useStore: any = <StateSlice>(
    selector: StateSelector<TState, StateSlice> = api.getState as any,
    equalityFn: EqualityChecker<StateSlice> = Object.is
  ) => {
    const [err, setErr] = useState<unknown>(null)
    if (err) {
      setErr(null)
      throw err
    }
    const getSnapshot = useMemo(() => {
      let lastSnapshot: TState | undefined
      let lastSlice: StateSlice | undefined
      return () => {
        let slice = lastSlice
        const snapshot = api.getState()
        if (lastSnapshot === undefined || !Object.is(lastSnapshot, snapshot)) {
          try {
            slice = selector(snapshot)
            if (lastSlice !== undefined && equalityFn(lastSlice, slice)) {
              slice = lastSlice
            } else {
              lastSlice = slice
            }
          } catch (error) {
            setErr(error)
          }
          lastSnapshot = snapshot
        }
        return slice
      }
    }, [selector, equalityFn])
    return useSyncExternalStore(api.subscribe, getSnapshot)
  }

  Object.assign(useStore, api)

  return useStore
}
