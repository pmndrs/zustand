import { Store, UnknownState, StoreInitializer, StoreMutatorIdentifier } from '../vanilla'

// ============================================================================
// Types

type Devtools =
  < T extends UnknownState
  , Mps extends [StoreMutatorIdentifier, unknown][] = []
  , Mcs extends [StoreMutatorIdentifier, unknown][] = []
  >
    ( initializer: StoreInitializer<T, [...Mps, [$$devtools, never]], Mcs>
    , options?: DevtoolsOptions
    ) =>
      StoreInitializer<T, Mps, [[$$devtools, never], ...Mcs]>

const $$devtools = Symbol("$$devtools");
type $$devtools = typeof $$devtools;

declare module '../vanilla' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface StoreMutators<S, A>
    { [$$devtools]: WithDevtools<S>
    }
}

type WithDevtools<S> =
  Write<
    Extract<S, object>,
    StoreSetStateWithAction<S>
  >

type StoreSetStateWithAction<S> =
  S extends { setState: (...a: infer A) => infer R }
    ? { setState: (...a: [...a: A, actionType?: string]) => R }
    : never

type DevtoolsOptions =
  | string
  | { name?: string
    , anonymousActionType?: string
    , serialize?:
      { options:
        | boolean
        | { date?: boolean
          , regex?: boolean
          , undefined?: boolean
          , nan?: boolean
          , infinity?: boolean
          , error?: boolean
          , symbol?: boolean
          , map?: boolean
          , set?: boolean
          }
      }
    }

interface DevtoolsWindow
  { __REDUX_DEVTOOLS_EXTENSION__?:
      { connect:
          (options?: Exclude<EDevtoolsOptions, string>) => EDevtoolsExtension
      }
  }



// ============================================================================
// Implementation

type EState = { __isState: true }
type EStore = Store<EState>
type EDevtools = 
  ( storeInitializer: EStoreInitializer
  , options?: EDevtoolsOptions
  ) =>
    EStoreInitializer

type EStoreInitializer = 
  PopArgument<StoreInitializer<EState, [], []>>

type EDevtoolsOptions =
  | EDevtoolsStoreName
  | Write<
      Exclude<DevtoolsOptions, string>,
      { name?: EDevtoolsStoreName | undefined, anonymousActionType?: EAnonymousActionType }
    >
type EDevtoolsStoreName =
  string & { __isDevtoolsStoreName: true }
type EAnonymousActionType =
  string & { __isAnonymousActionType: true }

interface EDevtoolsStore
  { setState:
    (...a:
      [...a: Parameters<Store<EState>['setState']>
      , name?: EAction
      ]
    ) =>
      ReturnType<Store<EState>['setState']>
  , dispatchFromDevtools?: boolean
  }

type EAction = EActionType | { type: EActionType }
type EActionType =
  (string & { __isActionType: true }) | undefined

interface EDevtoolsExtension
  { init: (state: EState | EStateFromDevtools) => void
  , send: (..._:
      | [action: { type: EActionType } | { type: EAnonymousActionType }, state: EState]
      | [_: null, liftedState: EStateLifted]
    ) => void
  , subscribe: (listener: (message: EDevtoolsMessage) => void) => () => void
  }

type EDevtoolsMessage = 
  | { type: "ACTION"
    , payload: StringifiedJson<
        | { type: EActionType }
        | { type: "__setState", state: Partial<EStateFromDevtools> }
        >
    }
  | { type: "DISPATCH"
    , state: StringifiedJson<EStateFromDevtools>
    , payload:
        | { type: "RESET" }
        | { type: "COMMIT" }
        | { type: "ROLLBACK" }
        | { type: "JUMP_TO_ACTION" }
        | { type: "JUMP_TO_STATE" }
        | { type: "IMPORT_STATE"
          , nextLiftedState: EStateLifted
          }
        | { type: "PAUSE_RECORDING" }
        | { type: UnknownString }
    }
  | { type: UnknownString }

type EStateLifted =
  { computedStates: { state: Partial<EStateFromDevtools> }[] }
type EStateFromDevtools = { __isStateFromDevtools: true }

const devtoolsWindow = window as
  | ( Window
    & DevtoolsWindow
    & { top: DevtoolsWindow }
    )
  | undefined

