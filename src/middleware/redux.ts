import {
  StoreInitializer,
  UnknownState,
  StoreMutatorIdentifier,
} from '../vanilla'

// ============================================================================
// Types

type ReduxMiddleware = <
  T extends UnknownState,
  A extends UnknownAction,
  Cms extends [StoreMutatorIdentifier, unknown][] = []
>(
  reducer: (state: T, action: A) => T,
  initialState: T
) => StoreInitializer<Write<T, ReduxState<A>>, Cms, [[$$redux, A]]>

const $$redux = Symbol('$$redux')
type $$redux = typeof $$redux

declare module '../vanilla' {
  interface StoreMutators<S, A> {
    [$$redux]: WithRedux<S, A>
  }
}

type WithRedux<S, A> = Write<
  Extract<S, UnknownState>,
  Redux<Extract<A, UnknownAction>>
>

interface ReduxState<A extends UnknownAction> {
  dispatch: Redux<A>['dispatch']
}

interface UnknownAction {
  type: unknown
}

interface Redux<A extends UnknownAction> {
  dispatch: (a: A) => A
  dispatchFromDevtools: true
}

// ============================================================================
// Implementation

type T = { __isState: true }
type ActionImpl = UnknownAction & { __isAction: true }

type ReduxImpl = (
  reducer: (state: T, action: ActionImpl) => T,
  initialState: T
) => StoreInitializerImpl

type StoreInitializerImpl = PopArgument<
  StoreInitializer<T & ReduxState<ActionImpl>, [], []>
>

const reduxImpl: ReduxImpl =
  (reducer, initialState) => (_parentSet, parentGet, parentStore) => {
    type A = Parameters<typeof reducer>[1]

    const store = parentStore as typeof parentStore & Redux<A>
    store.dispatchFromDevtools = true

    const parentSet = _parentSet as WidenArguments<typeof _parentSet>
    store.dispatch = (a) => {
      parentSet(reducer(parentGet(), a), false, a)
      return a
    }

    return { ...initialState, dispatch: store.dispatch }
  }
const redux = reduxImpl as unknown as ReduxMiddleware

// ============================================================================
// Utilities
type WidenArguments<T extends (...a: never[]) => unknown> = T extends (
  ...a: infer A
) => infer R
  ? (...a: [...A, ...unknown[]]) => R
  : never

type PopArgument<T extends (...a: never[]) => unknown> = T extends (
  ...a: [...infer A, infer _]
) => infer R
  ? (...a: A) => R
  : never

type Write<T extends object, U extends object> = Omit<T, keyof U> & U

// ============================================================================
// Exports

export { redux, Redux, UnknownAction, $$redux, WithRedux }
