import { GetState, SetState, State, StoreApi } from '../vanilla'

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
      set((state: S) => reducer(state, action))
      if (api.devtools) {
        api.devtools.send(api.devtools.prefix + action.type, get())
      }
      return action
    }
    return { dispatch: api.dispatch, ...initial }
  }
