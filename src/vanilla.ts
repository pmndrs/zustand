type SetStateInternal<T> = {
  _(
    partial: T | Partial<T> | { _(state: T): T | Partial<T> }['_'],
    replace?: false,
  ): void
  _(state: T | { _(state: T): T }['_'], replace: true): void
}['_']

export interface StoreApi<T> {
  setState: SetStateInternal<T>
  getState: () => T
  getInitialState: () => T
  subscribe: (listener: (state: T, prevState: T) => void) => () => void
}

export type ExtractState<S> = S extends { getState: () => infer T } ? T : never

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
  store: Mutate<StoreApi<T>, Mis>,
) => U) & { $$storeMutators?: Mos }

// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-object-type
export interface StoreMutators<S, A> {}
export type StoreMutatorIdentifier = keyof StoreMutators<unknown, unknown>

type CreateStore = {
  <T, Mos extends [StoreMutatorIdentifier, unknown][] = []>(
    initializer: StateCreator<T, [], Mos>,
  ): Mutate<StoreApi<T>, Mos>

  <T>(): <Mos extends [StoreMutatorIdentifier, unknown][] = []>(
    initializer: StateCreator<T, [], Mos>,
  ) => Mutate<StoreApi<T>, Mos>
}

type CreateStoreImpl = <
  T,
  Mos extends [StoreMutatorIdentifier, unknown][] = [],
>(
  initializer: StateCreator<T, [], Mos>,
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
        (replace ?? (typeof nextState !== 'object' || nextState === null))
          ? (nextState as TState)
          : Object.assign({}, state, nextState)
      listeners.forEach((listener) => listener(state, previousState))
    }
  }

  const getState: StoreApi<TState>['getState'] = () => state

  const getInitialState: StoreApi<TState>['getInitialState'] = () =>
    initialState

  const subscribe: StoreApi<TState>['subscribe'] = (listener) => {
    listeners.add(listener)
    // Unsubscribe
    return () => listeners.delete(listener)
  }

  const api = { setState, getState, getInitialState, subscribe }
  const initialState = (state = createState(setState, getState, api))
  return api as any
}

export const createStore = ((createState) =>
  createState ? createStoreImpl(createState) : createStoreImpl) as CreateStore

export type SetStateFnParam<T> = T | ((oldState: T) => T)
export type SetStateFn<T> = (newState: SetStateFnParam<T>) => void

// There is probably a better type to use than this. It is the type of the `set()` function
type SetFn<StateObject extends Record<string, any>> = {
  (
    partial:
      | StateObject
      | Partial<StateObject>
      | ((state: StateObject) => StateObject | Partial<StateObject>),
    replace?: false,
  ): void
  (
    state: StateObject | ((state: StateObject) => StateObject),
    replace: true,
  ): void
}

/** Creates the `setState` function for a given piece of state.
 *
 * ```ts
 *  interface CounterStore {
 *    count: number
 *    setCount: SetStateFn<number>
 *    increment: () => void
 * }
 *
 * const useCounterStore = create<CounterStore>()((set) => {
 *   const setCount = createSetterFn(set, 'count')
 *
 *   return {
 *     count: 0,
 *     setCount,
 *     increment: () => setCount(oldCount => oldCount + 1),
 *   }
 * })
 * ```
 */
export function createSetterFn<
  State extends Record<string, any>,
  Key extends keyof State,
>(set: SetFn<State>, key: Key): SetStateFn<State[Key]> {
  type Value = State[Key]
  type FunctionState = (oldState: Value) => Value

  function setterFn(newState: SetStateFnParam<Value>): void {
    set((oldState) => ({
      ...oldState,
      [key]:
        typeof newState === 'function'
          ? (newState as FunctionState)(oldState[key])
          : newState,
    }))
  }

  return setterFn
}
