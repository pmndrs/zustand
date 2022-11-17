import type {} from '@redux-devtools/extension'
import type { StateCreator, StoreApi, StoreMutatorIdentifier } from '../vanilla'

// Copy types to avoid import type { Config } from '@redux-devtools/extension'
// https://github.com/pmndrs/zustand/issues/1205
type Action<T = any> = {
  type: T
}
type ActionCreator<A, P extends any[] = any[]> = {
  (...args: P): A
}
type EnhancerOptions = {
  name?: string
  actionCreators?:
    | ActionCreator<any>[]
    | {
        [key: string]: ActionCreator<any>
      }
  latency?: number
  maxAge?: number
  serialize?:
    | boolean
    | {
        options?:
          | undefined
          | boolean
          | {
              date?: true
              regex?: true
              undefined?: true
              error?: true
              symbol?: true
              map?: true
              set?: true
              function?: true | ((fn: (...args: any[]) => any) => string)
            }
        replacer?: (key: string, value: unknown) => any
        reviver?: (key: string, value: unknown) => any
        immutable?: any
        refs?: any
      }
  actionSanitizer?: <A extends Action>(action: A, id: number) => A
  stateSanitizer?: <S>(state: S, index: number) => S
  actionsBlacklist?: string | string[]
  actionsWhitelist?: string | string[]
  actionsDenylist?: string | string[]
  actionsAllowlist?: string | string[]
  predicate?: <S, A extends Action>(state: S, action: A) => boolean
  shouldRecordChanges?: boolean
  pauseActionType?: string
  autoPause?: boolean
  shouldStartLocked?: boolean
  shouldHotReload?: boolean
  shouldCatchErrors?: boolean
  features?: {
    pause?: boolean
    lock?: boolean
    persist?: boolean
    export?: boolean | 'custom'
    import?: boolean | 'custom'
    jump?: boolean
    skip?: boolean
    reorder?: boolean
    dispatch?: boolean
    test?: boolean
  }
  trace?: boolean | (<A extends Action>(action: A) => string)
  traceLimit?: number
}
type Config = EnhancerOptions & {
  type?: string
}

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

type Cast<T, U> = T extends U ? T : U
type Write<T, U> = Omit<T, keyof U> & U
type TakeTwo<T> = T extends { length: 0 }
  ? [undefined, undefined]
  : T extends { length: 1 }
  ? [...a0: Cast<T, unknown[]>, a1: undefined]
  : T extends { length: 0 | 1 }
  ? [...a0: Cast<T, unknown[]>, a1: undefined]
  : T extends { length: 2 }
  ? T
  : T extends { length: 1 | 2 }
  ? T
  : T extends { length: 0 | 1 | 2 }
  ? T
  : T extends [infer A0, infer A1, ...unknown[]]
  ? [A0, A1]
  : T extends [infer A0, (infer A1)?, ...unknown[]]
  ? [A0, A1?]
  : T extends [(infer A0)?, (infer A1)?, ...unknown[]]
  ? [A0?, A1?]
  : never

type WithDevtools<S> = Write<S, StoreDevtools<S>>

type StoreDevtools<S> = S extends {
  setState: (...a: infer Sa) => infer Sr
}
  ? {
      setState<A extends string | { type: unknown }>(
        ...a: [...a: TakeTwo<Sa>, action?: A]
      ): Sr
    }
  : never

export interface DevtoolsOptions extends Config {
  enabled?: boolean
  anonymousActionType?: string
  store?: string
}

type Devtools = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = []
>(
  initializer: StateCreator<T, [...Mps, ['zustand/devtools', never]], Mcs>,
  devtoolsOptions?: DevtoolsOptions
) => StateCreator<T, Mps, [['zustand/devtools', never], ...Mcs]>

declare module '../vanilla' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface StoreMutators<S, A> {
    'zustand/devtools': WithDevtools<S>
  }
}

type DevtoolsImpl = <T>(
  storeInitializer: StateCreator<T, [], []>,
  devtoolsOptions?: DevtoolsOptions
) => StateCreator<T, [], []>

export type NamedSet<T> = WithDevtools<StoreApi<T>>['setState']

let extensionGlobal: ReturnType<
  NonNullable<Window['__REDUX_DEVTOOLS_EXTENSION__']>['connect']
>

const storeApis: (StoreApi<any> & { store: string })[] = []
const initialStoreStates: (any & { store: string })[] = []

const getCurrentStoresStates = () => {
  const storesStates = storeApis.map((storeApi) => ({
    ...storeApi.getState(),
    store: storeApi.store,
  }))
  const currentStates: Record<
    string,
    ReturnType<StoreApi<any>['getState']>
  > = {}
  storesStates.forEach((storeState) => {
    currentStates[storeState.store] = storeState
  })
  return currentStates
}

