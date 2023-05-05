/**
 * @usage
 * const { bears } = useBearStore(createSelector('bears'))
 * const { bears, fishes } = useBearStore(createSelector('bears', 'fishes'))
 *
 * @param keys state keys
 * @returns selector fn, like (state) => ({ foo: state.foo })
 */
export function createSelector<T, K extends keyof T>(...keys: K[]) {
  return (state: T) => {
    const out: Pick<T, K> = {} as any
    keys.forEach((key) => {
      out[key] = state[key]
    })

    return out
  }
}
