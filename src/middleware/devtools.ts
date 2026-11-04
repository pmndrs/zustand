import type {} from '@redux-devtools/extension'
import type {
  StateCreator,
  StoreApi,
  StoreMutatorIdentifier,
} from '../vanilla.ts'

type Config = Parameters<
  (Window extends { __REDUX_DEVTOOLS_EXTENSION__?: infer T }
    ? T
    : { connect: (param: any) => unknown })['connect']
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

type WithDispatch = {
  dispatch: (...args: unknown[]) => void
  dispatchFromDevtools: unknown
}

const shouldDispatchFromDevtools = (api: unknown): api is WithDispatch =>
  !!(api as WithDispatch).dispatchFromDevtools &&
  typeof (api as WithDispatch).dispatch === 'function'

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

type Join<Prefix extends string, K extends string> = Prefix extends ''
  ? K
  : `${Prefix}${K}`

type NextPrefix<Prefix extends string, K extends string> = Prefix extends ''
  ? `${K}.`
  : `${Prefix}${K}.`

type FunctionPaths<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends (...args: any[]) => any
    ? Join<Prefix, K>
    : T[K] extends Record<string, any>
      ? FunctionPaths<T[K], NextPrefix<Prefix, K>> extends infer P
        ? P extends string
          ? P | `${Prefix}${K}.*` | `${Prefix}${K}.**`
          : never
        : never
      : never
}[keyof T & string]

type ActionCreators<T extends Record<string, any>> = {
  [K in FunctionPaths<T> | '*' | '**' | (string & {})]?:
    | boolean
    // Allow overriding leafs
    | (K extends '*' | '**' | `${string}.*` | `${string}.**`
        ? never
        : (...args: any[]) => void)
}

type ActionCreatorObject = {
  name: string
  func: (...args: any[]) => unknown
  args: string[]
}

// What the action dropdown sends, `args` and `rest` hold the text that was typed
type DropdownAction = {
  name: string
  args: (string | null | undefined)[]
  rest: string
}

export interface DevtoolsOptions<
  T extends Record<string, unknown> = Record<string, unknown>,
> extends Omit<Config, 'actionCreators'> {
  name?: string
  enabled?: boolean
  anonymousActionType?: string
  store?: string
  actionCreators?: ActionCreators<T>
}

type Devtools = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
  U = T,
>(
  initializer: StateCreator<T, [...Mps, ['zustand/devtools', never]], Mcs, U>,
  devtoolsOptions?: DevtoolsOptions<T & {}>,
) => StateCreator<T, Mps, [['zustand/devtools', never], ...Mcs], U>

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
  options: Omit<
    DevtoolsOptions,
    'enabled' | 'anonymousActionType' | 'store' | 'actionCreators'
  >,
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
  api: StoreInformation,
) => {
  if (store === undefined) return
  const connectionInfo = trackedConnections.get(name)
  if (connectionInfo?.stores[store] !== api) return
  delete connectionInfo.stores[store]
  if (Object.keys(connectionInfo.stores).length === 0) {
    trackedConnections.delete(name)
  }
}

