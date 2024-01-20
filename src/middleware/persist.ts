import type {
  StateCreator,
  StoreApi,
  StoreMutatorIdentifier,
} from '../vanilla.ts'

export interface StateStorage {
  getItem: (name: string) => string | null | Promise<string | null>
  setItem: (name: string, value: string) => void | Promise<void>
  removeItem: (name: string) => void | Promise<void>
}

export type StorageValue<S> = {
  state: S
  version?: number
}

export interface PersistStorage<S> {
  getItem: (
    name: string,
  ) => StorageValue<S> | null | Promise<StorageValue<S> | null>
  setItem: (name: string, value: StorageValue<S>) => void | Promise<void>
  removeItem: (name: string) => void | Promise<void>
}

type JsonStorageOptions = {
  reviver?: (key: string, value: unknown) => unknown
  replacer?: (key: string, value: unknown) => unknown
}

export function createJSONStorage<S>(
  getStorage: () => StateStorage,
  options?: JsonStorageOptions,
): PersistStorage<S> | undefined {
  let storage: StateStorage | undefined
  try {
    storage = getStorage()
  } catch (e) {
    // prevent error if the storage is not defined (e.g. when server side rendering a page)
    return
  }
  const persistStorage: PersistStorage<S> = {
    getItem: (name) => {
      const parse = (str: string | null) => {
        if (str === null) {
          return null
        }
        return JSON.parse(str, options?.reviver) as StorageValue<S>
      }
      const str = (storage as StateStorage).getItem(name) ?? null
      if (str instanceof Promise) {
        return str.then(parse)
      }
      return parse(str)
    },
    setItem: (name, newValue) =>
      (storage as StateStorage).setItem(
        name,
        JSON.stringify(newValue, options?.replacer),
      ),
    removeItem: (name) => (storage as StateStorage).removeItem(name),
  }
  return persistStorage
}

export interface PersistOptions<S, PersistedState = S> {
  /** Name of the storage (must be unique) */
  name: string
  /**
   * Use a custom persist storage.
   *
   * Combining `createJSONStorage` helps creating a persist storage
   * with JSON.parse and JSON.stringify.
   *
   * @default createJSONStorage(() => localStorage)
   */
  storage?: PersistStorage<PersistedState> | undefined
  /**
   * Filter the persisted value.
   *
   * @params state The state's value
   */
  partialize?: (state: S) => PersistedState
  /**
   * A function returning another (optional) function.
   * The main function will be called before the state rehydration.
   * The returned function will be called after the state rehydration or when an error occurred.
   */
  onRehydrateStorage?: (
    state: S,
  ) => ((state?: S, error?: unknown) => void) | void
  /**
   * If the stored state's version mismatch the one specified here, the storage will not be used.
   * This is useful when adding a breaking change to your store.
   */
  version?: number
  /**
   * A function to perform persisted state migration.
   * This function will be called when persisted state versions mismatch with the one specified here.
   */
  migrate?: (persistedState: unknown, version: number) => S | Promise<S>
  /**
   * A function to perform custom hydration merges when combining the stored state with the current one.
   * By default, this function does a shallow merge.
   */
  merge?: (persistedState: unknown, currentState: S) => S

  /**
   * An optional boolean that will prevent the persist middleware from triggering hydration on initialization,
   * This allows you to call `rehydrate()` at a specific point in your apps rendering life-cycle.
   *
   * This is useful in SSR application.
   *
   * @default false
   */
  skipHydration?: boolean
}

type PersistListener<S> = (state: S) => void

type StorePersist<S, Ps> = {
  persist: {
    setOptions: (options: Partial<PersistOptions<S, Ps>>) => void
    clearStorage: () => void
    rehydrate: () => Promise<void> | void
    hasHydrated: () => boolean
    onHydrate: (fn: PersistListener<S>) => () => void
    onFinishHydration: (fn: PersistListener<S>) => () => void
    getOptions: () => Partial<PersistOptions<S, Ps>>
  }
}

type Thenable<Value> = {
  then<V>(
    onFulfilled: (value: Value) => V | Promise<V> | Thenable<V>,
  ): Thenable<V>
  catch<V>(
    onRejected: (reason: Error) => V | Promise<V> | Thenable<V>,
  ): Thenable<V>
}

