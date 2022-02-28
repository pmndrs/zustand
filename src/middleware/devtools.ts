import { GetState, PartialState, SetState, State, StoreApi } from '../vanilla'

declare module '../vanilla' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface StoreMutators<S, A> {
    'zustand/devtools': WithDevtools<S>
  }
}

type Write<T extends object, U extends object> = Omit<T, keyof U> & U
type Cast<T, U> = T extends U ? T : U

type WithDevtools<S> = Write<Cast<S, object>, StoreSetStateWithAction<S>> & {
  /**
   * @deprecated `devtools` property on the store is deprecated
   * it will be removed in the next major.
   * You shouldn't interact with the extension directly. But in case you still want to
   * you can patch `window.__REDUX_DEVTOOLS_EXTENSION__` directly
   */
  devtools?: DevtoolsType
}

type StoreSetStateWithAction<S> = S extends { getState: () => infer T }
  ? S & { setState: NamedSet<Cast<T, object>> }
  : never

interface DevtoolsOptions {
  name?: string
  anonymousActionType?: string
  serialize?:
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
        /**
         * @deprecated serialize.options is deprecated, just use serialize
         */
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
/**
 * @deprecated Use `Mutate<StoreApi<T>, [["zustand/devtools", never]]>`.
 * See tests/middlewaresTypes.test.tsx for usage with multiple middlewares.
 */
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

export function devtools<
  S extends State,
  CustomSetState extends SetState<S>,
  CustomGetState extends GetState<S>,
  CustomStoreApi extends StoreApi<S>
>(
  fn: (set: NamedSet<S>, get: CustomGetState, api: CustomStoreApi) => S
): (
  set: CustomSetState,
  get: CustomGetState,
  api: CustomStoreApi &
    StoreApiWithDevtools<S> & {
      dispatch?: unknown
      dispatchFromDevtools?: boolean
    }
) => S
/**
 * @deprecated Passing `name` as directly will be not allowed in next major.
 * Pass the `name` in an object `{ name: ... }` instead
 */
export function devtools<
  S extends State,
  CustomSetState extends SetState<S> = SetState<S>,
  CustomGetState extends GetState<S> = GetState<S>,
  CustomStoreApi extends StoreApi<S> = StoreApi<S>
>(
  fn: (set: NamedSet<S>, get: CustomGetState, api: CustomStoreApi) => S,
  options?: string
): (
  set: CustomSetState,
  get: CustomGetState,
  api: CustomStoreApi &
    StoreApiWithDevtools<S> & {
      dispatch?: unknown
      dispatchFromDevtools?: boolean
    }
) => S
export function devtools<
  S extends State,
  CustomSetState extends SetState<S>,
  CustomGetState extends GetState<S>,
  CustomStoreApi extends StoreApi<S>
>(
  fn: (set: NamedSet<S>, get: CustomGetState, api: CustomStoreApi) => S,
  options?: DevtoolsOptions
): (
  set: CustomSetState,
  get: CustomGetState,
  api: CustomStoreApi &
    StoreApiWithDevtools<S> & {
      dispatch?: unknown
      dispatchFromDevtools?: boolean
    }
) => S
export function devtools<
  S extends State,
  CustomSetState extends SetState<S>,
  CustomGetState extends GetState<S>,
  CustomStoreApi extends StoreApi<S>
>(
  fn: (set: NamedSet<S>, get: CustomGetState, api: CustomStoreApi) => S,
  options?: string | DevtoolsOptions
) {
  return (
    set: CustomSetState,
    get: CustomGetState,
    api: CustomStoreApi &
      StoreApiWithDevtools<S> & {
        dispatch?: unknown
        dispatchFromDevtools?: boolean
      }
  ): S => {
    let didWarnAboutNameDeprecation = false
    if (typeof options === 'string' && !didWarnAboutNameDeprecation) {
      console.warn(
        '[zustand devtools middleware]: passing `name` as directly will be not allowed in next major' +
          'pass the `name` in an object `{ name: ... }` instead'
      )
      didWarnAboutNameDeprecation = true
    }
    const devtoolsOptions =
      options === undefined
        ? { name: undefined, anonymousActionType: undefined }
        : typeof options === 'string'
        ? { name: options }
        : options
    if (typeof (devtoolsOptions as any)?.serialize?.options !== 'undefined') {
      console.warn(
        '[zustand devtools middleware]: `serialize.options` is deprecated, just use `serialize`'
      )
    }

    let extensionConnector
    try {
      extensionConnector =
        (window as any).__REDUX_DEVTOOLS_EXTENSION__ ||
        (window as any).top.__REDUX_DEVTOOLS_EXTENSION__
    } catch {
      // ignored
    }

    if (!extensionConnector) {
      if (__DEV__ && typeof window !== 'undefined') {
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
        return ''
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
      extension.send(
        nameOrAction === undefined
          ? { type: devtoolsOptions.anonymousActionType || 'anonymous' }
          : typeof nameOrAction === 'string'
          ? { type: nameOrAction }
          : nameOrAction,
        get()
      )
    }
    const setStateFromDevtools: SetState<S> = (...a) => {
      const originalIsRecording = isRecording
      isRecording = false
      set(...a)
      isRecording = originalIsRecording
    }

    const initialState = fn(api.setState, get, api)
    extension.init(initialState)

    if (api.dispatchFromDevtools && typeof api.dispatch === 'function') {
      let didWarnAboutReservedActionType = false
      const originalDispatch = api.dispatch
      api.dispatch = (...a: any[]) => {
        if (a[0].type === '__setState' && !didWarnAboutReservedActionType) {
          console.warn(
            '[zustand devtools middleware] "__setState" action type is reserved ' +
              'to set state from the devtools. Avoid using it.'
          )
          didWarnAboutReservedActionType = true
        }
        ;(originalDispatch as any)(...a)
      }
    }

    extension.subscribe((message: any) => {
      switch (message.type) {
        case 'ACTION':
          if (typeof message.payload !== 'string') {
            console.error(
              '[zustand devtools middleware] Unsupported action format'
            )
            return
          }
          return parseJsonThen<{ type: unknown; state?: PartialState<S> }>(
            message.payload,
            (action) => {
              if (action.type === '__setState') {
                setStateFromDevtools(action.state as PartialState<S>)
                return
              }

              if (!api.dispatchFromDevtools) return
              if (typeof api.dispatch !== 'function') return
              ;(api.dispatch as any)(action)
            }
          )

        case 'DISPATCH':
          switch (message.payload.type) {
            case 'RESET':
              setStateFromDevtools(initialState)
              return extension.init(api.getState())

            case 'COMMIT':
              return extension.init(api.getState())

            case 'ROLLBACK':
              return parseJsonThen<S>(message.state, (state) => {
                setStateFromDevtools(state)
                extension.init(api.getState())
              })

            case 'JUMP_TO_STATE':
            case 'JUMP_TO_ACTION':
              return parseJsonThen<S>(message.state, (state) => {
                setStateFromDevtools(state)
              })

            case 'IMPORT_STATE': {
              const { nextLiftedState } = message.payload
              const lastComputedState =
                nextLiftedState.computedStates.slice(-1)[0]?.state
              if (!lastComputedState) return
              setStateFromDevtools(lastComputedState)
              extension.send(null, nextLiftedState)
              return
            }

            case 'PAUSE_RECORDING':
              return (isRecording = !isRecording)
          }
          return
      }
    })

    return initialState
  }
}

const parseJsonThen = <T>(stringified: string, f: (parsed: T) => void) => {
  let parsed: T | undefined
  try {
    parsed = JSON.parse(stringified)
  } catch (e) {
    console.error(
      '[zustand devtools middleware] Could not parse the received json',
      e
    )
  }
  if (parsed !== undefined) f(parsed as T)
}
