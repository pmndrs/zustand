import {
  PartialState,
  SetState,
  State,
  StateCreator,
  StoreApi,
  StoreMutatorIdentifier,
} from '../vanilla'

type DevtoolsType = {
  subscribe: (dispatch: any) => () => void
  unsubscribe: () => void
  send: {
    (action: string | { type: unknown }, state: any): void
    (action: null, liftedState: any): void
  }
  init: (state: any) => void
  error: (payload: any) => void
}

type Devtools = <
  T extends State,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
  U = Partial<T>
>(
  initializer: StateCreator<T, [...Mps, ['zustand/devtools', unknown]], Mcs>,
  options?: DevtoolsOptions
) => StateCreator<T, Mps, [['zustand/devtools', U], ...Mcs]>

declare module '../vanilla' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface StoreMutators<S, A> {
    'zustand/devtools': WithDevtools<S>
  }
}

interface DevtoolsOptions {
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

export type WithDevtools<S> = Write<
  Extract<S, object>,
  StoreSetStateWithAction<S>
>

type StoreSetStateWithAction<S> = S extends {
  setState: (...a: infer A) => infer R
}
  ? {
      setState: (...a: [...a: A, actionType?: string | { type: unknown }]) => R
    }
  : never

type DevtoolsImpl = <T extends State>(
  storeInitializer: PopArgument<StateCreator<T, [], []>>,
  options: DevtoolsOptions
) => PopArgument<StateCreator<T, [], []>>

type PopArgument<T extends (...a: never[]) => unknown> = T extends (
  ...a: [...infer A, infer _]
) => infer R
  ? (...a: A) => R
  : never

type Write<T extends object, U extends object> = Omit<T, keyof U> & U

export type NamedSet<T extends State> = WithDevtools<StoreApi<T>>['setState']

export type StoreApiWithDevtools<T extends State> = WithDevtools<StoreApi<T>>

const devtoolsImpl: DevtoolsImpl = (fn, options) => (set, get, api) => {
  type S = ReturnType<typeof fn>

  const devtoolsOptions =
    options === undefined
      ? { name: undefined, anonymousActionType: undefined }
      : typeof options === 'string'
      ? { name: options }
      : options

  if (typeof window === 'undefined') {
    return fn(set, get, api)
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

  const extension = extensionConnector.connect(devtoolsOptions) as DevtoolsType

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
    isRecording = false
    set(...a)
    isRecording = true
  }

  const initialState = fn(api.setState, get, api)
  extension.init(initialState)

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
            extension.send(null, nextLiftedState)
            return
          }

          case 'PAUSE_RECORDING':
            return (isRecording = !isRecording)
        }
        return
    }
  })

  if (
    (api as any).dispatchFromDevtools &&
    typeof (api as any).dispatch === 'function'
  ) {
    let didWarnAboutReservedActionType = false
    const originalDispatch = ((api as any).dispatch(api as any).dispatch = (
      ...a: any[]
    ) => {
      if (a[0].type === '__setState' && !didWarnAboutReservedActionType) {
        console.warn(
          '[zustand devtools middleware] "__setState" action type is reserved ' +
            'to set state from the devtools. Avoid using it.'
        )
        didWarnAboutReservedActionType = true
      }
      ;(originalDispatch as any)(...a)
    })
  }

  return initialState
}
export const devtools = devtoolsImpl as unknown as Devtools

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
