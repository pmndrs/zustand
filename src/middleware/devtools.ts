import {
  Store,
  UnknownState,
  StoreInitializer,
  StoreMutatorIdentifier,
} from '../vanilla'

// ============================================================================
// Types

type Devtools = <
  T extends UnknownState,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = []
>(
  initializer: StoreInitializer<T, [...Mps, [$$devtools, never]], Mcs>,
  options?: DevtoolsOptions
) => StoreInitializer<T, Mps, [[$$devtools, never], ...Mcs]>

const $$devtools = Symbol('$$devtools')
type $$devtools = typeof $$devtools

declare module '../vanilla' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface StoreMutators<S, A> {
    [$$devtools]: WithDevtools<S>
  }
}

type WithDevtools<S> = Write<Extract<S, object>, StoreSetStateWithAction<S>>

type StoreSetStateWithAction<S> = S extends {
  setState: (...a: infer A) => infer R
}
  ? { setState: (...a: [...a: A, actionType?: string]) => R }
  : never

type DevtoolsOptions = {
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

interface DevtoolsWindow {
  __REDUX_DEVTOOLS_EXTENSION__?: {
    connect: (
      options?: Exclude<DevtoolsOptionsImpl, string>
    ) => DevtoolsExtensionImpl
  }
}

// ============================================================================
// Implementation

type T = { __isState: true }
type StoreImpl = Store<T>
type DevtoolsImpl = (
  storeInitializer: StoreInitializerImpl,
  options?: DevtoolsOptionsImpl
) => StoreInitializerImpl

type StoreInitializerImpl = PopArgument<StoreInitializer<T, [], []>>

type DevtoolsOptionsImpl = Write<
  DevtoolsOptions,
  {
    name?: DevtoolsStoreNameImpl | undefined
    anonymousActionType?: AnonymousActionTypeImpl
  }
>
type DevtoolsStoreNameImpl = string & { __isDevtoolsStoreName: true }
type AnonymousActionTypeImpl = string & { __isAnonymousActionType: true }

interface DevtoolsStoreImpl {
  setState: (
    ...a: [...a: Parameters<StoreImpl['setState']>, name?: ActionImpl]
  ) => ReturnType<StoreImpl['setState']>
  dispatchFromDevtools?: boolean
}

type ActionImpl = ActionTypeImpl | { type: ActionTypeImpl }
type ActionTypeImpl = (string & { __isActionType: true }) | undefined

interface DevtoolsExtensionImpl {
  init: (state: T | StateFromDevtoolsImpl) => void
  send: (
    ..._:
      | [
          action: { type: ActionTypeImpl } | { type: AnonymousActionTypeImpl },
          state: T
        ]
      | [_: null, liftedState: StateLiftedImpl]
  ) => void
  subscribe: (listener: (message: DevtoolsMessageImpl) => void) => () => void
}

type DevtoolsMessageImpl =
  | {
      type: 'ACTION'
      payload: StringifiedJson<
        | { type: ActionTypeImpl }
        | { type: '__setState'; state: Partial<StateFromDevtoolsImpl> }
      >
    }
  | {
      type: 'DISPATCH'
      state: StringifiedJson<StateFromDevtoolsImpl>
      payload:
        | { type: 'RESET' }
        | { type: 'COMMIT' }
        | { type: 'ROLLBACK' }
        | { type: 'JUMP_TO_ACTION' }
        | { type: 'JUMP_TO_STATE' }
        | { type: 'IMPORT_STATE'; nextLiftedState: StateLiftedImpl }
        | { type: 'PAUSE_RECORDING' }
        | { type: UnknownString }
    }
  | { type: UnknownString }

type StateLiftedImpl = {
  computedStates: { state: Partial<StateFromDevtoolsImpl> }[]
}
type StateFromDevtoolsImpl = { __isStateFromDevtools: true }

const devtoolsWindow = window as
  | (Window & DevtoolsWindow & { top: DevtoolsWindow })
  | undefined

const devtoolsImpl: DevtoolsImpl =
  (storeInitializer, _devtoolsOptions) =>
  (parentSet, parentGet, parentStore) => {
    const devtoolsOptions = {
      ...(_devtoolsOptions === undefined
        ? { name: undefined }
        : _devtoolsOptions),
      anonymousActionType: 'anonymous' as AnonymousActionTypeImpl,
    }

    if (typeof devtoolsWindow === 'undefined') {
      return storeInitializer(parentSet, parentGet, parentStore)
    }

    const extensionConnector =
      devtoolsWindow.__REDUX_DEVTOOLS_EXTENSION__ ??
      devtoolsWindow.top.__REDUX_DEVTOOLS_EXTENSION__

    if (!extensionConnector) {
      if (
        process.env.NODE_ENV === 'development' &&
        typeof window !== 'undefined'
      ) {
        console.warn(
          '[zustand devtools middleware] Please install/enable Redux devtools extension'
        )
      }

      return storeInitializer(parentSet, parentGet, parentStore)
    }

    const store: StoreImpl & DevtoolsStoreImpl = parentStore
    const devtools = extensionConnector.connect(
      (({ anonymousActionType: _, ...options }) => options)(devtoolsOptions)
    )

    let isRecording = true
    store.setState = (
      ...[state, replace, action]: Parameters<typeof store['setState']>
    ) => {
      parentSet(state, replace)
      if (!isRecording) return
      devtools?.send(
        action === undefined
          ? { type: devtoolsOptions.anonymousActionType }
          : typeof action === 'string'
          ? { type: action }
          : action,
        parentGet()
      )
    }
    const setStateFromDevtools = (
      state: StateFromDevtoolsImpl | Partial<StateFromDevtoolsImpl>
    ) => {
      const originalRecording = isRecording
      isRecording = false
      store.setState(state as unknown as T)
      isRecording = originalRecording
    }

    const initialState = storeInitializer(store.setState, parentGet, store)
    devtools.init(initialState)

    if (shouldDispatchFromDevtools(store)) {
      let didWarnAboutReservedActionType = false
      const originalDispatch = store.dispatch
      store.dispatch = (...a) => {
        const action = a[0]
        if (
          action === '__setState' ||
          (typeof action === 'object' &&
            action.type === '__setState' &&
            !didWarnAboutReservedActionType)
        ) {
          console.warn(
            '[zustand devtools middleware] "__setState" action type is reserved ' +
              'to set state from the devtools. Avoid using it.'
          )
          didWarnAboutReservedActionType = true
        }
        originalDispatch(...a)
      }
    }

    devtools.subscribe((message) => {
      switch (message.type) {
        case 'ACTION':
          if (typeof message.payload !== 'string') {
            console.error(
              '[zustand devtools middleware] Unsupported action format'
            )
            return
          }
          return parseJsonThen(message.payload, (action) => {
            if (action.type === '__setState') {
              setStateFromDevtools(
                (action as { state: Partial<StateFromDevtoolsImpl> }).state
              )
              return
            }

            if (!shouldDispatchFromDevtools(store)) return
            store.dispatch(action as ActionImpl)
          })

        case 'DISPATCH':
          switch (message.payload.type) {
            case 'RESET':
              setStateFromDevtools(
                initialState as unknown as StateFromDevtoolsImpl
              )
              return devtools.init(store.getState())

            case 'COMMIT':
              return devtools.init(store.getState())

            case 'ROLLBACK':
              return parseJsonThen(message.state, (state) => {
                setStateFromDevtools(state)
                devtools.init(store.getState())
              })

            case 'JUMP_TO_STATE':
            case 'JUMP_TO_ACTION':
              return parseJsonThen(message.state, setStateFromDevtools)

            case 'IMPORT_STATE': {
              const { nextLiftedState } = message.payload
              const lastComputedState =
                nextLiftedState.computedStates.slice(-1)[0]?.state
              if (!lastComputedState) return
              setStateFromDevtools(lastComputedState)
              devtools.send(null, nextLiftedState)
              return
            }

            case 'PAUSE_RECORDING':
              isRecording = !isRecording
              return

            default:
              pseudoAssertIs(message.payload.type, {} as UnknownString)
          }
          return

        default:
          pseudoAssertIs(message.type, {} as UnknownString)
      }
    })

    return initialState
  }
const devtools = devtoolsImpl as unknown as Devtools

// ============================================================================
// Utilities

type ShouldDispatchFromDevtools = <S extends StoreImpl & DevtoolsStoreImpl>(
  store: S
) => store is S & {
  dispatchFromDevtools: true
  dispatch: (action: ActionImpl) => void
}

const shouldDispatchFromDevtools = ((store) =>
  store.dispatchFromDevtools &&
  typeof (store as { dispatch?: unknown }).dispatch ===
    'function') as ShouldDispatchFromDevtools

type StringifiedJson<T> = string & { __isStringifiedJson: true; value: T }

const parseJsonThen = <T>(
  stringified: StringifiedJson<T>,
  f: (parsed: T) => void
) => {
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

type UnknownString = { __isUnknownString: true }

const pseudoAssertIs: <A, E>(
  value: (<T>() => T extends A ? 1 : 0) extends <T>() => T extends E ? 1 : 0
    ? A
    : 'Error: Not equal to the type on right',
  type: E
) => void = () => {}

type Write<T extends object, U extends object> = Omit<T, keyof U> & U

export type PopArgument<T extends (...a: never[]) => unknown> = T extends (
  ...a: [...infer A, infer _]
) => infer R
  ? (...a: A) => R
  : never

// ============================================================================
// Exports

export { devtools, DevtoolsOptions, $$devtools, WithDevtools }
