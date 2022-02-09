import { State, StateCreator, StoreMutatorIdentifier } from '../vanilla'
import { NamedSet } from './devtools'

type Redux = <
  T extends State,
  A extends Action,
  Cms extends [StoreMutatorIdentifier, unknown][] = []
>(
  reducer: (state: T, action: A) => T,
  initialState: T
) => StateCreator<Write<T, ReduxState<A>>, Cms, [['zustand/redux', A]]>

declare module '../vanilla' {
  interface StoreMutators<S, A> {
    'zustand/redux': WithRedux<S, A>
  }
}

type WithRedux<S, A> = Write<Extract<S, State>, StoreRedux<Extract<A, Action>>>

interface ReduxState<A extends Action> {
  dispatch: StoreRedux<A>['dispatch']
}

interface Action {
  type: unknown
}

interface StoreRedux<A extends Action> {
  dispatch: (a: A) => A
  dispatchFromDevtools: true
}

type PopArgument<T extends (...a: never[]) => unknown> = T extends (
  ...a: [...infer A, infer _]
) => infer R
  ? (...a: A) => R
  : never

type Write<T extends object, U extends object> = Omit<T, keyof U> & U

type ReduxImpl = <T extends State, A extends Action>(
  reducer: (state: T, action: A) => T,
  initialState: T
) => PopArgument<StateCreator<T & ReduxState<A>, [], []>>

const reduxImpl: ReduxImpl = (reducer, initial) => (set, get, api) => {
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
