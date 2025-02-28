import type { StateCreator, StoreMutatorIdentifier } from '../vanilla.ts'

type Write<T, U> = Omit<T, keyof U> & U

export function combine<
  T extends object,
  U extends object,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
>(
  initialState: T,
  create: StateCreator<T, Mps, Mcs, U>,
): StateCreator<Write<T, U>, Mps, Mcs> {
  return (...args) => Object.assign({}, initialState, (create as any)(...args))
}
