import type {} from '@redux-devtools/extension'
import type { ActionCreatorObject } from '@redux-devtools/utils';

import type {
  StateCreator,
  StoreApi,
  StoreMutatorIdentifier,
} from '../vanilla.ts'

type Config = Parameters<
  (Window extends { __REDUX_DEVTOOLS_EXTENSION__?: infer T }
    ? T
    : { connect: (param: any) => any })['connect']
>[0]

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
    ? [...args0: Cast<T, unknown[]>, arg1: undefined]
    : T extends { length: 0 | 1 }
      ? [...args0: Cast<T, unknown[]>, arg1: undefined]
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

type Action =
  | string
  | {
      type: string
      [x: string | number | symbol]: unknown
    }
type StoreDevtools<S> = S extends {
  setState: {
    // capture both overloads of setState
    (...args: infer Sa1): infer Sr1
    (...args: infer Sa2): infer Sr2
  }
}
  ? {
      setState(...args: [...args: TakeTwo<Sa1>, action?: Action]): Sr1
      setState(...args: [...args: TakeTwo<Sa2>, action?: Action]): Sr2
      devtools: {
        cleanup: () => void
      }
    }
  : never

type Join<Prefix extends string, K extends string> = Prefix extends ""
  ? K
  : `${Prefix}${K}`;

type NextPrefix<Prefix extends string, K extends string> = Prefix extends ""
  ? `${K}.`
  : `${Prefix}${K}.`;

type FunctionPaths<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends (...args: any[]) => any
    ? Join<Prefix, K>
    : T[K] extends Record<string, any>
      ? FunctionPaths<T[K], NextPrefix<Prefix, K>> extends infer P
        ? P extends string
          ?
            | P
            | `${Prefix}${K}.*`
            | `${Prefix}${K}.**`
          : never
        : never
      : never;
}[keyof T & string];

type ActionCreatorsMask<T extends Record<string, any>> = {
  [K in FunctionPaths<T> | '*' | '**' | (string & {})]?: boolean | (
    // Allow overriding leafs
    K extends '*' | '**' | `${string}.*` | `${string}.**`
      ? never
      : (...args: any[]) => void
  );
};

export interface DevtoolsOptions<T extends Record<string, unknown> = {}> extends Omit<Config, 'actionCreators'> {
  name?: string
  enabled?: boolean
  anonymousActionType?: string
  store?: string
  actionCreators?: ActionCreatorsMask<T>;
}

type Devtools = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
  U = T,
>(
  initializer: StateCreator<T, [...Mps, ['zustand/devtools', never]], Mcs, U>,
  devtoolsOptions?: DevtoolsOptions<T & {}>,
) => StateCreator<T, Mps, [['zustand/devtools', never], ...Mcs]>

declare module '../vanilla' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface StoreMutators<S, A> {
    'zustand/devtools': WithDevtools<S>
  }
}

type DevtoolsImpl = <T>(
  storeInitializer: StateCreator<T, [], []>,
  devtoolsOptions?: DevtoolsOptions,
) => StateCreator<T, [], []>

export type NamedSet<T> = WithDevtools<StoreApi<T>>['setState']

type Connection = ReturnType<
  NonNullable<Window['__REDUX_DEVTOOLS_EXTENSION__']>['connect']
>
type ConnectionName = string | undefined
type StoreName = string
type StoreInformation = StoreApi<unknown>
type ConnectionInformation = {
  connection: Connection
  stores: Record<StoreName, StoreInformation>
}

const trackedConnections: Map<ConnectionName, ConnectionInformation> = new Map()

const getTrackedConnectionState = (
  name: string | undefined,
): Record<string, any> => {
  const api = trackedConnections.get(name)
  if (!api) return {}
  return Object.fromEntries(
    Object.entries(api.stores).map(([key, api]) => [key, api.getState()]),
  )
}

const extractConnectionInformation = (
  store: string | undefined,
  extensionConnector: NonNullable<
    (typeof window)['__REDUX_DEVTOOLS_EXTENSION__']
  >,
  options: Omit<DevtoolsOptions, 'enabled' | 'anonymousActionType' | 'store' | 'actionCreators'>,
) => {
  if (store === undefined) {
    return {
      type: 'untracked' as const,
      connection: extensionConnector.connect(options),
    }
  }
  const existingConnection = trackedConnections.get(options.name)
  if (existingConnection) {
    return { type: 'tracked' as const, store, ...existingConnection }
  }
  const newConnection: ConnectionInformation = {
    connection: extensionConnector.connect(options),
    stores: {},
  }
  trackedConnections.set(options.name, newConnection)
  return { type: 'tracked' as const, store, ...newConnection }
}

