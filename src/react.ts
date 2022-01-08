import { useDebugValue } from 'react'
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/shim/with-selector'
import createStore, {
  EqualityChecker,
  Mutate,
  State,
  StateCreator,
  StateSelector,
  StoreApi,
  StoreMutatorIdentifier,
} from './vanilla'

export function useStore<S extends StoreApi<State>, U = ExtractState<S>>(
  api: S,
  selector?: StateSelector<ExtractState<S>, U>,
  equalityFn?: EqualityChecker<U>
): U
export function useStore<TState extends State, StateSlice>(
  api: StoreApi<TState>,
  selector: StateSelector<TState, StateSlice> = api.getState as any,
  equalityFn?: EqualityChecker<StateSlice>
) {
  const slice = useSyncExternalStoreWithSelector(
    api.subscribe,
    api.getState,
    null,
    selector,
    equalityFn
  )
  useDebugValue(slice)
  return slice
}

type ExtractState<S> = S extends { getState: () => infer T } ? T : never

type UseBoundStore<S> = (<U = ExtractState<S>>(
  selector?: (state: ExtractState<S>) => U,
  equals?: (a: U, b: U) => boolean
) => U) &
  S

type Create = {
  <T extends State, Mos extends [StoreMutatorIdentifier, unknown][] = []>(
    initializer: StateCreator<T, [], Mos>
  ): UseBoundStore<Mutate<StoreApi<T>, Mos>>
  <S extends StoreApi<State>>(store: S): UseBoundStore<S>

  <T extends State>(): <Mos extends [StoreMutatorIdentifier, unknown][] = []>(
    initializer: StateCreator<T, [], Mos>
  ) => UseBoundStore<Mutate<StoreApi<T>, Mos>>
  <S extends StoreApi<State>>(store: S): UseBoundStore<S>
}

const _create = <T extends State>(createState: StateCreator<T, [], []>) => {
  const api =
    typeof createState === 'function' ? createStore(createState) : createState

  const useBoundStore: any = (selector?: any, equalityFn?: any) =>
    useStore(api, selector, equalityFn)

  Object.assign(useBoundStore, api)

  return useBoundStore
}

const create = (<T extends State>(
  createState: StateCreator<T, [], []> | undefined
) => {
  if (!createState) return _create
  return _create(createState)
}) as Create

export default create