const toThenable =
  <Result, Input>(
    fn: (input: Input) => Result | Promise<Result> | Thenable<Result>,
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

const persistImpl: PersistImpl = (config, baseOptions) => (set, get, api) => {
  type S = ReturnType<typeof config>
  let options = {
    storage: createJSONStorage<S>(() => localStorage),
    partialize: (state: S) => state,
    version: 0,
    merge: (persistedState: unknown, currentState: S) => ({
      ...currentState,
      ...(persistedState as object),
    }),
    ...baseOptions,
  }

  let hasHydrated = false
  const hydrationListeners = new Set<PersistListener<S>>()
  const finishHydrationListeners = new Set<PersistListener<S>>()
  let storage = options.storage

  if (!storage) {
    return config(
      (...args) => {
        console.warn(
          `[zustand persist middleware] Unable to update item '${options.name}', the given storage is currently unavailable.`,
        )
        set(...args)
      },
      get,
      api,
    )
  }

  const setItem = (): void | Promise<void> => {
    const state = options.partialize({ ...get() })
    return (storage as PersistStorage<S>).setItem(options.name, {
      state,
      version: options.version,
    })
  }

  const savedSetState = api.setState

  api.setState = (state, replace) => {
    savedSetState(state, replace)
    void setItem()
  }

  const configResult = config(
    (...args) => {
      set(...args)
      void setItem()
    },
    get,
    api,
  )

  api.getInitialState = () => configResult

  // a workaround to solve the issue of not storing rehydrated state in sync storage
  // the set(state) value would be later overridden with initial state by create()
  // to avoid this, we merge the state from localStorage into the initial state.
  let stateFromStorage: S | undefined

  // rehydrate initial state with existing stored state
  const hydrate = () => {
    if (!storage) return

    // On the first invocation of 'hydrate', state will not yet be defined (this is
    // true for both the 'asynchronous' and 'synchronous' case). Pass 'configResult'
    // as a backup  to 'get()' so listeners and 'onRehydrateStorage' are called with
    // the latest available state.

    hasHydrated = false
    hydrationListeners.forEach((cb) => cb(get() ?? configResult))

    const postRehydrationCallback =
      options.onRehydrateStorage?.(get() ?? configResult) || undefined

    // bind is used to avoid `TypeError: Illegal invocation` error
    return toThenable(storage.getItem.bind(storage))(options.name)
      .then((deserializedStorageValue) => {
        if (deserializedStorageValue) {
          if (
            typeof deserializedStorageValue.version === 'number' &&
            deserializedStorageValue.version !== options.version
          ) {
            if (options.migrate) {
              return options.migrate(
                deserializedStorageValue.state,
                deserializedStorageValue.version,
              )
            }
            console.error(
              `State loaded from storage couldn't be migrated since no migrate function was provided`,
            )
          } else {
            return deserializedStorageValue.state
          }
        }
      })
      .then((migratedState) => {
        stateFromStorage = options.merge(
          migratedState as S,
          get() ?? configResult,
        )

        set(stateFromStorage as S, true)
        return setItem()
      })
      .then(() => {
        // TODO: In the asynchronous case, it's possible that the state has changed
        // since it was set in the prior callback. As such, it would be better to
        // pass 'get()' to the 'postRehydrationCallback' to ensure the most up-to-date
        // state is used. However, this could be a breaking change, so this isn't being
        // done now.
        postRehydrationCallback?.(stateFromStorage, undefined)

        // It's possible that 'postRehydrationCallback' updated the state. To ensure
        // that isn't overwritten when returning 'stateFromStorage' below
        // (synchronous-case only), update 'stateFromStorage' to point to the latest
        // state. In the asynchronous case, 'stateFromStorage' isn't used after this
        // callback, so there's no harm in updating it to match the latest state.
        stateFromStorage = get()
        hasHydrated = true
        finishHydrationListeners.forEach((cb) => cb(stateFromStorage as S))
      })
      .catch((e: Error) => {
        postRehydrationCallback?.(undefined, e)
      })
  }

  ;(api as StoreApi<S> & StorePersist<S, S>).persist = {
    setOptions: (newOptions) => {
      options = {
        ...options,
        ...newOptions,
      }

      if (newOptions.storage) {
        storage = newOptions.storage
      }
    },
    clearStorage: () => {
      storage?.removeItem(options.name)
    },
    getOptions: () => options,
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

  if (!options.skipHydration) {
    hydrate()
  }

  return stateFromStorage || configResult
}

type Persist = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
  U = T,
>(
  initializer: StateCreator<T, [...Mps, ['zustand/persist', unknown]], Mcs>,
  options: PersistOptions<T, U>,
) => StateCreator<T, Mps, [['zustand/persist', U], ...Mcs]>

declare module '../vanilla' {
  interface StoreMutators<S, A> {
    'zustand/persist': WithPersist<S, A>
  }
}

type Write<T, U> = Omit<T, keyof U> & U

type WithPersist<S, A> = S extends { getState: () => infer T }
  ? Write<S, StorePersist<T, A>>
  : never

type PersistImpl = <T>(
  storeInitializer: StateCreator<T, [], []>,
  options: PersistOptions<T, T>,
) => StateCreator<T, [], []>

export const persist = persistImpl as unknown as Persist
