import { StoreInitializer, UnknownState, StoreMutatorIdentifier } from '../vanilla'

// ============================================================================
// Types

type ReduxMiddleware =
  < T extends UnknownState
  , A extends UnknownAction
  , Cms extends [StoreMutatorIdentifier, unknown][] = []
  >
    ( reducer: (state: T, action: A) => T
    , initialState: T
    ) =>
      StoreInitializer<O.Overwrite<T, ReduxState<A>>, Cms, [[$$redux, A]]>

declare const $$redux: unique symbol;
type $$redux = typeof $$redux;        

declare module '../vanilla' {
  interface StoreMutators<S, A>
    { [$$redux]: WithRedux<S, A>
    }
}

type WithRedux<S, A> =
  O.Overwrite<
    A.Cast<S, O.Unknown>,
    Redux<A.Cast<A, UnknownAction>>
  >

type ReduxState<A extends UnknownAction> =
  { dispatch: Redux<A>['dispatch'] }

type UnknownAction =
  { type: unknown }

type Redux<A extends UnknownAction> =
  { dispatch: (a: A) => A
  , dispatchFromDevtools: true
  }


// ============================================================================
// Implementation

type EState = { __isState: true }
type EAction = UnknownAction & { __isAction: true }

type ERedux = 
  ( reducer: (state: EState, action: EAction) => EState
  , initialState: EState
  ) =>
    EStoreInitializer

type EStoreInitializer =
  F.PopArgument<StoreInitializer<EState & ReduxState<EAction>, [], []>>

const reduxImpl: ERedux = (reducer, initialState) => (_parentSet, parentGet, parentStore) => {
  type A = F.Arguments<typeof reducer>[1]

  const store = parentStore as typeof parentStore & Redux<A>
  store.dispatchFromDevtools = true;

  const parentSet = _parentSet as F.WidenArguments<typeof _parentSet>
  store.dispatch = a => {
    parentSet(reducer(parentGet(), a), false, a)
    return a;
  }

  return { ...initialState, dispatch: store.dispatch }
}
const redux = reduxImpl as unknown as ReduxMiddleware;

// ============================================================================
// Utilities

namespace F {
  export type Unknown =
    (...a: never[]) => unknown

  export type Arguments<T extends F.Unknown> =
    T extends (...a: infer A) => unknown ? A : never

  export type WidenArguments<T extends F.Unknown> =
    T extends (...a: infer A) => infer R
      ? (...a: [...A, ...unknown[]]) => R
      : never

  export type PopArgument<T extends F.Unknown> =
    T extends (...a: [...infer A, infer _]) => infer R
      ? (...a: A) => R
      : never
}

namespace O {
  export type Unknown =
    object

  export type ExcludeKey<T extends O.Unknown, K extends keyof T> =
    { [P in U.Exclude<keyof T, K>]: T[P]
    }

  export type Overwrite<T extends O.Unknown, U extends O.Unknown> =
    & O.ExcludeKey<T, U.Extract<keyof U, keyof T>>
    & U
}

namespace U {
  export type Exclude<T, U> =
    T extends U ? never : T

  export type Extract<T, U> =
    T extends U ? T : never
}

// Bug in eslint, we are using A just in the module augmentation
namespace A { // eslint-disable-line @typescript-eslint/no-unused-vars
  export type Cast<T, U> = T extends U ? T : U;
}
// ============================================================================
// Exports

export { redux, Redux, UnknownAction }
