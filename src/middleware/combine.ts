import { UnknownState, StoreInitializer, StoreMutatorIdentifier } from '../vanilla'

// ============================================================================
// Types

type Combine =
  < T extends UnknownState
  , U extends UnknownState
  , Mps extends [StoreMutatorIdentifier, unknown][] = []
  , Mcs extends [StoreMutatorIdentifier, unknown][] = []
  >
    ( initialState: T
    , additionalStateCreator: StoreInitializer<O.Overwrite<T, U>, Mps, Mcs, U>
    ) =>
      StoreInitializer<O.Overwrite<T, U>, Mps, Mcs>

// ============================================================================
// Implementation

const combine: Combine = (initialState, additionalStateCreator) => (...a) =>
  overwrite(
    initialState,
    additionalStateCreator(...a)
  )


// ============================================================================
// Utilities

const overwrite = <T extends O.Unknown, U extends O.Unknown>(t: T, u: U) =>
  Object.assign({}, t, u) as O.Overwrite<T, U>

namespace O {
  export type Unknown =
    object

  export type Overwrite<T extends O.Unknown, U extends O.Unknown> =
    & ExcludeKey<T, U.Extract<keyof U, keyof T>>
    & U

  export type ExcludeKey<T extends O.Unknown, K extends keyof T> =
    { [P in U.Exclude<keyof T, K>]?:
        T[P]
    }
}

namespace U {
  export type Exclude<T, U> =
    T extends U ? never : U

  export type Extract<T, U> =
    T extends U ? T : never
}


// ============================================================================
// Exports

export { combine }