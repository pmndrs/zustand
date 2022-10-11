import type { StateCreator, StoreMutatorIdentifier } from '../vanilla'
import type { NamedSet } from './devtools'

type Write<T, U> = Omit<T, keyof U> & U

type LitObjAction = {
  type: unknown
} & Partial<{ [key: string]: unknown }>
type TupleAction = [unknown, unknown?]
type Action = LitObjAction | TupleAction
type Tupleize<T> = T extends LitObjAction
  ? [T]
  : T extends TupleAction
  ? T
  : never

type StoreRedux<AIn, AOut> = {
  dispatch: (...a: Tupleize<AIn>) => AOut

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
  reducer: (state: T, action: Required<AIn>) => T,
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
  reducer: (state: T, action: Required<AIn>) => T,
  initialState: T
) => PopArgument<StateCreator<T & ReduxState<AIn, AOut>, [], []>>

const reduxImpl: ReduxImpl = (reducer, initial) => (set, _get, api) => {
  type S = typeof initial
  ;(api as any).dispatch = <A>(...action: Tupleize<A>) => {
    let actionOut: any = action

    const isLitObjAction = (arg: any): arg is [LitObjAction] =>
      Array.isArray(arg) && arg.length === 1 && arg[0] instanceof Object

    if (isLitObjAction(action)) {
      actionOut = action.pop()
    }

    ;(set as NamedSet<S>)(
      (state: S) => reducer(state, actionOut),
      false,
      actionOut
    )

    return actionOut
  }
  ;(api as any).dispatchFromDevtools = true

  return {
    dispatch: <A>(...a: Tupleize<A>) => (api as any).dispatch(...a),
    ...initial,
  }
}
export const redux = reduxImpl as Redux
