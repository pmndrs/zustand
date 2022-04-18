import type {} from '@redux-devtools/extension'
import {
  PartialState,
  SetState,
  State,
  StateCreator,
  StoreApi,
  StoreMutatorIdentifier,
} from '../vanilla'

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
type TakeTwo<T> = T extends []
  ? [undefined, undefined]
  : T extends [unknown]
  ? [...a0: T, a1: undefined]
  : T extends [unknown?]
  ? [...a0: T, a1: undefined]
  : T extends [unknown, unknown]
  ? T
  : T extends [unknown, unknown?]
  ? T
  : T extends [unknown?, unknown?]
  ? T
  : T extends [infer A0, infer A1, ...unknown[]]
  ? [A0, A1]
  : T extends [infer A0, (infer A1)?, ...unknown[]]
  ? [A0, A1?]
  : T extends [(infer A0)?, (infer A1)?, ...unknown[]]
  ? [A0?, A1?]
  : never

type WithDevtools<S> = Write<Cast<S, object>, StoreSetStateWithAction<S>>

type StoreSetStateWithAction<S> = S extends {
  setState: (...a: infer A) => infer Sr
}
  ? {
      setState(
        ...a: [...a: TakeTwo<A>, actionType?: string | { type: unknown }]
      ): Sr
    }
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

type Devtools = <
  T extends State,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = []
>(
  initializer: StateCreator<T, [...Mps, ['zustand/devtools', never]], Mcs>,
  options?: DevtoolsOptions
) => StateCreator<T, Mps, [['zustand/devtools', never], ...Mcs]>

declare module '../vanilla' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface StoreMutators<S, A> {
    'zustand/devtools': WithDevtools<S>
  }
}

type DevtoolsImpl = <T extends State>(
  storeInitializer: PopArgument<StateCreator<T, [], []>>,
  options: DevtoolsOptions
) => PopArgument<StateCreator<T, [], []>>

type PopArgument<T extends (...a: never[]) => unknown> = T extends (
  ...a: [...infer A, infer _]
) => infer R
  ? (...a: A) => R
  : never

export type NamedSet<T extends State> = WithDevtools<StoreApi<T>>['setState']

const devtoolsImpl: DevtoolsImpl = (fn, options) => (set, get, api) => {
  type S = ReturnType<typeof fn>

  const devtoolsOptions =
    options === undefined
      ? {}
      : typeof options === 'string'
      ? { name: options }
      : options

  let extensionConnector
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
    const r = set(state, replace)
    if (!isRecording) return r
    extension.send(
      nameOrAction === undefined
        ? { type: devtoolsOptions.anonymousActionType || 'anonymous' }
        : typeof nameOrAction === 'string'
        ? { type: nameOrAction }
        : nameOrAction,
      get()
    )
    return r
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
  ).subscribe((message: any) => {
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
