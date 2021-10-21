import { useSyncExternalStoreExtra } from 'use-sync-external-store/extra'
import createStore, {
  EqualityChecker,
  GetState,
  SetState,
  State,
  StateCreator,
  StateSelector,
  StoreApi,
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

export type UseBoundStore<
  T extends State,
  CustomStoreApi extends StoreApi<T> = StoreApi<T>
> = {
  (): T
  <U>(selector: StateSelector<T, U>, equalityFn?: EqualityChecker<U>): U
} & CustomStoreApi

export default function create<
  TState extends State,
  CustomSetState = SetState<TState>,
  CustomGetState = GetState<TState>,
  CustomStoreApi extends StoreApi<TState> = StoreApi<TState>
>(
  createState:
    | StateCreator<TState, CustomSetState, CustomGetState, CustomStoreApi>
    | CustomStoreApi
): UseBoundStore<TState, CustomStoreApi> {
  const api: CustomStoreApi =
    typeof createState === 'function' ? createStore(createState) : createState

  const useBoundStore: any = (selector?: any, equalityFn?: any) =>
    useStore(api, selector, equalityFn)

  Object.assign(useBoundStore, api)

  return useBoundStore
}
