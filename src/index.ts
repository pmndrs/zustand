// @ts-ignore
import { useSyncExternalStoreExtra } from 'use-sync-external-store/extra'
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
    equalityFn?: EqualityChecker<StateSlice>
  ) => {
    const slice = useSyncExternalStoreExtra(
      api.subscribe,
      api.getState,
      selector,
      equalityFn
    )
    return slice
  }

  Object.assign(useStore, api)

  // For backward compatibility (No TS types for this)
  useStore[Symbol.iterator] = function () {
    console.warn(
      '[useStore, api] = create() is deprecated and will be removed in v4'
    )
    const items = [useStore, api]
    return {
      next() {
        const done = items.length <= 0
        return { value: items.shift(), done }
      },
    }
  }

  return useStore
}