const devtoolsImpl: DevtoolsImpl =
  (fn, devtoolsOptions = {}) =>
  (set, get, api) => {
    const { enabled, anonymousActionType, store, ...options } = devtoolsOptions

    type S = ReturnType<typeof fn> & { [store: string]: S }
    type PartialState = Partial<S> | ((s: S) => Partial<S>)

    let extensionConnector:
      | typeof window['__REDUX_DEVTOOLS_EXTENSION__']
      | false
    try {
      extensionConnector =
        (enabled ?? __DEV__) && window.__REDUX_DEVTOOLS_EXTENSION__
    } catch {
      // ignored
    }

    if (!extensionConnector) {
      if (__DEV__ && enabled) {
        console.warn(
          '[zustand devtools middleware] Please install/enable Redux devtools extension'
        )
      }
      return fn(set, get, api)
    }

    let extension = extensionGlobal
    if (extensionGlobal === undefined && store !== undefined) {
      extensionGlobal = extensionConnector.connect(options)
      extension = extensionGlobal
    }
    if (store === undefined) {
      extension = extensionConnector.connect(options)
    }

    let isRecording = true
    ;(api.setState as NamedSet<S>) = (state, replace, nameOrAction) => {
      const r = set(state, replace)
      if (!isRecording) return r
      if (store === undefined) {
        extension.send(
          nameOrAction === undefined
            ? { type: anonymousActionType || 'anonymous' }
            : typeof nameOrAction === 'string'
            ? { type: nameOrAction }
            : nameOrAction,
          get()
        )
        return r
      }
      function getNameOrAction(
        name?: string | { type: unknown }
      ): Action<unknown> {
        if (name !== undefined && typeof name === 'string') {
          return { type: name }
        }
        if (
          name !== undefined &&
          typeof name !== 'string' &&
          store !== undefined
        ) {
          return { type: `${store}/${name.type}` }
        }
        if (name !== undefined) {
          return name
        }
        return { type: anonymousActionType || 'anonymous' }
      }
      extension.send(getNameOrAction(nameOrAction), {
        ...getCurrentStoresStates(),
        [store]: { ...api.getState(), store },
      })
      return r
    }

    const setStateFromDevtools: StoreApi<S>['setState'] = (...a) => {
      const originalIsRecording = isRecording
      isRecording = false
      set(...a)
      isRecording = originalIsRecording
    }

    const initialState = fn(api.setState, get, api)
    if (store === undefined) {
      extension.init(initialState)
    } else {
      storeApis.push({ ...api, store })
      initialStoreStates.push({ ...initialState, store })
      const inits: Record<string, S> = {}
      initialStoreStates.forEach((storeState) => {
        inits[storeState.store] = storeState
      })
      extension.init(inits)
      console.warn('zustand initialized with initial state', inits)
    }

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
          return parseJsonThen<{ type: unknown; state?: PartialState }>(
            message.payload,
            (action) => {
              if (action.type === '__setState') {
                if (action.type === '__setState') {
                  if (store === undefined) {
                    setStateFromDevtools(action.state as PartialState)
                    return
                  }
                  if (
                    JSON.stringify(api.getState()) !==
                    JSON.stringify((action.state as S)[store])
                  ) {
                    setStateFromDevtools(action.state as S)
                  }
                  return
                }
              }

              if (!(api as any).dispatchFromDevtools) return
              if (typeof (api as any).dispatch !== 'function') return
              ;(api as any).dispatch(action)
            }
          )

        case 'DISPATCH':
          switch (message.payload.type) {
            case 'RESET':
              setStateFromDevtools(initialState as S)
              if (store === undefined) {
                return extension.init(api.getState())
              }
              return extension.init(getCurrentStoresStates())

            case 'COMMIT':
              if (store === undefined) {
                extension.init(api.getState())
                return
              }
              return extension.init(getCurrentStoresStates())

            case 'ROLLBACK':
              return parseJsonThen<S>(message.state, (state) => {
                if (store === undefined) {
                  setStateFromDevtools(state)
                  extension.init(api.getState())
                  return
                }
                setStateFromDevtools(state[store] as S)
                extension.init(getCurrentStoresStates())
              })

            case 'JUMP_TO_STATE':
            case 'JUMP_TO_ACTION':
              return parseJsonThen<S>(message.state, (state) => {
                if (store === undefined) {
                  setStateFromDevtools(state)
                  return
                }
                if (
                  JSON.stringify(api.getState()) !==
                  JSON.stringify(state[store])
                ) {
                  setStateFromDevtools(state[store] as S)
                }
              })

            case 'IMPORT_STATE': {
              const { nextLiftedState } = message.payload
              const lastComputedState =
                nextLiftedState.computedStates.slice(-1)[0]?.state
              if (!lastComputedState) return
              if (store === undefined) {
                setStateFromDevtools(lastComputedState)
              } else {
                setStateFromDevtools(lastComputedState[store])
              }
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

const isDevEnv = process.env.REACT_APP_CUSTOM_NODE_ENV
  ? process.env.REACT_APP_CUSTOM_NODE_ENV !== 'production'
  : process.env.NODE_ENV !== 'production'
const devOnlyDevtoolsImpl: DevtoolsImpl =
  (fn, devtoolsOptions = {}) =>
  (set, get, api) => {
    if (isDevEnv) {
      return devtools(fn, devtoolsOptions)(set, get, api)
    }
    return fn(set, get, api)
  }

export const devOnlyDevtools = devOnlyDevtoolsImpl as unknown as Devtools

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
