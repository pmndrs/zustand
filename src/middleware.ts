const redux = (reducer: any, initial: any) => (
  set: any,
  get: any,
  api: any
) => {
  api.dispatch = (action: any) => {
    set((state: any) => reducer(state, action))
    const actionWithPrefix = {
      ...action,
      type: api.devtools.prefix + action.type
    } 
    api.devtools && api.devtools.send(actionWithPrefix, get())
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
  let ignoreState = false

  if (!extension) {
    console.warn('Please install/enable Redux devtools extension')
    api.devtools = null
    return fn(set, get, api)
  } else {
    const initialState = fn(set, get, api)
    if (!api.devtools) {
      api.devtools = extension.connect()
      api.devtools.prefix = prefix ? `${prefix} > ` : ''
      api.devtools.subscribe((message: any) => {
        if (message.type === 'DISPATCH' && message.state) {
          ignoreState =
            message.payload.type === 'JUMP_TO_ACTION' ||
            message.payload.type === 'JUMP_TO_STATE'
          set(JSON.parse(message.state), true)
        }
      })
      api.devtools.init(initialState)
      if (!initialState.dispatch) {
        api.subscribe((state: any) => {
          if (!ignoreState) {
            api.devtools.send(api.devtools.prefix + 'setState', state)
          } else {
            ignoreState = false
          }
        })
      }
    }
    return initialState
  }
}

export { devtools, redux }
