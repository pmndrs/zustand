import type {} from '@redux-devtools/extension'
import { GetState, PartialState, SetState, State, StoreApi } from '../vanilla'

declare module '../vanilla' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface StoreMutators<S, A> {
    'zustand/devtools': WithDevtools<S>
  }
}

// FIXME https://github.com/reduxjs/redux-devtools/issues/1097
type Message = {
  type: string
  payload?: any
  state?: any
}

type Write<T extends object, U extends object> = Omit<T, keyof U> & U
type Cast<T, U> = T extends U ? T : U

type WithDevtools<S> = Write<Cast<S, object>, StoreSetStateWithAction<S>>

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
      }
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
  api: CustomStoreApi & StoreApiWithDevtools<S>
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
  api: CustomStoreApi & StoreApiWithDevtools<S>
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
  api: CustomStoreApi & StoreApiWithDevtools<S>
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
    api: CustomStoreApi & StoreApiWithDevtools<S>
  ): S => {
    const devtoolsOptions =
      options === undefined
        ? {}
        : typeof options === 'string'
        ? { name: options }
        : options

    let extensionConnector: typeof window['__REDUX_DEVTOOLS_EXTENSION__']
    try {
      extensionConnector = window.__REDUX_DEVTOOLS_EXTENSION__
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

    const extension = extensionConnector.connect(devtoolsOptions)

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

    if (
      (api as any).dispatchFromDevtools &&
      typeof (api as any).dispatch === 'function'
    ) {
      let didWarnAboutReservedActionType = false
      const originalDispatch = (api as any).dispatch
      ;(api as any).dispatch = (...a: any[]) => {
        if (
          __DEV__ &&
          a[0].type === '__setState' &&
          !didWarnAboutReservedActionType
        ) {
          console.warn(
            '[zustand devtools middleware] "__setState" action type is reserved ' +
              'to set state from the devtools. Avoid using it.'
          )
          didWarnAboutReservedActionType = true
        }
        ;(originalDispatch as any)(...a)
      }
    }

    ;(
      extension as unknown as {
        // FIXME https://github.com/reduxjs/redux-devtools/issues/1097
        subscribe: (
          listener: (message: Message) => void
        ) => (() => void) | undefined
      }
    ).subscribe((message) => {
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

              if (!(api as any).dispatchFromDevtools) return
              if (typeof (api as any).dispatch !== 'function') return
              ;(api as any).dispatch(action)
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
              extension.send(
                null as any, // FIXME no-any
                nextLiftedState
              )
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
