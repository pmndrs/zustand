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
      { (listener: (state: T, previousState: T) => void):
          () => void

      , /** @deprecated Please use `subscribeWithSelector` middleware */
        <U>
          ( listener: (state: U, previousState: U) => void
          , selector?: (state: T) => U
          , equals?: (a: U, b: U) => boolean
          ):
            () => void
      }
  , destroy:
      () => void
  }

type UnknownState =
  object;

type Create =
  <T extends UnknownState, S extends Store<T>>
    ( stateInitializer: StateInitializer<T, S>
    , phantomInitialState?: T
    ) =>
      S

type StateInitializer<T extends UnknownState, S extends Store<T>> =
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
type ESelectedState = { __isSelectedSelected: true }
type EShouldReplaceState = boolean & { __isShouldReplaceState: true }

interface EStore
  { getState:
      () => EState
  , setState:
      ( nextStateOrUpdater:
          | E.Partial<EState>
          | ((state: EState) => E.Partial<EState>)
      , shouldReplace?: EShouldReplaceState
      ) =>
        void
  , subscribe:
      { ( listener: (state: EState, previousState: E.Previous<EState>) => void
        ):
          () => void

      , ( listener: (state: ESelectedState, previousState: ESelectedState) => void
        , selector: (state: EState) => ESelectedState
        , equals?: (a: ESelectedState, b: ESelectedState) => boolean
        ):
          () => void
      }
  , destroy:
      () => void
  }

type ECreate =
  ( stateInitializer:
    ( set: EStore["setState"]
    , get: EStore["getState"]
    , store: EStore
    ) => EState
  ) =>
    EStore

const createImpl: ECreate = stateInitializer => {
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
        ? nextState
        : Object.assign({}, state, nextState)

      emit(state, previousState);
    },
    subscribe: (..._args: F.O2.Arguments<EStore["subscribe"]>) => {
      let [_, _selector, _equals] = _args;
      if (_selector || _equals) {
        narrow(_args.length === 3)
        let [listener] = _args;

        console.warn("[DEPRECATED] Please use `subscribeWithSelector` middleware");
        let selector = fallback(_selector, (x: EState) => x as unknown as ESelectedState);
        let equals = fallback(_equals, objectIs);
        
        let currentSlice = selector(state)
        const sliceListener = () => {
          let nextSlice = selector(state)
          if (equals(currentSlice, nextSlice)) return;

          let previousSlice = E.previous(currentSlice)
          currentSlice = nextSlice
          listener(currentSlice, previousSlice)
        }

        listeners.add(sliceListener)
        return () => listeners.delete(sliceListener)
      }

      narrow(_args.length === 1)
      let [listener] = _args;

      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    destroy: () => listeners.clear()
  }
  state = stateInitializer(store.setState, store.getState, store);
  return store;
}
const create = createImpl as Create




// ============================================================================
// Utilities

const fallback = <T>(t: T | undefined, f: T) => (t || f) as T
const objectIs = Object.is as (<T>(a: T, b: T) => boolean)
function narrow<T extends boolean>(predicate: T): asserts predicate {}

namespace E {
  export type Partial<T> = T & { __isPartial: true }

  export type Previous<T> = T & { __isPrevious: true };
  export const previous = <T>(t: T) => t as Previous<T>
}

namespace O {
  export type Partial<T> =
    { [K in keyof T]?: T[K] }
}

namespace F {
  export type Call<T> =
    T extends (...a: never[]) => infer R ? R : never

  export type Arguments<T> =
    T extends (...a: infer A) => unknown ? A : never

  export namespace O2 {
    export type Arguments<T> =
      T extends {
        (...a: infer A1): unknown 
        (...a: infer A2): unknown 
      }
        ? A1 | A2
        : never
  }
}

namespace U {
  export type Extract<T, U> =
    T extends U ? T : never;
}



// ============================================================================
// Exports

export default create;
export
  { StateInitializer // create's argument
  , Store // create's result
  , UnknownState // Store's type-parameter's constraint
  }
