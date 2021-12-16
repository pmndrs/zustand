/**
 * @deprecated `State` is renamed to `UnknownState`,
 * `State` will be removed in next major
 */
export type State = object

export type UnknownState = object;

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

/**
 * @deprecated Use `(t: T) => U` instead of `StateSelector<T, U>`.
 * `StateSelector` will be removed in next major.
 */
export type StateSelector<T extends State, U> = (state: T) => U

/**
 * @deprecated Use `(a: T, b: T) => boolean` instead of `EqualityChecker<T>.
 * `EqualityChecker` will be removed in next major.
 */
export type EqualityChecker<T> = (state: T, newState: T) => boolean

/** 
 * @deprecated Use `(state: T, prevState: T) => void` instead of `StateListener<T>`.
 * `StateListener` will be removed in next major.
 */
export type StateListener<T> = (state: T, previousState: T) => void

/** 
 * @deprecated Use `(slice: T, prevSlice: T) => void` instead of `StateSliceListener<T>`.
 * `StateSliceListener` will be removed in next major.
 */
export type StateSliceListener<T> = (slice: T, previousSlice: T) => void

/**
 * @deprecated Use `Store<T>['subscribe']` instead of `Subscribe<T>`.
 * `Subscribe` will be removed in next major.
 */
export type Subscribe<T extends State> = {
  (listener: StateListener<T>): () => void
  /**
   * @deprecated Please use `subscribeWithSelector` middleware
   */
  <StateSlice>(
    listener: StateSliceListener<StateSlice>,
    selector?: StateSelector<T, StateSlice>,
    equalityFn?: EqualityChecker<StateSlice>
  ): () => void
}

/**
 * @deprecated Use `Store<T>['setState']` instead of `SetState<T>`
 * `SetState` will be removed in next major.
 */
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

/**
 * @deprecated Use `() => T` or `Store<T>['getState']` instead of `GetState<T>`
 * `GetState` will be removed in next major.
 */
export type GetState<T extends State> = () => T

/**
 * @deprecated Use `() => void` or `Store<UnknownState>['destroy']` instead of `Destroy`.
 * `Destroy` will be removed in next major.
 */
export type Destroy = () => void

/**
 * @deprecated `StoreApi<T>` has been renamed to `Store<T>`
 * `StoreApi` will be removed in next major.
 */
export type StoreApi<T extends State> = {
  setState: SetState<T>
  getState: GetState<T>
  subscribe: Subscribe<T>
  destroy: Destroy
}

export type Store<T extends State> = {
  setState: SetState<T>
  getState: GetState<T>
  subscribe: Subscribe<T>
  destroy: Destroy
}

/**
 * @deprecated `StateCreator` has been renamed to `StoreInitializer`.
 * `StateCreator` will be removed in next major.
 */
export type StateCreator<
  T extends State,
  CustomSetState = SetState<T>,
  CustomGetState = GetState<T>,
  CustomStoreApi extends StoreApi<T> = StoreApi<T>
> = (set: CustomSetState, get: CustomGetState, api: CustomStoreApi) => T


export type StoreInitializer<
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

  const subscribeWithSelector = <StateSlice>(
    listener: StateSliceListener<StateSlice>,
    selector: StateSelector<TState, StateSlice> = getState as any,
    equalityFn: EqualityChecker<StateSlice> = Object.is
  ) => {
    console.warn('[DEPRECATED] Please use `subscribeWithSelector` middleware')
    let currentSlice: StateSlice = selector(state)
    function listenerToAdd() {
      const nextSlice = selector(state)
      if (!equalityFn(currentSlice, nextSlice)) {
        const previousSlice = currentSlice
        listener((currentSlice = nextSlice), previousSlice)
      }
    }
    listeners.add(listenerToAdd)
    // Unsubscribe
    return () => listeners.delete(listenerToAdd)
  }

  const subscribe: Subscribe<TState> = <StateSlice>(
    listener: StateListener<TState> | StateSliceListener<StateSlice>,
    selector?: StateSelector<TState, StateSlice>,
    equalityFn?: EqualityChecker<StateSlice>
  ) => {
    if (selector || equalityFn) {
      return subscribeWithSelector(
        listener as StateSliceListener<StateSlice>,
        selector,
        equalityFn
      )
    }
    listeners.add(listener as StateListener<TState>)
    // Unsubscribe
    return () => listeners.delete(listener as StateListener<TState>)
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
