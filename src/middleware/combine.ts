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
    , additionalStateCreator: StoreInitializer<Write<T, U>, Mps, Mcs, U>
    ) =>
      StoreInitializer<Write<T, U>, Mps, Mcs>

// ============================================================================
// Implementation

const combine: Combine = (initialState, additionalStateCreator) => (...a) =>
  overwrite(
    initialState,
    additionalStateCreator(...a)
  )


// ============================================================================
// Utilities

const overwrite = <T extends object, U extends object>(t: T, u: U) =>
  Object.assign({}, t, u) as Write<T, U>

export type Write<T extends object, U extends object> =
  Omit<T, keyof U> & U

// ============================================================================
// Exports

export { combine }