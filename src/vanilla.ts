// ============================================================================
// Types

interface Store<T extends UnknownState>
  { getState: 
      () => T
  , setState:
      <Nt extends (R extends true ? T : Partial<T>), R extends boolean>
        ( nextStateOrUpdater: Nt | ((state: T) => Nt)
        , shouldReplace?: R
        ) =>
          void
  , subscribe:
      (listener: (state: T, previousState: T) => void) =>
        () => void
  , destroy:
      () => void
  }

type UnknownState =
  object

type Create =
  <T extends UnknownState, Mos extends [StoreMutatorIdentifier, unknown][] = []>
    (initializer: StoreInitializer<T, [], Mos>) =>
      Mutate<Store<T>, Mos>

type StoreInitializer
  < T extends UnknownState
  , Mis extends [StoreMutatorIdentifier, unknown][]
  , Mos extends [StoreMutatorIdentifier, unknown][]
  , U = T
  > =
    & ( ( setState: Get<Mutate<Store<T>, Mis>, "setState", undefined>
        , getState: Get<Mutate<Store<T>, Mis>, "getState", undefined>
        , store: Mutate<Store<T>, Mis>
        , $$storeMutations: Mis
        ) =>
          U
      )
    & { [$$storeMutators]?: Mos }
declare const $$storeMutators: unique symbol;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface StoreMutators<S, A> {}
type StoreMutatorIdentifier = keyof StoreMutators<unknown, unknown>

type Mutate<S, Ms> =
  Ms extends [] ? S :
  Ms extends [[infer Mi, infer Ma], ...infer Mrs]
    ? Mutate<
        StoreMutators<S, Ma>[Mi & StoreMutatorIdentifier],
        Mrs
      > :
  never




// ============================================================================
// Implementation via Existential Types

type EState = { __isState: true }
type EShouldReplaceState = boolean & { __isShouldReplaceState: true }

interface EStore
  { getState:
      () => EState
  , setState:
      ( nextStateOrUpdater:
          | Partial<EState>
          | ((state: EState) => Partial<EState>)
      , shouldReplace?: EShouldReplaceState
      ) =>
        void
  , subscribe:
      ( listener:
          (state: EState, previousState: Previous<EState>) => void
      ) =>
        () => void
  , destroy:
      () => void
  }

type ECreate =
  ( storeInitializer:
    ( set: EStore['setState']
    , get: EStore['getState']
    , store: EStore
    ) => EState
  ) =>
    EStore

const createImpl: ECreate = storeInitializer => {
  let state: EState

  type Listener = (state: EState, previousState: Previous<EState>) => void
  const listeners: Set<Listener> = new Set()
  const emit = (...a: Parameters<Listener>) =>
    listeners.forEach(f => f(...a))

  const store: EStore = {
    getState: () => state,
    setState: (nextStateOrUpdater, shouldReplace) => {
      const nextState =
        typeof nextStateOrUpdater === 'function'
          ? nextStateOrUpdater(state)
          : nextStateOrUpdater

      if (nextState === state) return

      const previousState = previous(state)
      state = shouldReplace
        ? nextState as EState
        : Object.assign({}, state, nextState)

      emit(state, previousState)
    },
    subscribe: listener => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    destroy: () => listeners.clear()
  }
  state = storeInitializer(store.setState, store.getState, store)
  return store
}
const create = createImpl as unknown as Create




// ============================================================================
// Utilities

type Previous<T> = T & { __isPrevious: true }
const previous = <T>(t: T) => t as Previous<T>

type Get<T, K, F = never> = 
  K extends keyof T ? T[K] : F

// ============================================================================
// Exports

export default create
export {
  Store,
  UnknownState,
  StoreInitializer,
  $$storeMutators,
  StoreMutators,
  StoreMutatorIdentifier,
  Mutate
}