const removeStoreFromTrackedConnections = (
  name: string | undefined,
  store: string | undefined,
) => {
  if (store === undefined) return
  const connectionInfo = trackedConnections.get(name)
  if (!connectionInfo) return
  delete connectionInfo.stores[store]
  if (Object.keys(connectionInfo.stores).length === 0) {
    trackedConnections.delete(name)
  }
}

const findCallerName = (stack: string | undefined) => {
  if (!stack) return undefined
  const traceLines = stack.split('\n')
  const apiSetStateLineIndex = traceLines.findIndex((traceLine) =>
    traceLine.includes('api.setState'),
  )
  if (apiSetStateLineIndex < 0) return undefined
  const callerLine = traceLines[apiSetStateLineIndex + 1]?.trim() || ''
  return /.+ (.+) .+/.exec(callerLine)?.[1]
}

const devtoolsImpl: DevtoolsImpl =
  (fn, devtoolsOptions = {}) =>
  (set, get, api) => {
    const { enabled, anonymousActionType, store, ...options } = devtoolsOptions

    type S = ReturnType<typeof fn> & {
      [store: string]: ReturnType<typeof fn>
    }
    type PartialState = Partial<S> | ((s: S) => Partial<S>)

    let extensionConnector:
      | (typeof window)['__REDUX_DEVTOOLS_EXTENSION__']
      | false
    try {
      extensionConnector =
        (enabled ?? import.meta.env?.MODE !== 'production') &&
        window.__REDUX_DEVTOOLS_EXTENSION__
    } catch {
      // ignored
    }

    if (!extensionConnector) {
      return fn(set, get, api)
    }

    let isRecording = true
    ;(api.setState as any) = ((state, replace, nameOrAction: Action) => {
      const r = set(state, replace as any)
      if (!isRecording) return r
      const action: { type: string } =
        nameOrAction === undefined
          ? {
              type:
                anonymousActionType ||
                findCallerName(new Error().stack) ||
                'anonymous',
            }
          : typeof nameOrAction === 'string'
            ? { type: nameOrAction }
            : nameOrAction
      if (store === undefined) {
        connection?.send(action, get())
        return r
      }
      connection?.send(
        {
          ...action,
          type: `${store}/${action.type}`,
        },
        {
          ...getTrackedConnectionState(options.name),
          [store]: api.getState(),
        },
      )
      return r
    }) as NamedSet<S>
    ;(api as StoreApi<S> & StoreDevtools<S>).devtools = {
      cleanup: () => {
        if (
          connection &&
          typeof (connection as any).unsubscribe === 'function'
        ) {
          ;(connection as any).unsubscribe()
        }
        removeStoreFromTrackedConnections(options.name, store)
      },
    }

    const setStateFromDevtools: StoreApi<S>['setState'] = (...a) => {
      const originalIsRecording = isRecording
      isRecording = false
      set(...(a as Parameters<typeof set>))
      isRecording = originalIsRecording
    }

    const initialState = fn(api.setState, get, api)
    let actionCreators: ActionCreatorObject[] = [];
    let evalAction: (action: string, _actionCreators: ActionCreatorObject[]) => void | undefined;

    if (options.actionCreators) {
      try {
        evalAction = require('@redux-devtools/utils').evalAction;
        actionCreators = getActionsArray(
          initialState as Record<string, unknown>,
          options.actionCreators as ActionCreatorsMask<{}>
        );
        // override to pass it to the extension connector, any is ok, we dont care about the type anymore
        options.actionCreators = actionCreators as any;
      } catch {
        console.warn('[zustand devtools middleware] Please install @redux-devtools/utils to use actionCreators in devtools middleware');
      }
    }
    
    let usingReduxMiddleware = typeof (api as any).dispatch === 'function';
    if (!usingReduxMiddleware) {
      (api as any).dispatchFromDevtools = true;
      (api as any).dispatch = (payload: {
        type: string,
        args: unknown[] | Record<string, unknown>
      }) => {
        if (!evalAction) {
          console.warn('[zustand devtools middleware] Please install @redux-devtools/utils to use the action dropdown in the devtools');
          return;
        }

        if (!('type' in payload)) {
          console.error('[zustand devtools middleware] Payload must have a "type" property which should match an action creator');
          return;
        }

        const action = actionCreators.find((action) => action.name === payload.type);
        if (!action) {
          console.error(`[zustand devtools middleware] Action type "${payload.type}" not found in actionCreators`);
          return;
        }

        if(Array.isArray(payload.args)) {
          return action.func(...payload.args);
        }
        
        return action.func(...action.args.map((arg) => (payload.args as Record<string, unknown> ?? {})[arg]));
      }
    }

    // We connect after extracting action creators from the initial state
    const { connection, ...connectionInformation } = extractConnectionInformation(store, extensionConnector, options);

    if (connectionInformation.type === 'untracked') {
      connection?.init(initialState)
    } else {
      connectionInformation.stores[connectionInformation.store] = api
      connection?.init(
        Object.fromEntries(
          Object.entries(connectionInformation.stores).map(([key, store]) => [
            key,
            key === connectionInformation.store
              ? initialState
              : store.getState(),
          ]),
        ),
      )
    }

    if (
      (api as any).dispatchFromDevtools &&
      typeof (api as any).dispatch === 'function'
    ) {
      let didWarnAboutReservedActionType = false
      const originalDispatch = (api as any).dispatch
      ;(api as any).dispatch = (...args: any[]) => {
        if (
          import.meta.env?.MODE !== 'production' &&
          args[0].type === '__setState' &&
          !didWarnAboutReservedActionType
        ) {
          console.warn(
            '[zustand devtools middleware] "__setState" action type is reserved ' +
              'to set state from the devtools. Avoid using it.',
          )
          didWarnAboutReservedActionType = true
        }
        ;(originalDispatch as any)(...args)
      }
    }

    ;(
      connection as unknown as {
        // FIXME https://github.com/reduxjs/redux-devtools/issues/1097
        subscribe: (
          listener: (message: Message) => void,
        ) => (() => void) | undefined
      }
    ).subscribe((message: any) => {
      switch (message.type) {
        case 'ACTION': {
          // When using the action dropdown we get an object with the selected action
          if (typeof message.payload !== 'string') {
            if (!evalAction) {
              console.warn('[zustand devtools middleware] Please install @redux-devtools/utils to use the action dropdown in the devtools');
              return;
            }

            if (usingReduxMiddleware) {
              // When using the redux plugin, we dispatch the action ourselves.
              const action = evalAction(message.payload, actionCreators as any[]);
              if (!(api as any).dispatchFromDevtools) return
              if (typeof (api as any).dispatch !== 'function') return
              return (api as any).dispatch(action);
            } 

            // When not using the redux plugin, action creators are expected
            // to cause the state change themselves.
            if (!(api as any).dispatchFromDevtools) return
            return evalAction(message.payload, actionCreators as any[]);
          }

          let action: { type: string, state?: PartialState, [key: string]: unknown };
          try {
            action = JSON.parse(message.payload);
          } catch {
            let errorMessage = `[zustand devtools middleware] Malformed JSON. When dispatching custom actions, please format the payload as a JSON string.
              Examples:`;
            if (usingReduxMiddleware) {
              errorMessage += `
              - { "type": "increment", "amount": 1 }
              - { "type": "reset" }
              `;
            } else {
              errorMessage += `
              - { "type": "increment" }
              - { "type": "increment", "args": [1] }
              If you have args with default values or want to be \`undefined\`, prefer using the object syntax so you can omit them.
              - { "type": "increment", "args": { "amount": 1 } }
              `;
            }
            console.error(errorMessage.replace(/\n\s+/g, '\n'));
            return;
          }

          if (action.type === '__setState') {
            if (store === undefined) {
              if (!('state' in action)) {
                console.warn(
                  `
                  [zustand devtools middleware] Calling __setState without a state property.
                  This may not be what you intended, you should explicitly set the state you want to set.
                  Example: { "type": "__setState", "state": { "foo": "bar" } }
                  `.replace(/\n\s+/g, '\n'),
                );
                return;
              }
              setStateFromDevtools(action.state as PartialState)
              return
            }
            if (Object.keys(action.state as S).length !== 1) {
              console.error(
                `
                [zustand devtools middleware] Unsupported __setState action format.
                When using 'store' option in devtools(), the 'state' should have only one key, which is a value of 'store' that was passed in devtools(),
                and value of this only key should be a state object. Example: { "type": "__setState", "state": { "abc123Store": { "foo": "bar" } } }
                `.replace(/\n\s+/g, '\n'),
              )
            }
            const stateFromDevtools = (action.state as S)[store]
            if (
              stateFromDevtools === undefined ||
              stateFromDevtools === null
            ) {
              return
            }
            if (
              JSON.stringify(api.getState()) !==
              JSON.stringify(stateFromDevtools)
            ) {
              setStateFromDevtools(stateFromDevtools)
            }
            return
          }

          if (!(api as any).dispatchFromDevtools) return
          if (typeof (api as any).dispatch !== 'function') return
          ;(api as any).dispatch(action)
          return;
        }
        case 'DISPATCH':
          switch (message.payload.type) {
            case 'RESET':
              setStateFromDevtools(initialState as S)
              if (store === undefined) {
                return connection?.init(api.getState())
              }
              return connection?.init(getTrackedConnectionState(options.name))

            case 'COMMIT':
              if (store === undefined) {
                connection?.init(api.getState())
                return
              }
              return connection?.init(getTrackedConnectionState(options.name))

            case 'ROLLBACK':
              return parseJsonThen<S>(message.state, (state) => {
                if (store === undefined) {
                  setStateFromDevtools(state)
                  connection?.init(api.getState())
                  return
                }
                setStateFromDevtools(state[store] as S)
                connection?.init(getTrackedConnectionState(options.name))
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
              connection?.send(
                null as any, // FIXME no-any
                nextLiftedState,
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

const parseJsonThen = <T>(stringified: string, fn: (parsed: T) => void) => {
  let parsed: T | undefined
  try {
    parsed = JSON.parse(stringified)
  } catch (e) {
    console.error(
      '[zustand devtools middleware] Could not parse the received json',
      e,
    )
  }
  if (parsed !== undefined) fn(parsed as T)
}

function maskToRegex(mask: string): RegExp {
  const escaped = mask
    .replace(/\./g, '\\.')
    .replace(/\*\*|\*/g, '.*');

  return new RegExp(`^${escaped}$`);
}

function getActionsArray<T extends Record<string, any>>(actionCreators: T, mask: ActionCreatorsMask<T>): ActionCreatorObject[] {
  const getActions = require('@redux-devtools/utils').getActionsArray;
  const flat = getActions(actionCreators);
  const actions = new Map<string, ActionCreatorObject>();
  const customActions = new Map<string, ActionCreatorObject>(
    getActions(mask).map((action: ActionCreatorObject) => [action.name, action])
  );

  // Sort matchers by specificity
  const matchers = Object.entries(mask ?? {})
    .map(([key, picked]) => ({
      matcher: maskToRegex(key),
      picked,
      key,
    })).toSorted((a, b) => {
      const aIsDoubleWildcard = a.key.includes('**');
      const bIsDoubleWildcard = b.key.includes('**');
      if (aIsDoubleWildcard !== bIsDoubleWildcard) {
        return aIsDoubleWildcard ? -1 : 1;
      }
      
      const aIsSingleWildcard = a.key.includes('*') && !aIsDoubleWildcard;
      const bIsSingleWildcard = b.key.includes('*') && !bIsDoubleWildcard;
      if (aIsSingleWildcard !== bIsSingleWildcard) {
        return aIsSingleWildcard ? -1 : 1;
      }
      
      return a.key.length - b.key.length;
    });

  for (const action of flat) {
    for (const { matcher, picked } of matchers) {
      if (matcher.test(action.name)) {
        if (picked === false) {
          actions.delete(action.name);
          continue;
        }

        actions.set(action.name, customActions.get(action.name) ?? {
          name: action.name,
          func: typeof picked === 'function' ? picked : action.func,
          args: action.args,
        });
      }
    }
  }

  for (const [name, action] of customActions.entries()) {
    actions.set(name, action);
  }

  return Array.from(actions.values());
}