const devtoolsImpl: EDevtools =
  (storeInitializer, _devtoolsOptions) =>
    (parentSet, parentGet, parentStore) => {

  const devtoolsOptions =
    { ...(
        _devtoolsOptions === undefined ? { name: undefined } :
        typeof _devtoolsOptions === 'string' ? { name: _devtoolsOptions } :
        _devtoolsOptions
      ),
      anonymousActionType: 'anonymous' as EAnonymousActionType
    }
      

  if (typeof devtoolsWindow === 'undefined') {
    return storeInitializer(parentSet, parentGet, parentStore)
  }

  const extensionConnector =
    devtoolsWindow.__REDUX_DEVTOOLS_EXTENSION__ ??
    devtoolsWindow.top.__REDUX_DEVTOOLS_EXTENSION__

  if (!extensionConnector) {
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      console.warn('[zustand devtools middleware] Please install/enable Redux devtools extension')
    }

    return storeInitializer(parentSet, parentGet, parentStore)
  }

  const store: EStore & EDevtoolsStore = parentStore
  const devtools = extensionConnector.connect(
    (({ anonymousActionType, ...options }) => options)(devtoolsOptions)
  )

  let isRecording = true
  store.setState = (...[state, replace, action]: Parameters<typeof store['setState']>) => {
    parentSet(state, replace)
    if (!isRecording) return
    devtools?.send(
      action === undefined ? { type: devtoolsOptions.anonymousActionType } :
      typeof action === 'string' ? { type: action } :
      action,
      parentGet()
    )
  }
  const setStateFromDevtools = (state: EStateFromDevtools | Partial<EStateFromDevtools>) => {
    let originalRecording = isRecording
    isRecording = false;
    store.setState(state as unknown as EState)
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
        action === '__setState'
        || (typeof action === 'object' && action.type === '__setState')
        && !didWarnAboutReservedActionType
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

  devtools.subscribe(message => {
    switch (message.type) {
      case 'ACTION':
        if (typeof message.payload !== "string") {
          console.error("[zustand devtools middleware] Unsupported action format");
          return;
        }
        return parseJsonThen(message.payload, action => {
          if (action.type === '__setState') {
            setStateFromDevtools((action as { state: Partial<EStateFromDevtools> }).state)
            return
          }

          if (!shouldDispatchFromDevtools(store)) return
          store.dispatch(action as EAction)
        })

      case 'DISPATCH':
        switch (message.payload.type) {
          case 'RESET':
            setStateFromDevtools(initialState as unknown as EStateFromDevtools)
            return devtools.init(store.getState())

          case 'COMMIT':
            return devtools.init(store.getState())

          case 'ROLLBACK':
            return parseJsonThen(message.state, state => {
              setStateFromDevtools(state)
              devtools.init(store.getState())
            })

          case 'JUMP_TO_STATE':
          case 'JUMP_TO_ACTION':
            return parseJsonThen(message.state, setStateFromDevtools)

          case 'IMPORT_STATE': {
            const { nextLiftedState } = message.payload
            const lastComputedState = nextLiftedState.computedStates.slice(-1)[0]?.state
            if (!lastComputedState) return
            setStateFromDevtools(lastComputedState)
            devtools.send(null, nextLiftedState)
            return
          }

          case 'PAUSE_RECORDING':
            isRecording = !isRecording;
            return;

          default: pseudoAssertIs(message.payload.type, {} as UnknownString)    
        }
        return

      default: pseudoAssertIs(message.type, {} as UnknownString)
    }
  })

  return initialState
}
const devtools = devtoolsImpl as unknown as Devtools;

// ============================================================================
// Utilities

type ShouldDispatchFromDevtools = 
  <S extends EStore & EDevtoolsStore>(store: S) =>
    store is S & { dispatchFromDevtools: true, dispatch: (action: EAction) => void }

const shouldDispatchFromDevtools = (store =>
  store.dispatchFromDevtools &&
  typeof (store as { dispatch?: unknown }).dispatch === 'function'
) as ShouldDispatchFromDevtools

  
type StringifiedJson<T> =
  string & { __isStringifiedJson: true, value: T }

const parseJsonThen = <T>(stringified: StringifiedJson<T>, f: (parsed: T) => void) => {
  let parsed: T | undefined
  let didParse = true
  try {
    parsed = JSON.parse(stringified)
  } catch (e) {
    console.error("[zustand devtools middleware] Could not parse the received json", e)
    didParse = false
  }
  if (didParse) f(parsed as T)
}

type UnknownString = { __isUnknownString: true }


const pseudoAssertIs:
  <A, E>
    ( value:
        (<T>() => T extends A ? 1 : 0) extends (<T>() => T extends E ? 1 : 0)
          ? A
          : "Error: Not equal to the type on right"
    , type: E
    ) =>
      void
  = () => {}

type Write<T extends object, U extends object> =
  Omit<T, keyof U> & U

export type PopArgument<T extends (...a: never[]) => unknown> =
  T extends (...a: [...infer A, infer _]) => infer R
    ? (...a: A) => R
    : never

// ============================================================================
// Exports

export { devtools, DevtoolsOptions, $$devtools, WithDevtools }
