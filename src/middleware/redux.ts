import { GetState, SetState, State, StoreApi } from '../vanilla'
import { NamedSet } from './devtools'

type DevtoolsType = {
  prefix: string
  subscribe: (dispatch: any) => () => void
  unsubscribe: () => void
  send: (action: string, state: any) => void
  init: (state: any) => void
  error: (payload: any) => void
}

export type StoreApiWithRedux<
  T extends State,
  A extends { type: unknown }
> = StoreApi<T & { dispatch: (a: A) => A }> & {
  dispatch: (a: A) => A
  dispatchFromDevtools: boolean
}

export const redux =
  <S extends State, A extends { type: unknown }>(
    reducer: (state: S, action: A) => S,
    initial: S
  ) =>
  (
    set: SetState<S & { dispatch: (a: A) => A }>,
    get: GetState<S & { dispatch: (a: A) => A }>,
    api: StoreApiWithRedux<S, A> & { devtools?: DevtoolsType }
  ): S & { dispatch: (a: A) => A } => {
    api.dispatch = (action: A) => {
      ;(set as NamedSet<S>)((state: S) => reducer(state, action), false, action)
      return action
    }
    api.dispatchFromDevtools = true

    return { dispatch: (...a) => api.dispatch(...a), ...initial }
  }
