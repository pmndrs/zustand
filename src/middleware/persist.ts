import { GetState, SetState, State, StoreApi } from '../vanilla'

type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>
}

export type StateStorage = {
  getItem: (name: string) => string | null | Promise<string | null>
  setItem: (name: string, value: string) => void | Promise<void>
  removeItem: (name: string) => void | Promise<void>
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

type PersistListener<S> = (state: S) => void

export type StoreApiWithPersist<S extends State> = StoreApi<S> & {
  persist: {
    setOptions: (options: Partial<PersistOptions<S>>) => void
    clearStorage: () => void
    rehydrate: () => Promise<void>
    hasHydrated: () => boolean
    onHydrate: (fn: PersistListener<S>) => () => void
    onFinishHydration: (fn: PersistListener<S>) => () => void
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

    let hasHydrated = false
    const hydrationListeners = new Set<PersistListener<S>>()
    const finishHydrationListeners = new Set<PersistListener<S>>()
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
    }

    const thenableSerialize = toThenable(options.serialize)

    const setItem = (): Thenable<void> => {
      const state = options.partialize({ ...get() })

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
      hydrationListeners.forEach((cb) => cb(get()))

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
          finishHydrationListeners.forEach((cb) => cb(stateFromStorage as S))
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
        storage?.removeItem(options.name)
      },
      rehydrate: () => hydrate() as Promise<void>,
      hasHydrated: () => hasHydrated,
      onHydrate: (cb) => {
        hydrationListeners.add(cb)

        return () => {
          hydrationListeners.delete(cb)
        }
      },
      onFinishHydration: (cb) => {
        finishHydrationListeners.add(cb)

        return () => {
          finishHydrationListeners.delete(cb)
        }
      },
    }

    hydrate()

    return stateFromStorage || configResult
  }
