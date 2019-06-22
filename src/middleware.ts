const redux = (reducer: any, initial: any) => (
  set: any,
  get: any,
  api: any
) => {
  api.dispatch = (action: any) => {
    set((state: any) => reducer(state, action))
    api.devtools && api.devtools.send(action, get())
    return action
  }
  return { dispatch: api.dispatch, ...initial }
}

const devtools = (fn: any) => (set: any, get: any, api: any) => {
  let extension =
    (<any>window).__REDUX_DEVTOOLS_EXTENSION__ ||
    (<any>window).top.__REDUX_DEVTOOLS_EXTENSION__
  let ignoreState = false

  if (!extension) {
    console.warn('Please install/enable Redux devtools extension')
    api.devtools = null
    return fn(set, get, api)
  } else {
    const initialState = fn(set, get, api)
    if (!api.devtools) {
      api.devtools = extension.connect()
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
            api.devtools.send('setState', state)
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
