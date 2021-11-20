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
  , devtools?: DevtoolsExtension
  }


interface DevtoolsExtension
  { prefix: string
  , subscribe: (message: unknown) => () => void
  , unsubscribe: () => void
  , send: (action: unknown, state: unknown) => void
  , init: (state: unknown) => void
  , error: (payload: unknown) => void
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
      { name: EDevtoolsStoreName }
    >
type EDevtoolsStoreName =
  undefined | (string & { __isDevtoolsStoreName: true })

interface EDevtoolsStore
  { setState:
    (...a:
      [...a: F.Arguments<Store<EState>['setState']>
      , name?: EAction
      ]
    ) =>
      F.Call<Store<EState>['setState']>
  , devtools?: EDevtoolsExtension
  , isReduxLike?: boolean
  }

type EAction = EActionType | { type: EActionType }
type EActionType =
  (string & { __isActionType: true }) | undefined

interface EDevtoolsExtension
  { prefix: EDevtoolsPrefix
  , init: (state: EState | EStateFromDevtools) => void
  , send: (..._:
      | [action: EActionToSend, state: EState]
      | [_: null, liftedState: EStateLifted]
    ) => void
  , subscribe: (listener: (message: EDevtoolsMessage) => void) => () => void
  }

type EDevtoolsMessage = 
  | { type: "ACTION"
    , payload: StringifiedJson<EAction> | UnknownObject
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
type EDevtoolsPrefix = string & { __isDevtoolsPrefix: true }
type EActionToSend = { type: string } & { __isActionToSend: true }  
type EStateFromDevtools = { __isStateFromDevtools: true }

const devtoolsWindow = window as
  & Window
  & DevtoolsWindow
  & { top: DevtoolsWindow }

const devtoolsImpl: EDevtools =
  (storeInitializer, _devtoolsOptions) =>
    (parentSet, parentGet, parentStore) => {

  let devtoolsOptions: EDevtoolsOptions =
    _devtoolsOptions === undefined ? { name: undefined } :
    typeof _devtoolsOptions === 'string' ? { name: _devtoolsOptions } :
    _devtoolsOptions

  let extensionConnector =
    devtoolsWindow.__REDUX_DEVTOOLS_EXTENSION__ ??
    devtoolsWindow.top.__REDUX_DEVTOOLS_EXTENSION__

  if (!extensionConnector) {
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      console.warn('Please install/enable Redux devtools extension')
    }

    return storeInitializer(parentSet, parentGet, parentStore)
  }

  let store: EStore & EDevtoolsStore = parentStore;
  if (!store.devtools) store.devtools = extensionConnector.connect(devtoolsOptions);
  store.devtools.prefix = prefixFromName(devtoolsOptions.name);

  let isSilentSetState = false;
  store.setState = (...[state, replace, action]: F.Arguments<typeof store['setState']>) => {
    parentSet(state, replace)
    if (!isSilentSetState) return;
    store.devtools?.send(
      actionToSend(action, store.devtools.prefix),
      parentGet()
    )
  }
  const silentlySetState = (state: EStateFromDevtools | O.Partial<EStateFromDevtools>) => {
    isSilentSetState = true;
    store.setState(state as unknown as EState);
    isSilentSetState = false;
  }

  let initialState =
    storeInitializer(store.setState, parentGet, store);

  store.devtools.subscribe(message => {
    switch (message.type) {
      case 'ACTION':
        if (!isReduxLike(store)) return;
        if (typeof message.payload !== "string") return;
        return parseJsonThen(message.payload, store.dispatch);

      case 'DISPATCH':
        if (!store.devtools) return;
        switch (message.payload.type) {
          case 'RESET': return store.devtools.init(initialState);
          case 'COMMIT': return store.devtools.init(store.getState());
          case 'ROLLBACK': return parseJsonThen(message.state, store.devtools.init);
          case 'JUMP_TO_STATE':
          case 'JUMP_TO_ACTION':
            return parseJsonThen(message.state, silentlySetState);
          case 'IMPORT_STATE':
            let { nextLiftedState } = message.payload;
            let lastComputedState = nextLiftedState.computedStates.at(-1)?.state
            if (!lastComputedState) return;
            silentlySetState(lastComputedState);
            store.devtools.send(null, nextLiftedState);
            return;

          default: pseudoAssertIs(message.payload.type, {} as UnknownString)    
        }
        return;

      default: pseudoAssertIs(message.type, {} as UnknownString)
    }
  })

  return initialState;
}
const devtools = devtoolsImpl as Devtools

// ============================================================================
// Utilities

const prefixFromName = (name: EDevtoolsStoreName) =>
  (name ? name + " > " : "") as EDevtoolsPrefix

const actionToSend = (action: EAction, prefix: EDevtoolsPrefix) =>
  ( typeof action === "undefined" ? { type: prefix + "setState" } :
    typeof action === "string" ? { type: prefix + action } :
    action
  ) as EActionToSend

type IsReduxLike = 
  <S extends EStore & EDevtoolsStore>(store: S) =>
    store is S & { isReduxLike: true, dispatch: (action: EAction) => void }

const isReduxLike = (store => store.isReduxLike) as IsReduxLike

  
type StringifiedJson<T> =
  string & { __isStringifiedJson: true, value: T }

const parseJsonThen = <T>(stringified: StringifiedJson<T>, f: (parsed: T) => void) => {
  let parsed: T | undefined
  let didParse = true;
  try {
    parsed = JSON.parse(stringified);
  } catch (e) {
    console.error("[zustand devtools middleware] Could not parse the received json", e)
    didParse = false;
  }
  if (didParse) f(parsed as T);
}

type UnknownString = { __isUnknownString: true }
type UnknownObject = { __isUnknownObject: true }


const pseudoAssertIs:
  <T, U>
    ( value: A.AreEqual<T, U> extends true ? T : "Error: Not equal to the type on right"
    , type: U
    ) =>
      void
  = () => {}

namespace O {
  export type Unknown =
    object;

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
      : false;
}

// ============================================================================
// Exports

export { devtools, DevtoolsOptions, DevtoolsStore }