// V8 (Chrome/Edge/Node): "at [async|new] <name> (<source>)"
const v8StackLineRe = /^at (?:new |async )?(.+?) \(/
// SpiderMonkey (Firefox) / JavaScriptCore (Safari): "<name>@<source>"
const geckoStackLineRe = /^([^@]+)@/

function findCallerName(stack: string | undefined) {
  if (!stack) return undefined
  const traceLines = stack.split('\n')
  const apiSetStateLineIndex = traceLines.findIndex((traceLine) =>
    traceLine.includes('api.setState'),
  )
  if (apiSetStateLineIndex < 0) return undefined
  const callerLine = traceLines[apiSetStateLineIndex + 1]?.trim() || ''
  return (
    v8StackLineRe.exec(callerLine)?.[1] ||
    geckoStackLineRe.exec(callerLine)?.[1]
  )
}

const devtoolsImpl: DevtoolsImpl =
  (fn, devtoolsOptions = {}) =>
  (set, get, api) => {
    const { enabled, anonymousActionType, store, actionCreators, ...options } =
      devtoolsOptions

    type S = ReturnType<typeof fn> & {
      [store: string]: ReturnType<typeof fn>
    }
    type PartialState = Partial<S> | ((s: S) => Partial<S>)

    let extensionConnector:
      (typeof window)['__REDUX_DEVTOOLS_EXTENSION__'] | false
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

    // Set once the initial state exists, as the action creators are in it. A
    // `setState` in the initializer is not sent, `init` would discard it anyway.
    let connection: Connection | undefined = undefined

    let isRecording = true
    api.setState = ((state, replace, nameOrAction: Action) => {
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
    let unsubscribeFromStore: (() => void) | undefined
    ;(api as StoreApi<S> & StoreDevtools<S>).devtools = {
      cleanup: () => {
        unsubscribeFromStore?.()
        unsubscribeFromStore = undefined
        removeStoreFromTrackedConnections(options.name, store, api)
        if (
          (store === undefined || !trackedConnections.has(options.name)) &&
          connection &&
          typeof (connection as any).unsubscribe === 'function'
        ) {
          ;(connection as any).unsubscribe()
        }
      },
    }

    const setStateFromDevtools: StoreApi<S>['setState'] = (...a) => {
      const originalIsRecording = isRecording
      isRecording = false
      set(...(a as Parameters<typeof set>))
      isRecording = originalIsRecording
    }

    const initialState = fn(api.setState, get, api)

    const actionCreatorObjects =
      actionCreators && getActionCreatorObjects(initialState, actionCreators)
    const connectOptions = { ...options, actionCreators: actionCreatorObjects }
    const connectionInformation = extractConnectionInformation(
      store,
      extensionConnector,
      connectOptions,
    )
    connection = connectionInformation.connection

    const findActionCreator = (name: string) => {
      const actionCreator = actionCreatorObjects?.find(
        (candidate) => candidate.name === name,
      )
      // With the `store` option, it may be the function of another store
      if (!actionCreator && actionCreators && store === undefined) {
        console.error(
          `[zustand devtools middleware] Action type "${name}" not found in actionCreators`,
        )
      }
      return actionCreator
    }

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

    if (shouldDispatchFromDevtools(api)) {
      let didWarnAboutReservedActionType = false
      const originalDispatch = api.dispatch
      api.dispatch = (...args: any[]) => {
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
        originalDispatch(...args)
      }
    }

    unsubscribeFromStore = (
      connection as unknown as {
        // FIXME https://github.com/reduxjs/redux-devtools/issues/1097
        subscribe: (
          listener: (message: Message) => void,
        ) => (() => void) | undefined
      }
    ).subscribe((message) => {
      const reviver =
        typeof options.serialize === 'object'
          ? options.serialize.reviver
          : undefined
      switch (message.type) {
        case 'ACTION': {
          // When using the action dropdown we get an object with the selected action
          if (typeof message.payload !== 'string') {
            if (shouldDispatchFromDevtools(api)) {
              console.error(
                '[zustand devtools middleware] The action dropdown is not supported with the redux middleware. ' +
                  'Dispatch a custom action in JSON format instead, e.g. { "type": "increment" }',
              )
              return
            }
            if (!actionCreators) {
              console.error(
                '[zustand devtools middleware] Unsupported action format',
              )
              return
            }
            const actionCreator = findActionCreator(message.payload.name)
            if (!actionCreator) return
            const args = parseDropdownArgs(message.payload, reviver)
            if (!args) return
            // Action creators are expected to cause the state change themselves.
            return actionCreator.func(...args)
          }

          let action: {
            type: string
            state?: PartialState
            [key: string]: unknown
          }
          try {
            action = JSON.parse(message.payload, reviver)
          } catch {
            let errorMessage = `[zustand devtools middleware] Malformed JSON. When dispatching custom actions, please format the payload as a JSON string.
              Examples:`
            if (shouldDispatchFromDevtools(api)) {
              errorMessage += `
              - { "type": "increment", "amount": 1 }
              - { "type": "reset" }
              `
            } else {
              errorMessage += `
              - { "type": "increment" }
              - { "type": "increment", "args": [1] }
              If you have args with default values or want to be \`undefined\`, prefer using the object syntax so you can omit them.
              - { "type": "increment", "args": { "amount": 1 } }
              `
            }
            console.error(errorMessage.replace(/\n\s+/g, '\n'))
            return
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
                )
                return
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
            if (stateFromDevtools === undefined || stateFromDevtools === null) {
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

          if (shouldDispatchFromDevtools(api)) {
            api.dispatch(action)
            return
          }

          const actionCreator = findActionCreator(action.type)
          if (!actionCreator) return
          const args = action.args as unknown[] | Record<string, unknown>
          return actionCreator.func(
            ...(Array.isArray(args)
              ? args
              : actionCreator.args.map((name) => args?.[name])),
          )
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
              return parseJsonThen<S>(message.state, reviver, (state) => {
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
              return parseJsonThen<S>(message.state, reviver, (state) => {
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

const parseJsonThen = <T>(
  stringified: string,
  reviver: ((key: string, value: unknown) => unknown) | undefined,
  fn: (parsed: T) => void,
) => {
  let parsed: T | undefined
  try {
    parsed = JSON.parse(stringified, reviver)
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
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    // `*` matches one level, `**` matches any depth
    .replace(/\*\*|\*/g, (wildcard) => (wildcard === '**' ? '.*' : '[^.]*'))

  return new RegExp(`^${escaped}$`)
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' &&
  value !== null &&
  Object.getPrototypeOf(value) === Object.prototype

type StateFunction = [path: string, func: ActionCreatorObject['func']]

// Functions in the state with their dot notation paths. Each object is walked
// once and counts as empty during its own walk, which stops circular references.
// An object shared between paths is still found under each of them.
const getStateFunctions = (
  state: unknown,
  walked = new Map<unknown, StateFunction[]>(),
): StateFunction[] => {
  if (!isPlainObject(state)) return []
  const known = walked.get(state)
  if (known) return known
  walked.set(state, [])
  const functions: StateFunction[] = []
  for (const key of Object.keys(state)) {
    // Getters are skipped, as they may need a state that does not exist yet
    const value = Object.getOwnPropertyDescriptor(state, key)?.value
    if (typeof value === 'function') {
      functions.push([key, value])
    } else {
      for (const [path, func] of getStateFunctions(value, walked)) {
        functions.push([`${key}.${path}`, func])
      }
    }
  }
  walked.set(state, functions)
  return functions
}

// Parameter names of a function, for the inputs of the action dropdown and for
// custom actions passing `args` by name. Only its source has them.
const getParamNames = (func: ActionCreatorObject['func']): string[] => {
  const source = func.toString().replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '')
  const arrowParam = /^(?:async\s+)?([^\s(=]+)\s*=>/.exec(source)?.[1]
  if (arrowParam) return [arrowParam]

  const params = ['']
  let depth = 0
  let inDefaultValue = false
  for (const char of source.slice(source.indexOf('(') + 1)) {
    if (depth === 0) {
      if (char === ')') break
      if (char === ',') {
        params.push('')
        inDefaultValue = false
        continue
      }
      if (char === '=') inDefaultValue = true
    }
    if ('([{'.includes(char)) depth++
    if (')]}'.includes(char)) depth--
    if (!inDefaultValue) params[params.length - 1] += char
  }
  return (
    params
      .map((param) => param.trim())
      // The action dropdown has its own input for `...rest`
      .filter((param) => param && !param.startsWith('...'))
  )
}

const createActionCreatorObject = (
  name: string,
  func: ActionCreatorObject['func'],
): ActionCreatorObject => ({ name, func, args: getParamNames(func) })

function getActionCreatorObjects(
  state: unknown,
  actionCreators: ActionCreators<Record<string, unknown>>,
): ActionCreatorObject[] {
  const actions = new Map<string, ActionCreatorObject>()

  // Sort matchers by specificity
  const matchers = Object.entries(actionCreators)
    .map(([key, picked]) => ({
      matcher: maskToRegex(key),
      picked,
      key,
    }))
    .sort((a, b) => {
      const aIsDoubleWildcard = a.key.includes('**')
      const bIsDoubleWildcard = b.key.includes('**')
      if (aIsDoubleWildcard !== bIsDoubleWildcard) {
        return aIsDoubleWildcard ? -1 : 1
      }

      const aIsSingleWildcard = a.key.includes('*') && !aIsDoubleWildcard
      const bIsSingleWildcard = b.key.includes('*') && !bIsDoubleWildcard
      if (aIsSingleWildcard !== bIsSingleWildcard) {
        return aIsSingleWildcard ? -1 : 1
      }

      return a.key.length - b.key.length
    })

  for (const [name, func] of getStateFunctions(state)) {
    for (const { matcher, picked } of matchers) {
      if (matcher.test(name)) {
        if (picked === false) {
          actions.delete(name)
          continue
        }

        actions.set(name, createActionCreatorObject(name, func))
      }
    }
  }

  // Functions in the option replace the ones in the state or add new ones
  for (const [name, picked] of Object.entries(actionCreators)) {
    if (typeof picked === 'function') {
      actions.set(name, createActionCreatorObject(name, picked))
    }
  }

  return Array.from(actions.values())
}

// An argument left empty arrives as `undefined`, or as `null` if it went through
// JSON on the way from the extension
const parseDropdownArgs = (
  { args, rest }: DropdownAction,
  reviver: ((key: string, value: unknown) => unknown) | undefined,
): unknown[] | undefined => {
  const parse = (arg: string | null | undefined): unknown =>
    arg ? JSON.parse(arg, reviver) : undefined
  try {
    const restArgs = parse(rest) ?? []
    if (!Array.isArray(restArgs)) throw new Error('...rest is not an array')
    return [...args.map(parse), ...restArgs]
  } catch (e) {
    console.error(
      '[zustand devtools middleware] Could not parse the arguments from the action dropdown. ' +
        'Each one must be JSON, e.g. 5, "foo" or { "by": 5 }, and ...rest a JSON array.',
      e,
    )
    return undefined
  }
}
