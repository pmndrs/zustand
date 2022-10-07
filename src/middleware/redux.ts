import type { StateCreator, StoreMutatorIdentifier } from '../vanilla'
import type { NamedSet } from './devtools'

type Write<T, U> = Omit<T, keyof U> & U

type Action = { type: unknown }

type StoreRedux<AIn, AOut> = {
  dispatch: (a: AIn) => AOut
  dispatchFromDevtools: true
}

type ReduxState<AIn, AOut> = {
  dispatch: StoreRedux<AIn, AOut>['dispatch']
}

type WithRedux<S, A> = A extends [unknown, unknown]
  ? Write<S, StoreRedux<A[0], A[1]>>
  : never

type Redux = <
  T,
  AIn extends Action,
  AOut = AIn,
  Cms extends [StoreMutatorIdentifier, unknown][] = []
>(
  reducer: (state: T, action: AIn) => T,
  initialState: T
) => StateCreator<
  Write<T, ReduxState<AIn, AOut>>,
  Cms,
  [['zustand/redux', [AIn, AOut]]]
>

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

type ReduxImpl = <T, AIn extends Action, AOut = AIn>(
  reducer: (state: T, action: AIn) => T,
  initialState: T
) => PopArgument<StateCreator<T & ReduxState<AIn, AOut>, [], []>>

const reduxImpl: ReduxImpl = (reducer, initial) => (set, _get, api) => {
  type S = typeof initial
  type A = Parameters<typeof reducer>[1]
  ;(api as any).dispatch = (action: A) => {
    ;(set as NamedSet<S>)((state: S) => reducer(state, action), false, action)
    return action
  }
  ;(api as any).dispatchFromDevtools = true

  return { dispatch: (...a) => (api as any).dispatch(...a), ...initial }
}
export const redux = reduxImpl as Redux
