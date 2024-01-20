// import { useDebugValue } from 'react'
// import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/shim/with-selector'
// Those don't work in ESM, because React libs are CJS only.
// See: https://github.com/pmndrs/valtio/issues/452
// The following is a workaround until ESM is supported.
// eslint-disable-next-line import/extensions
import ReactExports from 'react'
// eslint-disable-next-line import/extensions
import useSyncExternalStoreExports from 'use-sync-external-store/shim/with-selector'
import { createStore } from './vanilla.ts'
import type {
  Mutate,
  StateCreator,
  StoreApi,
  StoreMutatorIdentifier,
} from './vanilla.ts'

const { useDebugValue } = ReactExports
const { useSyncExternalStoreWithSelector } = useSyncExternalStoreExports

type ExtractState<S> = S extends { getState: () => infer T } ? T : never

type ReadonlyStoreApi<T> = Pick<StoreApi<T>, 'getState' | 'subscribe'>

type WithReact<S extends ReadonlyStoreApi<unknown>> = S & {
  /** @deprecated please use api.getState() */
  getServerState?: () => ExtractState<S>
}

let didWarnAboutEqualityFn = false

const identity = <T>(arg: T): T => arg

export function useStore<S extends WithReact<StoreApi<unknown>>>(
  api: S,
): ExtractState<S>

export function useStore<S extends WithReact<StoreApi<unknown>>, U>(
  api: S,
  selector: (state: ExtractState<S>) => U,
): U

/**
 * @deprecated Use `useStoreWithEqualityFn` from 'zustand/traditional'
 * https://github.com/pmndrs/zustand/discussions/1937
 */
export function useStore<S extends WithReact<StoreApi<unknown>>, U>(
  api: S,
  selector: (state: ExtractState<S>) => U,
  equalityFn: ((a: U, b: U) => boolean) | undefined,
): U

export function useStore<TState, StateSlice>(
  api: WithReact<StoreApi<TState>>,
  selector: (state: TState) => StateSlice = identity as any,
  equalityFn?: (a: StateSlice, b: StateSlice) => boolean,
) {
  if (
    import.meta.env?.MODE !== 'production' &&
    equalityFn &&
    !didWarnAboutEqualityFn
  ) {
    console.warn(
      "[DEPRECATED] Use `createWithEqualityFn` instead of `create` or use `useStoreWithEqualityFn` instead of `useStore`. They can be imported from 'zustand/traditional'. https://github.com/pmndrs/zustand/discussions/1937",
    )
    didWarnAboutEqualityFn = true
  }
  const slice = useSyncExternalStoreWithSelector(
    api.subscribe,
    api.getState,
    api.getServerState || api.getInitialState,
    selector,
    equalityFn,
  )
  useDebugValue(slice)
  return slice
}

export type UseBoundStore<S extends WithReact<ReadonlyStoreApi<unknown>>> = {
  (): ExtractState<S>
  <U>(selector: (state: ExtractState<S>) => U): U
  /**
   * @deprecated Use `createWithEqualityFn` from 'zustand/traditional'
   */
  <U>(
    selector: (state: ExtractState<S>) => U,
    equalityFn: (a: U, b: U) => boolean,
  ): U
} & S

type Create = {
  <T, Mos extends [StoreMutatorIdentifier, unknown][] = []>(
    initializer: StateCreator<T, [], Mos>,
  ): UseBoundStore<Mutate<StoreApi<T>, Mos>>
  <T>(): <Mos extends [StoreMutatorIdentifier, unknown][] = []>(
    initializer: StateCreator<T, [], Mos>,
  ) => UseBoundStore<Mutate<StoreApi<T>, Mos>>
  /**
   * @deprecated Use `useStore` hook to bind store
   */
  <S extends StoreApi<unknown>>(store: S): UseBoundStore<S>
}

const createImpl = <T>(createState: StateCreator<T, [], []>) => {
  if (
    import.meta.env?.MODE !== 'production' &&
    typeof createState !== 'function'
  ) {
    console.warn(
      "[DEPRECATED] Passing a vanilla store will be unsupported in a future version. Instead use `import { useStore } from 'zustand'`.",
    )
  }
  const api =
    typeof createState === 'function' ? createStore(createState) : createState

  const useBoundStore: any = (selector?: any, equalityFn?: any) =>
    useStore(api, selector, equalityFn)

  Object.assign(useBoundStore, api)

  return useBoundStore
}

export const create = (<T>(createState: StateCreator<T, [], []> | undefined) =>
  createState ? createImpl(createState) : createImpl) as Create

/**
 * @deprecated Use `import { create } from 'zustand'`
 */
export default ((createState: any) => {
  if (import.meta.env?.MODE !== 'production') {
    console.warn(
      "[DEPRECATED] Default export is deprecated. Instead use `import { create } from 'zustand'`.",
    )
  }
  return create(createState)
}) as Create
