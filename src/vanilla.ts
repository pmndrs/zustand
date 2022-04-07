export type State = object
// types inspired by setState from React, see:
// https://github.com/DefinitelyTyped/DefinitelyTyped/blob/6c49e45842358ba59a508e13130791989911430d/types/react/v16/index.d.ts#L489-L495

/**
 * @deprecated Use the builtin `Partial<T>` instead of `PartialState<T>`.
 * Additionally turn on `--exactOptionalPropertyTypes` tsc flag.
 * `PartialState` will be removed in next major
 */
export type PartialState<
  T extends State,
  K1 extends keyof T = keyof T,
  K2 extends keyof T = K1,
  K3 extends keyof T = K2,
  K4 extends keyof T = K3
> =
  | (Pick<T, K1> | Pick<T, K2> | Pick<T, K3> | Pick<T, K4> | T)
  | ((state: T) => Pick<T, K1> | Pick<T, K2> | Pick<T, K3> | Pick<T, K4> | T)
export type StateSelector<T extends State, U> = (state: T) => U
export type EqualityChecker<T> = (state: T, newState: T) => boolean
export type StateListener<T> = (state: T, previousState: T) => void
/**
 * @deprecated Use `StateListener<T>` instead of `StateSliceListener<T>`.
 */
export type StateSliceListener<T> = (slice: T, previousSlice: T) => void
export type Subscribe<T extends State> = {
  (listener: StateListener<T>): () => void
}

export type SetState<T extends State> = {
  <
    K1 extends keyof T,
    K2 extends keyof T = K1,
    K3 extends keyof T = K2,
    K4 extends keyof T = K3
  >(
    partial: PartialState<T, K1, K2, K3, K4>,
    replace?: boolean
  ): void
}
export type GetState<T extends State> = () => T
export type Destroy = () => void
export type StoreApi<T extends State> = {
  setState: SetState<T>
  getState: GetState<T>
  subscribe: Subscribe<T>
  destroy: Destroy
}
export type StateCreator<
  T extends State,
  CustomSetState = SetState<T>,
  CustomGetState = GetState<T>,
  CustomStoreApi extends StoreApi<T> = StoreApi<T>
> = (set: CustomSetState, get: CustomGetState, api: CustomStoreApi) => T

function createStore<
  TState extends State,
  CustomSetState,
  CustomGetState,
  CustomStoreApi extends StoreApi<TState>
>(
  createState: StateCreator<
    TState,
    CustomSetState,
    CustomGetState,
    CustomStoreApi
  >
): CustomStoreApi

function createStore<TState extends State>(
  createState: StateCreator<TState, SetState<TState>, GetState<TState>, any>
): StoreApi<TState>

function createStore<
  TState extends State,
  CustomSetState,
  CustomGetState,
  CustomStoreApi extends StoreApi<TState>
>(
  createState: StateCreator<
    TState,
    CustomSetState,
    CustomGetState,
    CustomStoreApi
  >
): CustomStoreApi {
  let state: TState
  const listeners: Set<StateListener<TState>> = new Set()

  const setState: SetState<TState> = (partial, replace) => {
    // TODO: Remove type assertion once https://github.com/microsoft/TypeScript/issues/37663 is resolved
    // https://github.com/microsoft/TypeScript/issues/37663#issuecomment-759728342
    const nextState =
      typeof partial === 'function'
        ? (partial as (state: TState) => TState)(state)
        : partial
    if (nextState !== state) {
      const previousState = state
      state = replace
        ? (nextState as TState)
        : Object.assign({}, state, nextState)
      listeners.forEach((listener) => listener(state, previousState))
    }
  }

  const getState: GetState<TState> = () => state

  const subscribe: Subscribe<TState> = (listener: StateListener<TState>) => {
    listeners.add(listener)
    // Unsubscribe
    return () => listeners.delete(listener)
  }

  const destroy: Destroy = () => listeners.clear()
  const api = { setState, getState, subscribe, destroy }
  state = createState(
    setState as unknown as CustomSetState,
    getState as unknown as CustomGetState,
    api as unknown as CustomStoreApi
  )
  return api as unknown as CustomStoreApi
}

export default createStore

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface StoreMutators<S, A> {}
export type StoreMutatorIdentifier = keyof StoreMutators<unknown, unknown>

export type Mutate<S, Ms> = Ms extends []
  ? S
  : Ms extends [[infer Mi, infer Ma], ...infer Mrs]
  ? Mutate<StoreMutators<S, Ma>[Mi & StoreMutatorIdentifier], Mrs>
  : never
