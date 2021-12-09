import { StoreInitializer, UnknownState, Store } from '../vanilla'

// ============================================================================
// Types

type Redux =
  < T extends UnknownState
  , A extends UnknownAction
  , S extends Store<T & ReduxState<A>>
  >
    ( reducer: (state: T, action: A) => T
    , initialState: T
    ) =>
      & StoreInitializer<T & ReduxState<A>, S & ReduxStore<A>>

type ReduxState<A extends UnknownAction> =
  { dispatch: ReduxStore<A>['dispatch'] }

type UnknownAction =
  { type: unknown }

type ReduxStore<A extends UnknownAction> =
  { dispatch: (a: A) => A
  , dispatchFromDevtools: true
  }


// ============================================================================
// Implementation

const redux: Redux = (reducer, initialState) => (_parentSet, parentGet, parentStore) => {
  type A = F.Arguments<typeof reducer>[1]

  const store = parentStore as typeof parentStore & ReduxStore<A>
  store.dispatchFromDevtools = true;

  const parentSet = _parentSet as F.WidenArguments<typeof _parentSet>
  store.dispatch = a => {
    parentSet(reducer(parentGet(), a), false, a)
    return a;
  }

  return { ...initialState, dispatch: store.dispatch }
}

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
}

// ============================================================================
// Exports

export { redux, ReduxStore, UnknownAction }
