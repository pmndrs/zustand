import {
  EqualityChecker,
  GetState,
  PartialState,
  SetState,
  State,
  StateListener,
  StateSelector,
  StateSliceListener,
  StoreApi,
  Subscribe,
} from './vanilla'

const DEVTOOLS = Symbol()

type DevtoolsType = {
  prefix: string
  subscribe: (dispatch: any) => () => void
  unsubscribe: () => void
  send: (action: string, state: any) => void
  init: (state: any) => void
  error: (payload: any) => void
}

export type StoreApiWithRedux<
  T extends State,
  A extends { type: unknown }
> = StoreApi<T & { dispatch: (a: A) => A }> & {
  dispatch: (a: A) => A
}

export const redux =
  <S extends State, A extends { type: unknown }>(
    reducer: (state: S, action: A) => S,
    initial: S
  ) =>
  (
    set: SetState<S & { dispatch: (a: A) => A }>,
    get: GetState<S & { dispatch: (a: A) => A }>,
    api: StoreApiWithRedux<S, A> & { devtools?: DevtoolsType }
  ): S & { dispatch: (a: A) => A } => {
    api.dispatch = (action: A) => {
      set((state: S) => reducer(state, action))
      if (api.devtools) {
        api.devtools.send(api.devtools.prefix + action.type, get())
      }
      return action
    }
    return { dispatch: api.dispatch, ...initial }
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

export type StoreApiWithSubscribeWithSelector<T extends State> = Omit<
  StoreApi<T>,
  'subscribe' // FIXME remove omit in v4
> & {
  subscribe: {
    (listener: StateListener<T>): () => void
    <StateSlice>(
      selector: StateSelector<T, StateSlice>,
      listener: StateSliceListener<StateSlice>,
      options?: {
        equalityFn?: EqualityChecker<StateSlice>
        fireImmediately?: boolean
      }
    ): () => void
  }
}

export const subscribeWithSelector =
  <
    S extends State,
    CustomSetState extends SetState<S>,
    CustomGetState extends GetState<S>,
    CustomStoreApi extends StoreApi<S>
  >(
    fn: (set: CustomSetState, get: CustomGetState, api: CustomStoreApi) => S
  ) =>
  (
    set: CustomSetState,
    get: CustomGetState,
    api: Omit<CustomStoreApi, 'subscribe'> & // FIXME remove omit in v4
      StoreApiWithSubscribeWithSelector<S>
  ): S => {
    const origSubscribe = api.subscribe as Subscribe<S>
    api.subscribe = ((selector: any, optListener: any, options: any) => {
      let listener: StateListener<S> = selector // if no selector
      if (optListener) {
        const equalityFn = options?.equalityFn || Object.is
        let currentSlice = selector(api.getState())
        listener = (state) => {
          const nextSlice = selector(state)
          if (!equalityFn(currentSlice, nextSlice)) {
            const previousSlice = currentSlice
            optListener((currentSlice = nextSlice), previousSlice)
          }
        }
        if (options?.fireImmediately) {
          optListener(currentSlice, currentSlice)
        }
      }
      return origSubscribe(listener)
    }) as any
    const initialState = fn(
      set,
      get,
      api as CustomStoreApi // FIXME can remove in v4?
    )
    return initialState
  }

type Combine<T, U> = Omit<T, keyof U> & U

export const combine =
  <PrimaryState extends State, SecondaryState extends State>(
    initialState: PrimaryState,
    create: (
      // Note: NamedSet added for convenience
      set: SetState<PrimaryState> & NamedSet<PrimaryState>,
      get: GetState<PrimaryState>,
      api: StoreApi<PrimaryState>
    ) => SecondaryState
  ) =>
  (
    set: SetState<Combine<PrimaryState, SecondaryState>>,
    get: GetState<Combine<PrimaryState, SecondaryState>>,
    api: StoreApi<Combine<PrimaryState, SecondaryState>>
  ) =>
    Object.assign(
      {},
      initialState,
      create(set as any, get as any, api as any)
    ) as Combine<PrimaryState, SecondaryState>

type DeepPartial<T extends Object> = {
  [P in keyof T]?: DeepPartial<T[P]>
}
export type StateStorage = {
  getItem: (name: string) => string | null | Promise<string | null>
  setItem: (name: string, value: string) => void | Promise<void>
  // Note: This will be required in v4
  removeItem?: (name: string) => void | Promise<void>
}
type StorageValue<S> = { state: DeepPartial<S>; version?: number }
export type PersistOptions<
  S,
  PersistedState extends Partial<S> = Partial<S>
> = {
  /** Name of the storage (must be unique) */
  name: string
  /**
   * A function returning a storage.
   * The storage must fit `window.localStorage`'s api (or an async version of it).
   * For example the storage could be `AsyncStorage` from React Native.
   *
   * @default () => localStorage
   */
  getStorage?: () => StateStorage
  /**
   * Use a custom serializer.
   * The returned string will be stored in the storage.
   *
   * @default JSON.stringify
   */
  serialize?: (state: StorageValue<S>) => string | Promise<string>
  /**
   * Use a custom deserializer.
   * Must return an object matching StorageValue<State>
   *
   * @param str The storage's current value.
   * @default JSON.parse
   */
  deserialize?: (
    str: string
  ) => StorageValue<PersistedState> | Promise<StorageValue<PersistedState>>
  /**
   * Prevent some items from being stored.
   *
   * @deprecated This options is deprecated and will be removed in the next version. Please use the `partialize` option instead.
   */
  blacklist?: (keyof S)[]
  /**
   * Only store the listed properties.
   *
   * @deprecated This options is deprecated and will be removed in the next version. Please use the `partialize` option instead.
   */
  whitelist?: (keyof S)[]
  /**
   * Filter the persisted value.
   *
   * @params state The state's value
   */
  partialize?: (state: S) => DeepPartial<S>
  /**
   * A function returning another (optional) function.
   * The main function will be called before the state rehydration.
   * The returned function will be called after the state rehydration or when an error occurred.
   */
  onRehydrateStorage?: (state: S) => ((state?: S, error?: Error) => void) | void
  /**
   * If the stored state's version mismatch the one specified here, the storage will not be used.
   * This is useful when adding a breaking change to your store.
   */
  version?: number
  /**
   * A function to perform persisted state migration.
   * This function will be called when persisted state versions mismatch with the one specified here.
   */
  migrate?: (persistedState: any, version: number) => S | Promise<S>
  /**
   * A function to perform custom hydration merges when combining the stored state with the current one.
   * By default, this function does a shallow merge.
   */
  merge?: (persistedState: any, currentState: S) => S
}
export type StoreApiWithPersist<S extends State> = StoreApi<S> & {
  persist: {
    setOptions: (options: Partial<PersistOptions<S>>) => void
    clearStorage: () => void
    rehydrate: () => Promise<void>
    hasHydrated: () => boolean
    onHydrate: (fn: (state: S) => void) => void
  }
}

type Thenable<Value> = {
  then<V>(
    onFulfilled: (value: Value) => V | Promise<V> | Thenable<V>
  ): Thenable<V>
  catch<V>(
    onRejected: (reason: Error) => V | Promise<V> | Thenable<V>
  ): Thenable<V>
}

const toThenable =
  <Result, Input>(
    fn: (input: Input) => Result | Promise<Result> | Thenable<Result>
  ) =>
  (input: Input): Thenable<Result> => {
    try {
      const result = fn(input)
      if (result instanceof Promise) {
        return result as Thenable<Result>
      }
      return {
        then(onFulfilled) {
          return toThenable(onFulfilled)(result as Result)
        },
        catch(_onRejected) {
          return this as Thenable<any>
        },
      }
    } catch (e: any) {
      return {
        then(_onFulfilled) {
          return this as Thenable<any>
        },
        catch(onRejected) {
          return toThenable(onRejected)(e)
        },
      }
    }
  }

export const persist =
  <
    S extends State,
    CustomSetState extends SetState<S>,
    CustomGetState extends GetState<S>,
    CustomStoreApi extends StoreApi<S>
  >(
    config: (
      set: CustomSetState,
      get: CustomGetState,
      api: CustomStoreApi
    ) => S,
    baseOptions: PersistOptions<S>
  ) =>
  (
    set: CustomSetState,
    get: CustomGetState,
    api: CustomStoreApi & StoreApiWithPersist<S>
  ): S => {
    let options = {
      getStorage: () => localStorage,
      serialize: JSON.stringify as (state: StorageValue<S>) => string,
      deserialize: JSON.parse as (str: string) => StorageValue<Partial<S>>,
      partialize: (state: S) => state,
      version: 0,
      merge: (persistedState: any, currentState: S) => ({
        ...currentState,
        ...persistedState,
      }),
      ...baseOptions,
    }

    if (options.blacklist || options.whitelist) {
      console.warn(
        `The ${
          options.blacklist ? 'blacklist' : 'whitelist'
        } option is deprecated and will be removed in the next version. Please use the 'partialize' option instead.`
      )
    }

    let hasHydrated = false
    const onHydrateCallbacks: Parameters<
      StoreApiWithPersist<S>['persist']['onHydrate']
    >[0][] = []
    let storage: StateStorage | undefined

    try {
      storage = options.getStorage()
    } catch (e) {
      // prevent error if the storage is not defined (e.g. when server side rendering a page)
    }

    if (!storage) {
      return config(
        ((...args) => {
          console.warn(
            `[zustand persist middleware] Unable to update item '${options.name}', the given storage is currently unavailable.`
          )
          set(...args)
        }) as CustomSetState,
        get,
        api
      )
    } else if (!storage.removeItem) {
      console.warn(
        `[zustand persist middleware] The given storage for item '${options.name}' does not contain a 'removeItem' method, which will be required in v4.`
      )
    }

    const thenableSerialize = toThenable(options.serialize)

    const setItem = (): Thenable<void> => {
      const state = options.partialize({ ...get() })

      if (options.whitelist) {
        ;(Object.keys(state) as (keyof S)[]).forEach((key) => {
          !options.whitelist?.includes(key) && delete state[key]
        })
      }
      if (options.blacklist) {
        options.blacklist.forEach((key) => delete state[key])
      }

      let errorInSync: Error | undefined
      const thenable = thenableSerialize({ state, version: options.version })
        .then((serializedValue) =>
          (storage as StateStorage).setItem(options.name, serializedValue)
        )
        .catch((e) => {
          errorInSync = e
        })
      if (errorInSync) {
        throw errorInSync
      }
      return thenable
    }

    const savedSetState = api.setState

    api.setState = (state, replace) => {
      savedSetState(state, replace)
      void setItem()
    }

    const configResult = config(
      ((...args) => {
        set(...args)
        void setItem()
      }) as CustomSetState,
      get,
      api
    )

    // a workaround to solve the issue of not storing rehydrated state in sync storage
    // the set(state) value would be later overridden with initial state by create()
    // to avoid this, we merge the state from localStorage into the initial state.
    let stateFromStorage: S | undefined

    // rehydrate initial state with existing stored state
    const hydrate = () => {
      if (!storage) return

      hasHydrated = false

      const postRehydrationCallback =
        options.onRehydrateStorage?.(get()) || undefined

      // bind is used to avoid `TypeError: Illegal invocation` error
      return toThenable(storage.getItem.bind(storage))(options.name)
        .then((storageValue) => {
          if (storageValue) {
            return options.deserialize(storageValue)
          }
        })
        .then((deserializedStorageValue) => {
          if (deserializedStorageValue) {
            if (
              typeof deserializedStorageValue.version === 'number' &&
              deserializedStorageValue.version !== options.version
            ) {
              if (options.migrate) {
                return options.migrate(
                  deserializedStorageValue.state,
                  deserializedStorageValue.version
                )
              }
              console.error(
                `State loaded from storage couldn't be migrated since no migrate function was provided`
              )
            } else {
              return deserializedStorageValue.state
            }
          }
        })
        .then((migratedState) => {
          stateFromStorage = options.merge(migratedState as S, configResult)

          set(stateFromStorage as S, true)
          return setItem()
        })
        .then(() => {
          postRehydrationCallback?.(stateFromStorage, undefined)
          hasHydrated = true
          onHydrateCallbacks.forEach((cb) => cb(stateFromStorage as S))
        })
        .catch((e: Error) => {
          postRehydrationCallback?.(undefined, e)
        })
    }

    api.persist = {
      setOptions: (newOptions) => {
        options = {
          ...options,
          ...newOptions,
        }

        if (newOptions.getStorage) {
          storage = newOptions.getStorage()
        }
      },
      clearStorage: () => {
        storage?.removeItem?.(options.name)
      },
      rehydrate: () => hydrate() as Promise<void>,
      hasHydrated: () => hasHydrated,
      onHydrate: (cb) => {
        onHydrateCallbacks.push(cb)
      },
    }

    hydrate()

    return stateFromStorage || configResult
  }
