import type { StateCreator, StoreMutatorIdentifier } from '../vanilla'
import type { NamedSet } from './devtools'

type FeatureEventMap = Record<string, EventName>
type Separator = '/'
type EventName = Record<string, unknown>

// Credit given [here](https://stackoverflow.com/a/50375286/648789).
// prettier-ignore
type UnionToIntersection<U> =
  (U extends any ? (k: U) => void : never) extends ((k: infer I) => void)
    ? I
    : never;

type PayloadOptionalIfUndefined<TA> = TA extends ActionTypes<infer A>
  ? A extends { type: infer T; payload: undefined }
    ? { type: T; payload?: undefined }
    : TA
  : TA

type ActionsIndex<
  Type extends FeatureEventMap,
  FeatureKey extends keyof Type = ''
> = FeatureKey extends keyof Type
  ? {
      [EventKey in keyof Type[FeatureKey] as `${string &
        FeatureKey}${Separator}${string &
        EventKey}`]: Type[FeatureKey][EventKey]
    }
  : ActionsIndex<Type, keyof Type>

type ActionsIntersect<Type extends FeatureEventMap> = UnionToIntersection<
  ActionsIndex<Type>
>

/**
 * To enforce typings for an `action` parameter of a `reducer` or `dispatch`.
 *
 * By doing so, conditional expressions evalutating the `type` property of `action` type, will have the `payload` type
 * infered in the block scope of condition.
 *
 * For more information, see '[Flux like patterns / "dispatching" actions](https://github.com/pmndrs/zustand/blob/main/docs/guides/flux-inspired-practice.md)' section of docs.
 *
 * Credit given [here](https://stackoverflow.com/questions/73792053/typescript-argument-type-from-a-previous-argument-value).
 */
export type ReduxAction<Type extends FeatureEventMap> = {
  [FeatureEvent in keyof ActionsIntersect<Type>]: {
    type: FeatureEvent
    payload: ActionsIntersect<Type>[FeatureEvent]
  }
}[keyof ActionsIntersect<Type>]

type Write<T, U> = Omit<T, keyof U> & U

type Action = { type: unknown }

type ActionTypes<A> = A extends ReduxAction<infer T> ? ReduxAction<T> : A

type StoreRedux<A> = {
  dispatch: (a: PayloadOptionalIfUndefined<ActionTypes<A>>) => ActionTypes<A>

  dispatchFromDevtools: true
}

type ReduxState<A> = {
  dispatch: StoreRedux<A>['dispatch']
}

type WithRedux<S, A> = Write<S, StoreRedux<A>>

type Redux = <
  T,
  A extends Action,
  Cms extends [StoreMutatorIdentifier, unknown][] = []
>(
  reducer: (state: T, action: ActionTypes<A>) => T,
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

type ReduxImpl = <T, A extends Action>(
  reducer: (state: T, action: ActionTypes<A>) => T,
  initialState: T
) => PopArgument<StateCreator<T & ReduxState<A>, [], []>>

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
