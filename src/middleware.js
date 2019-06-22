const redux = (reducer, initial) => (set, get, api) => {
  api.dispatch = action => {
    set(state => reducer(state, action))
    api.devtools && api.devtools.send(action, get())
    return action
  }
  return { dispatch: api.dispatch, ...initial }
}

const devtools = fn => (set, get, api) => {
  var extension =
    window.__REDUX_DEVTOOLS_EXTENSION__ ||
    window.top.__REDUX_DEVTOOLS_EXTENSION__
  var ignoreState = false

  if (!extension) {
    console.warn('Please install/enable Redux devtools extension')
    api.devtools = null
    return fn(set, get, api)
  } else {
    const initialState = fn(set, get, api)
    if (!api.devtools) {
      api.devtools = extension.connect()
      api.devtools.subscribe(function(message) {
        if (message.type === 'DISPATCH' && message.state) {
          ignoreState =
            message.payload.type === 'JUMP_TO_ACTION' ||
            message.payload.type === 'JUMP_TO_STATE'
          set(JSON.parse(message.state), true)
        }
      })
      api.devtools.init(initialState)
      if (!initialState.dispatch) {
        api.subscribe(state => {
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
