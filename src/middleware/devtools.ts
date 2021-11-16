import { GetState, PartialState, SetState, State, StoreApi } from '../vanilla'

const DEVTOOLS = Symbol()

type DevtoolsType = {
  prefix: string
  subscribe: (dispatch: any) => () => void
  unsubscribe: () => void
  send: (action: string, state: any) => void
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
    name?: string
  ): void
}

export type StoreApiWithDevtools<T extends State> = StoreApi<T> & {
  setState: NamedSet<T>
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
    api: CustomStoreApi & StoreApiWithDevtools<S> & { dispatch?: unknown }
  ): S => {
    let extension
    try {
      extension =
        (window as any).__REDUX_DEVTOOLS_EXTENSION__ ||
        (window as any).top.__REDUX_DEVTOOLS_EXTENSION__
    } catch {}

    if (!extension) {
      if (
        process.env.NODE_ENV === 'development' &&
        typeof window !== 'undefined'
      ) {
        console.warn('Please install/enable Redux devtools extension')
      }
      delete api.devtools
      return fn(set, get, api)
    }
    const namedSet: NamedSet<S> = (state, replace, name) => {
      set(state, replace)
      if (!api.dispatch && api.devtools) {
        api.devtools.send(api.devtools.prefix + (name || 'action'), get())
      }
    }
    api.setState = namedSet
    const initialState = fn(namedSet, get, api)
    if (!api.devtools) {
      const savedSetState = api.setState
      api.setState = <
        K1 extends keyof S = keyof S,
        K2 extends keyof S = K1,
        K3 extends keyof S = K2,
        K4 extends keyof S = K3
      >(
        state: PartialState<S, K1, K2, K3, K4>,
        replace?: boolean
      ) => {
        const newState = api.getState()
        if (state !== newState) {
          savedSetState(state, replace)
          if (state !== (newState as any)[DEVTOOLS] && api.devtools) {
            api.devtools.send(api.devtools.prefix + 'setState', api.getState())
          }
        }
      }
      options = typeof options === 'string' ? { name: options } : options
      const connection = (api.devtools = extension.connect({ ...options }))
      connection.prefix = options?.name ? `${options.name} > ` : ''
      connection.subscribe((message: any) => {
        if (message.type === 'ACTION' && message.payload) {
          try {
            api.setState(JSON.parse(message.payload))
          } catch (e) {
            console.error(
              'please dispatch a serializable value that JSON.parse() support\n',
              e
            )
          }
        } else if (message.type === 'DISPATCH' && message.state) {
          const jumpState =
            message.payload.type === 'JUMP_TO_ACTION' ||
            message.payload.type === 'JUMP_TO_STATE'
          const newState = api.getState()
          ;(newState as any)[DEVTOOLS] = JSON.parse(message.state)

          if (!api.dispatch && !jumpState) {
            api.setState(newState)
          } else if (jumpState) {
            api.setState((newState as any)[DEVTOOLS])
          } else {
            savedSetState(newState)
          }
        } else if (
          message.type === 'DISPATCH' &&
          message.payload?.type === 'COMMIT'
        ) {
          connection.init(api.getState())
        } else if (
          message.type === 'DISPATCH' &&
          message.payload?.type === 'IMPORT_STATE'
        ) {
          const actions = message.payload.nextLiftedState?.actionsById
          const computedStates =
            message.payload.nextLiftedState?.computedStates || []

          computedStates.forEach(
            ({ state }: { state: PartialState<S> }, index: number) => {
              const action = actions[index] || 'No action found'

              if (index === 0) {
                connection.init(state)
              } else {
                savedSetState(state)
                connection.send(action, api.getState())
              }
            }
          )
        }
      })
      connection.init(initialState)
    }
    return initialState
  }
