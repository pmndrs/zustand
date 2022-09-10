import { useDebugValue } from 'react'
// import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/shim/with-selector'
// This doesn't work in ESM, because use-sync-external-store only exposes CJS.
// See: https://github.com/pmndrs/valtio/issues/452
// The following is a workaround until ESM is supported.
import useSyncExternalStoreExports from 'use-sync-external-store/shim/with-selector'
import createStore from './vanilla'
import type {
  Mutate,
  StateCreator,
  StoreApi,
  StoreMutatorIdentifier,
} from './vanilla'

const { useSyncExternalStoreWithSelector } = useSyncExternalStoreExports

type ExtractState<S> = S extends { getState: () => infer T } ? T : never

type WithReact<S extends StoreApi<unknown>> = S & {
  getServerState?: () => ExtractState<S>
}

export function useStore<S extends WithReact<StoreApi<unknown>>>(
  api: S
): ExtractState<S>

export function useStore<S extends WithReact<StoreApi<unknown>>, U>(
  api: S,
  selector: (state: ExtractState<S>) => U,
  equalityFn?: (a: U, b: U) => boolean
): U

export function useStore<TState, StateSlice>(
  api: WithReact<StoreApi<TState>>,
  selector: (state: TState) => StateSlice = api.getState as any,
  equalityFn?: (a: StateSlice, b: StateSlice) => boolean
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

export type UseBoundStore<S extends WithReact<StoreApi<unknown>>> = {
  (): ExtractState<S>
  <U>(
    selector: (state: ExtractState<S>) => U,
    equals?: (a: U, b: U) => boolean
  ): U
} & S

type Create = {
  <T, Mos extends [StoreMutatorIdentifier, unknown][] = []>(
    initializer: StateCreator<T, [], Mos>
  ): UseBoundStore<Mutate<StoreApi<T>, Mos>>
  <T>(): <Mos extends [StoreMutatorIdentifier, unknown][] = []>(
    initializer: StateCreator<T, [], Mos>
  ) => UseBoundStore<Mutate<StoreApi<T>, Mos>>
  <S extends StoreApi<unknown>>(store: S): UseBoundStore<S>
}

const createImpl = <T>(createState: StateCreator<T, [], []>) => {
  const api =
    typeof createState === 'function' ? createStore(createState) : createState

  const useBoundStore: any = (selector?: any, equalityFn?: any) =>
    useStore(api, selector, equalityFn)

  Object.assign(useBoundStore, api)

  return useBoundStore
}

const create = (<T>(createState: StateCreator<T, [], []> | undefined) =>
  createState ? createImpl(createState) : createImpl) as Create

export default create
