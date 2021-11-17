// ============================================================================
// Types

interface Store<T extends UnknownState>
  { getState: 
      () => T
  , setState:
      <Nt extends (R extends true ? T : O.Partial<T>), R extends boolean>
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
  object;

type Create =
  <T extends UnknownState, S extends Store<T>>
    ( storeInitializer: StoreInitializer<T, S>
    , phantomInitialState?: T
    ) =>
      S

type StoreInitializer<T extends UnknownState, S extends Store<T>> =
  & ( ( set: Store<T>["setState"] 
      , get: Store<T>["getState"]
      , store: Store<T>
      ) =>
        T
    )
  & TagStore<S>

declare const $$store: unique symbol;
type TagStore<S> = { [$$store]?: S }




// ============================================================================
// Implementation via Existential Types

type EState = { __isState: true }
type EShouldReplaceState = boolean & { __isShouldReplaceState: true }

interface EStore
  { getState:
      () => EState
  , setState:
      ( nextStateOrUpdater:
          | O.Partial<EState>
          | ((state: EState) => O.Partial<EState>)
      , shouldReplace?: EShouldReplaceState
      ) =>
        void
  , subscribe:
      ( listener:
          (state: EState, previousState: E.Previous<EState>) => void
      ) =>
        () => void
  , destroy:
      () => void
  }

type ECreate =
  ( storeInitializer:
    ( set: EStore["setState"]
    , get: EStore["getState"]
    , store: EStore
    ) => EState
  ) =>
    EStore

const createImpl: ECreate = storeInitializer => {
  let state: EState;

  type Listener = (state: EState, previousState: E.Previous<EState>) => void
  let listeners: Set<Listener> = new Set();
  const emit = (...a: F.Arguments<Listener>) =>
    listeners.forEach(f => f(...a))

  let store: EStore = {
    getState: () => state,
    setState: (nextStateOrUpdater, shouldReplace) => {
      let nextState =
        typeof nextStateOrUpdater === "function"
          ? nextStateOrUpdater(state)
          : nextStateOrUpdater

      if (objectIs(nextState, state)) return;

      let previousState = E.previous(state);
      state = shouldReplace
        ? nextState as EState
        : Object.assign({}, state, nextState)

      emit(state, previousState);
    },
    subscribe: listener => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    destroy: () => listeners.clear()
  }
  state = storeInitializer(store.setState, store.getState, store);
  return store;
}
const create = createImpl as Create




// ============================================================================
// Utilities

const objectIs = Object.is as (<T>(a: T, b: T) => boolean)

namespace E {
  export type Previous<T> = T & { __isPrevious: true };
  export const previous = <T>(t: T) => t as Previous<T>
}

namespace O {
  export type Unknown =
    object;

  export type Partial<T extends O.Unknown> =
    { [K in keyof T]?: T[K] }
}

namespace F {
  export type Unknown =
    (...a: never[]) => unknown

  export type Call<T extends F.Unknown> =
    T extends (...a: never[]) => infer R ? R : never

  export type Arguments<T extends F.Unknown> =
    T extends (...a: infer A) => unknown ? A : never
}


// ============================================================================
// Exports

export default create;
export
  { StoreInitializer // create's argument
  , Store // create's result
  , UnknownState // Store's type-parameter's constraint
  }
