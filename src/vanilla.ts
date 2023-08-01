type SetStateInternal<T> = {
  _(
    partial: T | Partial<T> | { _(state: T): T | Partial<T> }['_'],
    replace?: boolean | undefined
  ): void
}['_']

export interface StoreApi<T> {
  setState: SetStateInternal<T>
  getState: () => T
  subscribe: (listener: (state: T, prevState: T) => void) => () => void
  /**
   * @deprecated Use `unsubscribe` returned by `subscribe`
   */
  destroy: () => void
}

type Get<T, K, F> = K extends keyof T ? T[K] : F

export type Mutate<S, Ms> = number extends Ms['length' & keyof Ms]
  ? S
  : Ms extends []
  ? S
  : Ms extends [[infer Mi, infer Ma], ...infer Mrs]
  ? Mutate<StoreMutators<S, Ma>[Mi & StoreMutatorIdentifier], Mrs>
  : never

export type StateCreator<
  T,
  Mis extends [StoreMutatorIdentifier, unknown][] = [],
  Mos extends [StoreMutatorIdentifier, unknown][] = [],
  U = T,
> = ((
  setState: Get<Mutate<StoreApi<T>, Mis>, 'setState', never>,
  getState: Get<Mutate<StoreApi<T>, Mis>, 'getState', never>,
  store: Mutate<StoreApi<T>, Mis>
) => U) & { $$storeMutators?: Mos }

// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-interface
export interface StoreMutators<S, A> {}
export type StoreMutatorIdentifier = keyof StoreMutators<unknown, unknown>

type CreateStore = {
  <T, Mos extends [StoreMutatorIdentifier, unknown][] = []>(
    initializer: StateCreator<T, [], Mos>
  ): Mutate<StoreApi<T>, Mos>

  <T>(): <Mos extends [StoreMutatorIdentifier, unknown][] = []>(
    initializer: StateCreator<T, [], Mos>
  ) => Mutate<StoreApi<T>, Mos>
}

type CreateStoreImpl = <
  T,
  Mos extends [StoreMutatorIdentifier, unknown][] = [],
>(
  initializer: StateCreator<T, [], Mos>
) => Mutate<StoreApi<T>, Mos>

const createStoreImpl: CreateStoreImpl = (createState) => {
  type TState = ReturnType<typeof createState>
  type Listener = (state: TState, prevState: TState) => void
  let state: TState
  const listeners: Set<Listener> = new Set()

  const setState: StoreApi<TState>['setState'] = (partial, replace) => {
    // TODO: Remove type assertion once https://github.com/microsoft/TypeScript/issues/37663 is resolved
    // https://github.com/microsoft/TypeScript/issues/37663#issuecomment-759728342
    const nextState =
      typeof partial === 'function'
        ? (partial as (state: TState) => TState)(state)
        : partial
    if (!Object.is(nextState, state)) {
      const previousState = state
      state =
        replace ?? typeof nextState !== 'object'
          ? (nextState as TState)
          : Object.assign({}, state, nextState)
      listeners.forEach((listener) => listener(state, previousState))
    }
  }

  const getState: StoreApi<TState>['getState'] = () => state

  const subscribe: StoreApi<TState>['subscribe'] = (listener) => {
    listeners.add(listener)
    // Unsubscribe
    return () => listeners.delete(listener)
  }

  const destroy: StoreApi<TState>['destroy'] = () => {
    if (import.meta.env?.MODE !== 'production') {
      console.warn(
        '[DEPRECATED] The `destroy` method will be unsupported in a future version. Instead use unsubscribe function returned by subscribe. Everything will be garbage-collected if store is garbage-collected.'
      )
    }
    listeners.clear()
  }

  const api = { setState, getState, subscribe, destroy }
  state = createState(setState, getState, api)
  return api as any
}

export const createStore = ((createState) =>
  createState ? createStoreImpl(createState) : createStoreImpl) as CreateStore

/**
 * @deprecated Use `import { createStore } from 'zustand/vanilla'`
 */
export default ((createState) => {
  if (import.meta.env?.MODE !== 'production') {
    console.warn(
      "[DEPRECATED] Default export is deprecated. Instead use import { createStore } from 'zustand/vanilla'."
    )
  }
  return createStore(createState)
}) as CreateStore

// ---------------------------------------------------------

/**
 * @deprecated Use `unknown` instead of `State`
 */
export type State = unknown

/**
 * @deprecated Use `Partial<T> | ((s: T) => Partial<T>)` instead of `PartialState<T>`
 */
export type PartialState<T extends State> =
  | Partial<T>
  | ((state: T) => Partial<T>)

/**
 * @deprecated Use `(s: T) => U` instead of `StateSelector<T, U>`
 */
export type StateSelector<T extends State, U> = (state: T) => U

/**
 * @deprecated Use `(a: T, b: T) => boolean` instead of `EqualityChecker<T>`
 */
export type EqualityChecker<T> = (state: T, newState: T) => boolean

/**
 * @deprecated Use `(state: T, previousState: T) => void` instead of `StateListener<T>`
 */
export type StateListener<T> = (state: T, previousState: T) => void

/**
 * @deprecated Use `(slice: T, previousSlice: T) => void` instead of `StateSliceListener<T>`.
 */
export type StateSliceListener<T> = (slice: T, previousSlice: T) => void

/**
 * @deprecated Use `(listener: (state: T) => void) => void` instead of `Subscribe<T>`.
 */
export type Subscribe<T extends State> = {
  (listener: (state: T, previousState: T) => void): () => void
}

/**
 * @deprecated You might be looking for `StateCreator`, if not then
 * use `StoreApi<T>['setState']` instead of `SetState<T>`.
 */
export type SetState<T extends State> = {
  _(
    partial: T | Partial<T> | { _(state: T): T | Partial<T> }['_'],
    replace?: boolean | undefined
  ): void
}['_']

/**
 * @deprecated You might be looking for `StateCreator`, if not then
 * use `StoreApi<T>['getState']` instead of `GetState<T>`.
 */
export type GetState<T extends State> = () => T

/**
 * @deprecated Use `StoreApi<T>['destroy']` instead of `Destroy`.
 */
export type Destroy = () => void
