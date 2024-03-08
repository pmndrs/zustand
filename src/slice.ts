import { type StoreApi } from './vanilla';
import { type NamedSet } from './middleware';

type FirstSetStateArg<T> = Parameters<StoreApi<T>['setState']>[0];
export type SetState<T> = (partial: FirstSetStateArg<T>, name?: string) => void;
export type GetState<T> = StoreApi<T>['getState'];

type StateObject = Record<string, any>;

type SliceKey<S extends StateObject> = {
  [K in keyof S]: S[K] extends S ? K : never;
}[keyof StateObject];

export const sliceGet = <S extends StateObject, K extends SliceKey<S>>(
  get: GetState<S>,
  key: K
): GetState<S[K]> => {
  return () => get()[key];
};

export const sliceSet = <S extends StateObject, K extends SliceKey<S>>(
  set: NamedSet<S>,
  key: K
): SetState<S[K]> => {
  /**
   * differs from global set in that the `replace` option is removed in
   * favor of a `name` optional arg.
   */
  return (partial: FirstSetStateArg<S[K]>, name?: string) => {
    const fullName = `${key}.${name ?? 'set'}`;
    set(
      (state) => {
        const nextState =
          typeof partial === 'function'
            ? (partial as (s: S[K]) => S[K])(state[key])
            : partial;

        return {
          [key]: {
            ...state[key],
            ...nextState
          }
        } as Partial<S>;
      },
      false,
      fullName
    );
  };
};

export type CreateSlice<Slice extends StateObject, AppState extends StateObject = StateObject> = (
  set: SetState<Slice>,
  get: GetState<Slice>,
  store: StoreApi<AppState>,
) => Slice;

export const slice =
  <S extends StateObject>(set: NamedSet<S>, get: GetState<S>, store: StoreApi<S>) =>
    <K extends SliceKey<S>>(k: K, init: CreateSlice<S[K], S>) =>
      init(sliceSet(set, k), sliceGet(get, k), store);

export default slice;
