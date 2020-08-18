const redux = (reducer: any, initial: any) => (
  set: any,
  get: any,
  api: any
) => {
  api.dispatch = (action: any) => {
    set((state: any) => reducer(state, action))
    api.devtools && api.devtools.send(api.devtools.prefix + action.type, get())
    return action
  }
  return { dispatch: api.dispatch, ...initial }
}

const devtools = (fn: any, prefix?: string) => (
  set: any,
  get: any,
  api: any
) => {
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
  const namedSet = (state: any, name?: any) => {
    set(state)
    if (name) {
      api.devtools.send(api.devtools.prefix + name, get())
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
          !initialState.dispatch && !ignoreState && 'setState'
        )
      }
    })
    api.devtools.init(initialState)
  }
  return initialState
}

export { devtools, redux }
