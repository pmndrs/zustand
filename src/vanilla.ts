export type State = object
export type PartialState<T extends State> = Partial<T>
export type StateSelector<T extends State, U> = (state: T) => U
export type EqualityChecker<T> = (state: T, newState: T) => boolean
export type StateListener<T> = (state: T, previousState: T) => void
export type StateSliceListener<T> = (slice: T, previousSlice: T) => void
export type Subscribe<T extends State> = {
  (listener: StateListener<T>): () => void
}

export type SetState<T extends State> = <
  Nt extends R extends true ? T : Partial<T>,
  R extends boolean
>(
  partial: Nt | ((state: T) => Nt),
  replace?: R
) => void
export type GetState<T extends State> = () => T
export type Destroy = () => void
export type StoreApi<T extends State> = {
  setState: SetState<T>
  getState: GetState<T>
  subscribe: Subscribe<T>
  destroy: Destroy
}

export const $$storeMutators = Symbol('$$storeMutators')

export type StateCreator<
  T extends State,
  Mis extends [StoreMutatorIdentifier, unknown][],
  Mos extends [StoreMutatorIdentifier, unknown][],
  U = T
> = ((
  setState: Get<Mutate<StoreApi<T>, Mis>, 'setState', undefined>,
  getState: Get<Mutate<StoreApi<T>, Mis>, 'getState', undefined>,
  store: Mutate<StoreApi<T>, Mis>,
  $$storeMutations: Mis
) => U) & { [$$storeMutators]?: Mos }

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface StoreMutators<S, A> {}
export type StoreMutatorIdentifier = keyof StoreMutators<unknown, unknown>

export type Mutate<S, Ms> = Ms extends []
  ? S
  : Ms extends [[infer Mi, infer Ma], ...infer Mrs]
  ? Mutate<StoreMutators<S, Ma>[Mi & StoreMutatorIdentifier], Mrs>
  : never

type Get<T, K, F = never> = K extends keyof T ? T[K] : F

type Create = <
  T extends State,
  Mos extends [StoreMutatorIdentifier, unknown][] = []
>(
  initializer: StateCreator<T, [], Mos>
) => Mutate<StoreApi<T>, Mos>

const create: Create = (createState) => {
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

type PopArgument<T extends (...a: never[]) => unknown> = T extends (
  ...a: [...infer A, infer _]
) => infer R
  ? (...a: A) => R
  : never

export default create

type CreateWithState = <T extends State>() => <
  Mos extends [StoreMutatorIdentifier, unknown][] = []
>(
  initializer: StateCreator<T, [], Mos>
) => Mutate<StoreApi<T>, Mos>

export const createWithState: CreateWithState = () => create
