import type { StateCreator, StoreMutatorIdentifier } from '../vanilla.ts'

export function ssrSafe<
  T extends object,
  U extends object,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
>(
  config: StateCreator<T, Mps, Mcs, U>,
  isSSR: boolean = typeof window === 'undefined',
): StateCreator<T, Mps, Mcs, U> {
  return (set, get, api) => {
    if (!isSSR) {
      return config(set, get, api)
    }
    const ssrSet = () => {
      throw new Error('Cannot set state of Zustand store in SSR')
    }
    api.setState = ssrSet
    return config(ssrSet as never, get, api)
  }
}
