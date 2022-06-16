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

type ExtractState<S> = S extends { getState: () => infer T } ? T : never

type WithReact<S extends StoreApi<State>> = S & {
  getServerState?: () => ExtractState<S>
}

export function useStore<S extends WithReact<StoreApi<State>>>(
  api: S
): ExtractState<S>

export function useStore<S extends WithReact<StoreApi<State>>, U>(
  api: S,
  selector: StateSelector<ExtractState<S>, U>,
  equalityFn?: EqualityChecker<U>
): U

export function useStore<TState extends State, StateSlice>(
  api: WithReact<StoreApi<TState>>,
  selector: StateSelector<TState, StateSlice> = api.getState as any,
  equalityFn?: EqualityChecker<StateSlice>
) {
  const slice = useSyncExternalStoreWithSelector(
    api.subscribe,
    api.getState,
    api.getServerState || api.getState,
    selector,
    equalityFn
  )
  useDebugValue(slice)
  return slice
}

export type UseBoundStore<S extends WithReact<StoreApi<State>>> = {
  (): ExtractState<S>
  <U>(
    selector: StateSelector<ExtractState<S>, U>,
    equals?: EqualityChecker<U>
  ): U
} & S

interface Create {
  <T extends State, Mos extends [StoreMutatorIdentifier, unknown][] = []>(
    initializer: StateCreator<T, [], Mos>
  ): UseBoundStore<Mutate<StoreApi<T>, Mos>>
  <T extends State>(): <Mos extends [StoreMutatorIdentifier, unknown][] = []>(
    initializer: StateCreator<T, [], Mos>
  ) => UseBoundStore<Mutate<StoreApi<T>, Mos>>
  <S extends StoreApi<State>>(store: S): UseBoundStore<S>
}

const createImpl = <T extends State>(createState: StateCreator<T, [], []>) => {
  const api =
    typeof createState === 'function' ? createStore(createState) : createState

  const useBoundStore: any = (selector?: any, equalityFn?: any) =>
    useStore(api, selector, equalityFn)

  Object.assign(useBoundStore, api)

  return useBoundStore
}

const create = (<T extends State>(
  createState: StateCreator<T, [], []> | undefined
) => (createState ? createImpl(createState) : createImpl)) as Create

export default create
