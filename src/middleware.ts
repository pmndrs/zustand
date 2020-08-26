import type {
  State,
  GetState,
  SetState,
  StoreApi,
  PartialState,
} from './vanilla'

const redux = <S extends State, A extends { type: unknown }>(
  reducer: (state: S, action: A) => S,
  initial: S
) => (
  set: SetState<S & { dispatch: (a: A) => A }>,
  get: GetState<S & { dispatch: (a: A) => A }>,
  api: StoreApi<S & { dispatch: (a: A) => A }> & {
    dispatch?: (a: A) => A
    devtools?: any
  }
): S & { dispatch: (a: A) => A } => {
  api.dispatch = (action: A) => {
    set((state: S) => reducer(state, action))
    api.devtools && api.devtools.send(api.devtools.prefix + action.type, get())
    return action
  }
  return { dispatch: api.dispatch, ...initial }
}

const devtools = <S extends State>(
  fn: (
    set: (partial: PartialState<S>, replace?: boolean, name?: string) => void,
    get: GetState<S>,
    api: StoreApi<S>
  ) => S,
  prefix?: string
) => (
  set: SetState<S>,
  get: GetState<S>,
  api: StoreApi<S> & { devtools?: any }
): S => {
  let extension
  try {
    extension =
      (window as any).__REDUX_DEVTOOLS_EXTENSION__ ||
      (window as any).top.__REDUX_DEVTOOLS_EXTENSION__
  } catch {}

  if (!extension) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Please install/enable Redux devtools extension')
    }
    api.devtools = null
    return fn(set, get, api)
  }
  const namedSet = (
    state: PartialState<S>,
    replace?: boolean,
    name?: string | false
  ) => {
    set(state, replace)
    if (name !== false) {
      api.devtools.send(api.devtools.prefix + (name || 'action'), get())
    }
  }
  const initialState = fn(namedSet, get, api)
  if (!api.devtools) {
    api.devtools = extension.connect({ name: prefix })
    api.devtools.prefix = prefix ? `${prefix} > ` : ''
    api.devtools.subscribe((message: any) => {
      if (message.type === 'DISPATCH' && message.state) {
        const ignoreState =
          message.payload.type === 'JUMP_TO_ACTION' ||
          message.payload.type === 'JUMP_TO_STATE'
        namedSet(
          JSON.parse(message.state),
          false,
          !initialState.dispatch && !ignoreState && 'setState'
        )
      }
    })
    api.devtools.init(initialState)
  }
  return initialState
}

export { devtools, redux }
