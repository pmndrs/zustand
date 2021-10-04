import { useSyncExternalStoreExtra } from 'use-sync-external-store/extra'
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
  return useSyncExternalStoreExtra(
    api.subscribe,
    api.getState,
    null,
    selector,
    equalityFn
  )
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
