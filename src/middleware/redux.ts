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
  , isReduxLike: true
  }


// ============================================================================
// Implementation

const redux: Redux = (reducer, initialState) => (parentSet, parentGet, parentStore) => {
  type A = F.Arguments<typeof reducer>[1]

  let store = parentStore as typeof parentStore & ReduxStore<A>
  store.isReduxLike = true;
  store.dispatch = a => {
    parentSet(reducer(parentGet(), a), false)
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
}

// ============================================================================
// Exports

export { redux, ReduxStore, UnknownAction }
