export type State = object

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
export interface Subscribe<T extends State> {
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
 * @deprecated Use `StoreApi<T>['destroy']` instead of `GetState<T>`.
 */
export type Destroy = () => void

export interface StoreApi<T extends State> {
  setState: SetState<T>
  getState: GetState<T>
  subscribe: Subscribe<T>
  destroy: Destroy
}

export type StateCreator<
  T extends State,
  Mis extends [StoreMutatorIdentifier, unknown][] = [],
  Mos extends [StoreMutatorIdentifier, unknown][] = [],
  U = T
> = ((
  setState: Get<Mutate<StoreApi<T>, Mis>, 'setState', undefined>,
  getState: Get<Mutate<StoreApi<T>, Mis>, 'getState', undefined>,
  store: Mutate<StoreApi<T>, Mis>,
  $$storeMutations: Mis
) => U) & { $$storeMutators?: Mos }

// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-interface
export interface StoreMutators<S, A> {}
export type StoreMutatorIdentifier = keyof StoreMutators<unknown, unknown>

export type Mutate<S, Ms> = Ms extends []
  ? S
  : Ms extends [[infer Mi, infer Ma], ...infer Mrs]
  ? Mutate<StoreMutators<S, Ma>[Mi & StoreMutatorIdentifier], Mrs>
  : never

type Get<T, K, F = never> = K extends keyof T ? T[K] : F

interface CreateStore {
  <T extends State, Mos extends [StoreMutatorIdentifier, unknown][] = []>(
    initializer: StateCreator<T, [], Mos>
  ): Mutate<StoreApi<T>, Mos>

  <T extends State>(): <Mos extends [StoreMutatorIdentifier, unknown][] = []>(
    initializer: StateCreator<T, [], Mos>
  ) => Mutate<StoreApi<T>, Mos>
}

type CreateStoreImpl = <
  T extends State,
  Mos extends [StoreMutatorIdentifier, unknown][] = []
>(
  initializer: StateCreator<T, [], Mos>
) => Mutate<StoreApi<T>, Mos>

type PopArgument<T extends (...a: never[]) => unknown> = T extends (
  ...a: [...infer A, infer _]
) => infer R
  ? (...a: A) => R
  : never

const createStoreImpl: CreateStoreImpl = (createState) => {
  type TState = ReturnType<typeof createState>
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
  state = (createState as PopArgument<typeof createState>)(
    setState,
    getState,
    api
  )
  return api as any
}

const createStore = ((createState) =>
  createState ? createStoreImpl(createState) : createStoreImpl) as CreateStore

export default createStore
