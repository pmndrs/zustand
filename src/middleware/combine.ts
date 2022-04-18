import { State, StateCreator, StoreMutatorIdentifier } from '../vanilla'

type Write<T, U> = Omit<T, keyof U> & U

type Combine = <
  T extends State,
  U extends State,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = []
>(
  initialState: T,
  additionalStateCreator: StateCreator<T, Mps, Mcs, U>
) => StateCreator<Write<T, U>, Mps, Mcs>

export const combine: Combine =
  (initialState, create) =>
  (...a) =>
    Object.assign({}, initialState, (create as any)(...a))
