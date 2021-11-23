import { GetState, PartialState, SetState, State, StoreApi } from '../vanilla'

type DevtoolsType = {
  /**
   * @deprecated along with `api.devtools`, `api.devtools.prefix` is deprecated.
   * We no longer prefix the actions/names, because the `name` option already
   * creates a separate instance of devtools for each store.
   */
  prefix: string
  subscribe: (dispatch: any) => () => void
  unsubscribe: () => void
  send: {
    (action: string | { type: unknown }, state: any): void
    (action: null, liftedState: any): void
  }
  init: (state: any) => void
  error: (payload: any) => void
}

export type NamedSet<T extends State> = {
  <
    K1 extends keyof T,
    K2 extends keyof T = K1,
    K3 extends keyof T = K2,
    K4 extends keyof T = K3
  >(
    partial: PartialState<T, K1, K2, K3, K4>,
    replace?: boolean,
    name?: string | { type: unknown }
  ): void
}

export type StoreApiWithDevtools<T extends State> = StoreApi<T> & {
  setState: NamedSet<T>
  /**
   * @deprecated `devtools` property on the store is deprecated
   * it will be removed in the next major.
   * You shouldn't interact with the extension directly. But in case you still want to
   * you can patch `window.__REDUX_DEVTOOLS_EXTENSION__` directly
   */
  devtools?: DevtoolsType
}

export const devtools =
  <
    S extends State,
    CustomSetState extends SetState<S>,
    CustomGetState extends GetState<S>,
    CustomStoreApi extends StoreApi<S>
  >(
    fn: (set: NamedSet<S>, get: CustomGetState, api: CustomStoreApi) => S,
    options?:
      | string
      | {
          name?: string
          anonymousActionType?: string
          serialize?: {
            options:
              | boolean
              | {
                  date?: boolean
                  regex?: boolean
                  undefined?: boolean
                  nan?: boolean
                  infinity?: boolean
                  error?: boolean
                  symbol?: boolean
                  map?: boolean
                  set?: boolean
                }
          }
        }
  ) =>
  (
    set: CustomSetState,
    get: CustomGetState,
    api: CustomStoreApi &
      StoreApiWithDevtools<S> & {
        dispatch?: unknown
        dispatchFromDevtools?: boolean
      }
  ): S => {
    let devtoolsOptions =
      options === undefined
        ? { name: undefined }
        : typeof options === 'string'
        ? { name: options }
        : options

    let extensionConnector =
      (window as any).__REDUX_DEVTOOLS_EXTENSION__ ??
      (window as any).top.__REDUX_DEVTOOLS_EXTENSION__

    if (!extensionConnector) {
      if (
        process.env.NODE_ENV === 'development' &&
        typeof window !== 'undefined'
      ) {
        console.warn(
          '[zustand devtools middleware] Please install/enable Redux devtools extension'
        )
      }

      return fn(set, get, api)
    }

    let extension = Object.create(extensionConnector.connect(devtoolsOptions))
    // We're using `Object.defineProperty` to set `prefix`, so if extensionConnector.connect
    // returns the same reference we'd get cannot redefine property prefix error
    // hence we `Object.create` to make a new reference

    let didWarnAboutDevtools = false
    Object.defineProperty(api, 'devtools', {
      get: () => {
        if (!didWarnAboutDevtools) {
          console.warn(
            '[zustand devtools middleware] `devtools` property on the store is deprecated ' +
              'it will be removed in the next major.\n' +
              "You shouldn't interact with the extension directly. But in case you still want to " +
              'you can patch `window.__REDUX_DEVTOOLS_EXTENSION__` directly'
          )
          didWarnAboutDevtools = true
        }
        return extension
      },
      set: (value) => {
        if (!didWarnAboutDevtools) {
          console.warn(
            '[zustand devtools middleware] `api.devtools` is deprecated, ' +
              'it will be removed in the next major.\n' +
              "You shouldn't interact with the extension directly. But in case you still want to " +
              'you can patch `window.__REDUX_DEVTOOLS_EXTENSION__` directly'
          )
          didWarnAboutDevtools = true
        }
        extension = value
      },
    })

    let didWarnAboutPrefix = false
    Object.defineProperty(extension, 'prefix', {
      get: () => {
        if (!didWarnAboutPrefix) {
          console.warn(
            '[zustand devtools middleware] along with `api.devtools`, `api.devtools.prefix` is deprecated.\n' +
              'We no longer prefix the actions/names' +
              devtoolsOptions.name ===
              undefined
              ? ', pass the `name` option to create a separate instance of devtools for each store.'
              : ', because the `name` option already creates a separate instance of devtools for each store.'
          )
          didWarnAboutPrefix = true
        }
        return '';
      },
      set: () => {
        if (!didWarnAboutPrefix) {
          console.warn(
            '[zustand devtools middleware] along with `api.devtools`, `api.devtools.prefix` is deprecated.\n' +
              'We no longer prefix the actions/names' +
              devtoolsOptions.name ===
              undefined
              ? ', pass the `name` option to create a separate instance of devtools for each store.'
              : ', because the `name` option already creates a separate instance of devtools for each store.'
          )
          didWarnAboutPrefix = true
        }
      },
    })

    let isRecording = true
    ;(api.setState as NamedSet<S>) = (state, replace, nameOrAction) => {
      set(state, replace)
      if (!isRecording) return
      extension!.send(
        nameOrAction === undefined
          ? { type: devtoolsOptions.anonymousActionType ?? 'anonymous' } :
        typeof nameOrAction === 'string'
          ? { type: nameOrAction } :
        nameOrAction,
        get()
      )
    }
    const setStateFromDevtools: SetState<S> = (state, replace) => {
      isRecording = false
      if (!replace) {
        set(state)
      } else {
        let currentState = get()
        for (let k in currentState) {
          if (typeof currentState[k] === 'function') {
            ;(state as any)[k] = currentState[k]
          }
        }
        set(state, true)
      }
      isRecording = true
    }

    let initialState = fn(api.setState, get, api)
    extension!.init(initialState)

    extension!.subscribe((message: any) => {
      switch (message.type) {
        case 'ACTION':
          if (!api.dispatchFromDevtools) return
          if (typeof api.dispatch !== 'function') return
          return parseJsonThen(message.payload, api.dispatch as any)

        case 'DISPATCH':
          switch (message.payload.type) {
            case 'RESET':
              setStateFromDevtools(initialState, true)
              return extension!.init(initialState)

            case 'COMMIT':
              return extension!.init(api.getState())

            case 'ROLLBACK':
              return parseJsonThen<S>(message.state, (state) => {
                setStateFromDevtools(state, true)
                extension!.init(state)
              })

            case 'JUMP_TO_STATE':
            case 'JUMP_TO_ACTION':
              return parseJsonThen<S>(message.state, (state) => {
                setStateFromDevtools(state, true)
              })

            case 'IMPORT_STATE':
              let { nextLiftedState } = message.payload
              let lastComputedState =
                nextLiftedState.computedStates.at(-1)?.state
              if (!lastComputedState) return
              setStateFromDevtools(lastComputedState, true)
              extension!.send(null, nextLiftedState)
              return

            case 'PAUSE_RECORDING':
              return (isRecording = !isRecording)
          }
          return
      }
    })

    return initialState
  }

const parseJsonThen = <T>(stringified: string, f: (parsed: T) => void) => {
  let parsed: T | undefined
  let didParse = true
  try {
    parsed = JSON.parse(stringified)
  } catch (e) {
    console.error(
      '[zustand devtools middleware] Could not parse the received json',
      e
    )
    didParse = false
  }
  if (didParse) f(parsed as T)
}
