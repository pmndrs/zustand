import {
  State,
  GetState,
  SetState,
  StoreApi,
  PartialState,
  StateCreator,
} from './vanilla'

export const redux = <S extends State, A extends { type: unknown }>(
  reducer: (state: S, action: A) => S,
  initial: S
) => (
  set: SetState<S>,
  get: GetState<S>,
  api: StoreApi<S> & {
    dispatch?: (a: A) => A
    devtools?: any
  }
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

type NamedSet<S extends State> = (
  partial: PartialState<S>,
  replace?: boolean,
  name?: string
) => void

export const devtools = <S extends State>(
  fn: (set: NamedSet<S>, get: GetState<S>, api: StoreApi<S>) => S,
  prefix?: string
) => (
  set: SetState<S>,
  get: GetState<S>,
  api: StoreApi<S> & { dispatch?: unknown; devtools?: any }
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
  const namedSet: NamedSet<S> = (state, replace, name) => {
    set(state, replace)
    if (!api.dispatch) {
      api.devtools.send(api.devtools.prefix + (name || 'action'), get())
    }
  }
  const initialState = fn(namedSet, get, api)
  if (!api.devtools) {
    const savedSetState = api.setState
    api.setState = (state: PartialState<S>, replace?: boolean) => {
      savedSetState(state, replace)
      api.devtools.send(api.devtools.prefix + 'setState', api.getState())
    }
    api.devtools = extension.connect({ name: prefix })
    api.devtools.prefix = prefix ? `${prefix} > ` : ''
    api.devtools.subscribe((message: any) => {
      if (message.type === 'DISPATCH' && message.state) {
        const ignoreState =
          message.payload.type === 'JUMP_TO_ACTION' ||
          message.payload.type === 'JUMP_TO_STATE'
        if (!api.dispatch && !ignoreState) {
          api.setState(JSON.parse(message.state))
        } else {
          savedSetState(JSON.parse(message.state))
        }
      }
    })
    api.devtools.init(initialState)
  }
  return initialState
}

export const combine = <
  PrimaryState extends State,
  SecondaryState extends State
>(
  initialState: PrimaryState,
  create: (
    set: SetState<PrimaryState>,
    get: GetState<PrimaryState>,
    api: StoreApi<PrimaryState>
  ) => SecondaryState
): StateCreator<PrimaryState & SecondaryState> => (set, get, api) =>
  Object.assign(
    {},
    initialState,
    create(
      set as SetState<PrimaryState>,
      get as GetState<PrimaryState>,
      api as StoreApi<PrimaryState>
    )
  )
