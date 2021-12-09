import { Store, UnknownState, StoreInitializer, TagStore } from '../vanilla'

// ============================================================================
// Types

type Devtools =
  <T extends UnknownState, S extends Store<T>>
    ( storeInitializer:
      & ( ( set: (S & DevtoolsStore<T>)['setState']
          , get: (S & DevtoolsStore<T>)['getState']
          , store: S & DevtoolsStore<T>
          ) =>
            T
        )
      & TagStore<S>
    , options?: DevtoolsOptions
    ) =>
      StoreInitializer<T, S & DevtoolsStore<T>>

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

interface DevtoolsStore<T extends UnknownState>
  { setState:
      (...a:
        [...a: F.Arguments<Store<T>['setState']>
        , actionType?: string
        ]
      ) =>
        F.Call<Store<T>['setState']>
  }

interface DevtoolsWindow
  { __REDUX_DEVTOOLS_EXTENSION__?:
      { connect:
          (options?: U.Exclude<EDevtoolsOptions, string>) => EDevtoolsExtension
      }
  }



// ============================================================================
// Implementation

type EState = { __isState: true }
type EStore = Store<EState>
type EDevtools = 
  ( storeInitializer:
      ( set: EDevtoolsStore['setState']
      , get: EStore['getState']
      , store: EStore
      ) =>
        EState
  , options?: EDevtoolsOptions
  ) =>
    StoreInitializer<EState, EStore & EDevtoolsStore>


type EDevtoolsOptions =
  | EDevtoolsStoreName
  | O.Overwrite<
      U.Exclude<DevtoolsOptions, string>,
      { name?: EDevtoolsStoreName | undefined, anonymousActionType?: EAnonymousActionType }
    >
type EDevtoolsStoreName =
  string & { __isDevtoolsStoreName: true }
type EAnonymousActionType =
  string & { __isAnonymousActionType: true }

interface EDevtoolsStore
  { setState:
    (...a:
      [...a: F.Arguments<Store<EState>['setState']>
      , name?: EAction
      ]
    ) =>
      F.Call<Store<EState>['setState']>
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
        | { type: "__setState", state: O.Partial<EStateFromDevtools> }
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
        | { type: UnknownString }
    }
  | { type: UnknownString }

type EStateLifted =
  { computedStates: { state: O.Partial<EStateFromDevtools> }[] }
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
  const devtools = extensionConnector.connect(devtoolsOptions)

  let isRecording = false
  store.setState = (...[state, replace, action]: F.Arguments<typeof store['setState']>) => {
    parentSet(state, replace)
    if (!isRecording) return
    devtools?.send(
      action === undefined ? { type: devtoolsOptions.anonymousActionType } :
      typeof action === 'string' ? { type: action } :
      action,
      parentGet()
    )
  }
  const setStateFromDevtools = (state: EStateFromDevtools | O.Partial<EStateFromDevtools>) => {
    isRecording = true
    store.setState(state as unknown as EState)
    isRecording = false
  }

  const initialState =
    storeInitializer(store.setState, parentGet, store)

  devtools.subscribe(message => {
    switch (message.type) {
      case 'ACTION':
        if (!shouldDispatchFromDevtools(store)) return
        if (typeof message.payload !== "string") return
        return parseJsonThen(message.payload, action => {
          if (action.type === '__setState') {
            setStateFromDevtools((action as { state: O.Partial<EStateFromDevtools> }).state)
            return
          }

          if (!shouldDispatchFromDevtools(store)) return
          store.dispatch(action as EAction)
        })

      case 'DISPATCH':
        switch (message.payload.type) {
          case 'RESET':
            setStateFromDevtools(initialState as unknown as EStateFromDevtools)
            return devtools.init(initialState)

          case 'COMMIT':
            return devtools.init(store.getState())

          case 'ROLLBACK':
            return parseJsonThen(message.state, state => {
              setStateFromDevtools(state)
              devtools.init(state)
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

          default: pseudoAssertIs(message.payload.type, {} as UnknownString)    
        }
        return

      default: pseudoAssertIs(message.type, {} as UnknownString)
    }
  })

  return initialState
}
const devtools = devtoolsImpl as Devtools

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
  <T, U>
    ( value: A.AreEqual<T, U> extends true ? T : "Error: Not equal to the type on right"
    , type: U
    ) =>
      void
  = () => {}

namespace O {
  export type Unknown =
    object

  export type ExcludeKey<T extends O.Unknown, K extends keyof T,
    Ek extends keyof T = U.Exclude<keyof T, K>
    // Ek extracted to make ExcludeKey homomorphic
  > =
    { [P in Ek]: T[P]
    }

  export type Overwrite<T extends O.Unknown, U extends O.Unknown> =
    & O.ExcludeKey<T, U.Extract<keyof U, keyof T>>
    & U

  export type Partial<T> =
    { [K in keyof T]?: T[K]
    }
}

namespace F {
  export type Unknown =
    (...a: never[]) => unknown

  export type Call<T extends F.Unknown> =
    T extends (...a: never[]) => infer R ? R : never

  export type Arguments<T extends F.Unknown> =
    T extends (...a: infer A) => unknown ? A : never
}

namespace U {
  export type Exclude<T, U> =
    T extends U ? never : T
  
  export type Extract<T, U> =
    T extends U ? T : never
}

namespace A {
  export type AreEqual<A, B> =
    (<T>() => T extends B ? 1 : 0) extends (<T>() => T extends A ? 1 : 0)
      ? true
      : false
}

// ============================================================================
// Exports

export { devtools, DevtoolsOptions, DevtoolsStore }
