import { StateCreator, StoreMutatorIdentifier } from '../vanilla'
import { NamedSet } from './devtools'

type Write<T, U> = Omit<T, keyof U> & U

type ReduxState<A> = {
  dispatch: StoreRedux<A>['dispatch']
}

type StoreRedux<A> = {
  dispatch: (a: A) => A
  dispatchFromDevtools: true
}

type WithRedux<S, A> = Write<S, StoreRedux<A>>

type Redux = <T, A, Cms extends [StoreMutatorIdentifier, unknown][] = []>(
  reducer: (state: T, action: A) => T,
  initialState: T
) => StateCreator<Write<T, ReduxState<A>>, Cms, [['zustand/redux', A]]>

declare module '../vanilla' {
  interface StoreMutators<S, A> {
    'zustand/redux': WithRedux<S, A>
  }
}

type PopArgument<T extends (...a: never[]) => unknown> = T extends (
  ...a: [...infer A, infer _]
) => infer R
  ? (...a: A) => R
  : never

type ReduxImpl = <T, A>(
  reducer: (state: T, action: A) => T,
  initialState: T
) => PopArgument<StateCreator<T & ReduxState<A>, [], []>>

const isObjectWithTypeProperty = (x: unknown): x is { type: unknown } =>
  x !== null && typeof x === 'object' && 'type' in x

const reduxImpl: ReduxImpl = (reducer, initial) => (set, _get, api) => {
  type S = typeof initial
  type A = Parameters<typeof reducer>[1]
  ;(api as any).dispatch = (action: A) => {
    ;(set as NamedSet<S>)(
      (state: S) => reducer(state, action),
      false,
      isObjectWithTypeProperty(action) ? action : { type: action }
    )
    return action
  }
  ;(api as any).dispatchFromDevtools = true

  return { dispatch: (...a) => (api as any).dispatch(...a), ...initial }
}
export const redux = reduxImpl as Redux
