import {
  GetState,
  PartialState,
  SetState,
  State,
  StateCreator,
  StoreApi,
} from './vanilla'

export const redux = <S extends State, A extends { type: unknown }>(
  reducer: (state: S, action: A) => S,
  initial: S
) => (
  set: SetState<S>,
  get: GetState<S>,
  api: StoreApi<S> & {
    dispatch?: (a: A) => A
    devtools?: any
  }
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

type NamedSet<S extends State> = (
  partial: PartialState<S>,
  replace?: boolean,
  name?: string
) => void

export const devtools = <S extends State>(
  fn: (set: NamedSet<S>, get: GetState<S>, api: StoreApi<S>) => S,
  prefix?: string
) => (
  set: SetState<S>,
  get: GetState<S>,
  api: StoreApi<S> & { dispatch?: unknown; devtools?: any }
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
    api.devtools = null
    return fn(set, get, api)
  }
  const namedSet: NamedSet<S> = (state, replace, name) => {
    set(state, replace)
    if (!api.dispatch) {
      api.devtools.send(api.devtools.prefix + (name || 'action'), get())
    }
  }
  const initialState = fn(namedSet, get, api)
  if (!api.devtools) {
    const savedSetState = api.setState
    api.setState = (state: PartialState<S>, replace?: boolean) => {
      savedSetState(state, replace)
      api.devtools.send(api.devtools.prefix + 'setState', api.getState())
    }
    api.devtools = extension.connect({ name: prefix })
    api.devtools.prefix = prefix ? `${prefix} > ` : ''
    api.devtools.subscribe((message: any) => {
      if (message.type === 'DISPATCH' && message.state) {
        const ignoreState =
          message.payload.type === 'JUMP_TO_ACTION' ||
          message.payload.type === 'JUMP_TO_STATE'
        if (!api.dispatch && !ignoreState) {
          api.setState(JSON.parse(message.state))
        } else {
          savedSetState(JSON.parse(message.state))
        }
      } else if (
        message.type === 'DISPATCH' &&
        message.payload?.type === 'COMMIT'
      ) {
        api.devtools.init(api.getState())
      }
    })
    api.devtools.init(initialState)
  }
  return initialState
}

export const combine = <
  PrimaryState extends State,
  SecondaryState extends State
>(
  initialState: PrimaryState,
  create: (
    set: SetState<PrimaryState>,
    get: GetState<PrimaryState>,
    api: StoreApi<PrimaryState>
  ) => SecondaryState
): StateCreator<PrimaryState & SecondaryState> => (set, get, api) =>
  Object.assign(
    {},
    initialState,
    create(
      set as SetState<PrimaryState>,
      get as GetState<PrimaryState>,
      api as StoreApi<PrimaryState>
    )
  )

type StateStorage = {
  getItem: (name: string) => string | null | Promise<string | null>
  setItem: (name: string, value: string) => void | Promise<void>
}
type StorageValue<S> = { state: S; version: number }
type PersistOptions<S> = {
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
   *
   * @param str The storage's current value.
   * @default JSON.parse
   */
  deserialize?: (str: string) => StorageValue<S> | Promise<S>
  /**
   * Prevent some items from being stored.
   */
  blacklist?: (keyof S)[]
  /**
   * Only store the listed properties.
   */
  whitelist?: (keyof S)[]
  /**
   * A function returning another (optional) function.
   * The main function will be called before the storage rehydration.
   * The returned function will be called after the storage rehydration.
   */
  onRehydrateStorage?: (state: S) => ((state: S) => void) | void
  /**
   * If the stored state's version mismatch the one specified here, the storage will not be used.
   * This is useful when adding a breaking change to your store.
   */
  version?: number
}

export const persist = <S extends State>(
  config: StateCreator<S>,
  options: PersistOptions<S>
) => (set: SetState<S>, get: GetState<S>, api: StoreApi<S>): S => {
  const {
    name,
    getStorage = () => localStorage,
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    blacklist,
    whitelist,
    onRehydrateStorage,
    version = 0,
  } = options || {}

  let storage: StateStorage | undefined

  try {
    storage = getStorage()
  } catch (e) {
    // prevent error if the storage is not defined (e.g. when server side rendering a page)
  }

  if (!storage) return config(set, get, api)

  const setItem = async () => {
    const state = { ...get() }

    if (whitelist) {
      Object.keys(state).forEach((key) => {
        !whitelist.includes(key) && delete state[key]
      })
    }
    if (blacklist) {
      blacklist.forEach((key) => delete state[key])
    }

    storage?.setItem(name, await serialize({ state, version }))
  }

  const savedSetState = api.setState

  api.setState = (state, replace) => {
    savedSetState(state, replace)
    setItem()
  }

  // rehydrate initial state with existing stored state
  ;(async () => {
    const postRehydrationCallback = onRehydrateStorage?.(get()) || undefined

    try {
      const storageValue = await storage.getItem(name)

      if (storageValue) {
        const deserializedStorageValue = await deserialize(storageValue)

        // if versions mismatch, clear storage by storing the new initial state
        if (deserializedStorageValue.version !== version) {
          setItem()
        } else {
          set(deserializedStorageValue.state)
        }
      }
    } catch (e) {
      throw new Error(`Unable to get to stored state in "${name}"`)
    } finally {
      postRehydrationCallback?.(get())
    }
  })()

  return config(
    (payload) => {
      set(payload)
      setItem()
    },
    get,
    api
  )
}
