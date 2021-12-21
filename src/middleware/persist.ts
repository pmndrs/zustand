import { Store, UnknownState, StoreInitializer, StoreMutatorIdentifier } from '../vanilla'

// ============================================================================
// Types

type Persist =
  < T extends UnknownState
  , Mps extends [StoreMutatorIdentifier, unknown][] = []
  , Mcs extends [StoreMutatorIdentifier, unknown][] = []
  , U = T
  >
    ( initializer: StoreInitializer<T, [...Mps, [$$persist, unknown]], Mcs>
    , options?: PersistOptions<T, U>
    ) =>
      StoreInitializer<T, Mps, [[$$persist, U], ...Mcs]>

const $$persist = Symbol("$$persist");
type $$persist = typeof $$persist;

declare module '../vanilla' {
  interface StoreMutators<S, A>
    { [$$persist]: WithPersist<S, A>
    }
}

type WithPersist<S, A> =
  S extends { getState: () => infer T }
    ? Write<
        S,
        StorePersist<Extract<T, UnknownState>, A>
      >
    : never

interface PersistOptions<T extends UnknownState, U>
  {
    /** Name of the storage (must be unique) */
    name: string
    
    /**
     * A function returning a storage.
     * The storage must fit `window.localStorage`'s api (or an async version of it).
     * For example the storage could be `AsyncStorage` from React Native.
     *
     * @default () => localStorage
     */
    getStorage?: () => PersistentStorage

    /**
     * Use a custom serializer.
     * The returned string will be stored in the storage.
     *
     * @default JSON.stringify
     */
    serialize?(storageValue: PersistentStorageValue<U>): MaybePromise<string>

    /**
     * Use a custom deserializer.
     * Must return an object matching PersistentStorageValue<State>
     *
     * @param serializedString The storage's current value.
     * @default JSON.parse
     */
    deserialize?(serializedString: string): MaybePromise<PersistentStorageValue<T>>

    /**
     * Filter the persisted value.
     *
     * @param state The state's value
     */
    partialize?(state: T): U
    
    /**
     * A function returning another (optional) function.
     * The main function will be called before the state rehydration.
     * The returned function will be called after the state rehydration or when an error occurred.
     */
    onRehydrateStorage?(state: T): void | ((state?: T, error?: unknown) => void)

    /**
     * If the stored state's version mismatch the one specified here, the storage will not be used.
     * This is useful when adding a breaking change to your store.
     */
    version?: number

    /**
     * A function to perform persisted state migration.
     * This function will be called when persisted state versions mismatch with the one specified here.
     */
    migrate?(persistedState: unknown, version: number): MaybePromise<T>

    /**
     * A function to perform custom hydration merges when combining the stored state with the current one.
     * By default, this function does a shallow merge.
     */
    merge?(persistedState: unknown, currentState: T): T
  }

interface PersistentStorage
  { getItem: (name: string) => string | null | Promise<string | null>
  , setItem: (name: string, value: string) => void | Promise<void>
  , removeItem: (name: string) => void | Promise<void>
  }

interface PersistentStorageValue<T>
  { state: T
  , version?: number
  }

interface StorePersist<T extends UnknownState, U = T>
  { persist:
      { setOptions: (options: Partial<PersistOptions<T, U>>) => void
      , clearStorage: () => void
      , rehydrate: () => Thenable<void>
      , hasHydrated: () => boolean
      , onHydrate: (listener: (state: T) => void) => () => void
      , onFinishHydration: (listener: (state: T) => void) => () => void
      }
  }




// ============================================================================
// Implementation

type T = { __isState: true }
type U = { __isSelectedState: true }

type PersistImpl =
  ( storeInitializer: StoreInitializerImpl
  , options: PersistOptionsImpl
  ) =>
    StoreInitializerImpl

type StoreInitializerImpl = 
  PopArgument<StoreInitializer<T, [], []>>

interface PersistOptionsImpl
  { name: PersistentStorageNameImpl
  , getStorage?: () => PersistentStorageImpl
  , serialize?:
      (storageValue: PersistentStorageValueImpl) =>
        MaybePromise<Serialized<PersistentStorageValueImpl>>
  , deserialize?:
      (serializedString: Serialized<PersistentStorageValueImpl>) =>
        MaybePromise<PersistentStorageValueImpl>
  , partialize?: (state: T) => U
  , onRehydrateStorage?:
      (state: T) =>
        void | ((state?: T, error?: unknown) => void)
  , version?: PersistentStorageValueImpl['version']
    migrate?:
      ( persistedState: PersistentStorageValueImpl['state']
      , version: PersistentStorageValueImpl['version']
      ) =>
        MaybePromise<PersistentStorageValueImpl['state']>
    merge?:
      ( persistedState: PersistentStorageValueImpl['state']
      , currentState: T
      ) =>
        T
  }

type PersistentStorageNameImpl =
  string & { __isPersistentStorageName: true }

interface PersistentStorageImpl
  { getItem: (name: PersistentStorageNameImpl) =>
      MaybePromise<Serialized<PersistentStorageValueImpl> | null>
  , setItem:
      ( name: PersistentStorageNameImpl
      , value: Serialized<PersistentStorageValueImpl>
      ) =>
        MaybePromise<void>
  , removeItem: (name: PersistentStorageNameImpl) => MaybePromise<void>
  }

type PersistentStorageValueImpl =
  { state: U
  , version: number & { __isPersistentStorageValueVersion: true } 
  }

interface PersistStoreImpl
  { persist:
      { setOptions: (options: Partial<PersistOptionsImpl>) => void
      , clearStorage: () => void
      , rehydrate: () => Thenable<void>
      , hasHydrated: () => boolean
      , onHydrate: (listener: (state: T) => void) => () => void
      , onFinishHydration: (listener: (state: T) => void) => () => void
      }
  }

const persistImpl: PersistImpl = (storeInitializer, _options) => (parentSet, parentGet, parentStore) => {
  let options = { ...defaultOptions, ..._options }

  let persistentStorage = tryElse(options.getStorage, () => undefined)
  const persistentStorageGetItem = () =>
    persistentStorage!.getItem(options.name)
  const persistentStorageSetItem = (serializedState: Serialized<PersistentStorageValueImpl>) =>
    persistentStorage!.setItem(options.name, serializedState)
  const persistentStorageRemoveItem = () =>
    persistentStorage!.removeItem(options.name)
  
  if (!persistentStorage) {
    return storeInitializer(
      (...a) => {
        console.warn(messages.noPersistentStorage(options.name))
        parentSet(...a)
      },
      parentGet, 
      update(parentStore, 'setState', setState => (...a) => {
        console.warn(messages.noPersistentStorage(options.name))
        setState(...a)
      })
    )
  }
 
  const updatePersistentStorage = () =>
    thenablify(options.serialize, true)({
      state: options.partialize({ ...parentGet() }),
      version: options.version
    })
    .then(persistentStorageSetItem)
  

  const initialState = storeInitializer(
    (...a) => {
      parentSet(...a)
      updatePersistentStorage()
    },
    parentGet, 
    update(parentStore, 'setState', setState => (...a) => {
      setState(...a)
      updatePersistentStorage()
    })
  )
  let initialStateFromPersistentStorage: T | undefined

  let hasHydrated = false
  const hydrationEmitter = emitter(new Set<(state: T) => void>())
  const finishHydrationEmitter = emitter(new Set<(state: T) => void>())

  const hydrate = () => {
    hasHydrated = false
    hydrationEmitter.emit(parentGet())
    const postRehydrationCallback = options.onRehydrateStorage?.(parentGet()) || undefined

    return thenablify(persistentStorageGetItem)()
    .then(serialized => serialized !== null ? options.deserialize(serialized) : null)
    .then(storageValue => {
      if (storageValue === null) return storageValue
      if (storageValue.version === undefined) return storageValue.state
      if (storageValue.version === options.version) return storageValue.state
      if (!options.migrate) {
        console.error(messages.couldNotMigrate())
        return undefined
      }

      return options.migrate(storageValue.state, storageValue.version)
    })
    .then(migratedState => {
      initialStateFromPersistentStorage = options.merge(migratedState!, initialState)

      parentSet(initialStateFromPersistentStorage, true)
      return updatePersistentStorage()
    })
    .then(() => {
      postRehydrationCallback?.(initialStateFromPersistentStorage, undefined)
      hasHydrated = true
      finishHydrationEmitter.emit(initialStateFromPersistentStorage!)
    })
    .catch(error => postRehydrationCallback?.(undefined, error))
  }

  (parentStore as Store<T> & PersistStoreImpl).persist = {
    setOptions: (newOptions) => {
      options = { ...options, ...newOptions }
      if (options.getStorage) persistentStorage = options.getStorage()
    },
    clearStorage: persistentStorageRemoveItem,
    rehydrate: hydrate,
    hasHydrated: () => hasHydrated,
    onHydrate: hydrationEmitter.listen,
    onFinishHydration: finishHydrationEmitter.listen
  }

  hydrate()
  return initialStateFromPersistentStorage || initialState
}
const persist = persistImpl as unknown as Persist

type EPersistDefaultedOptions =
  Required<Omit<PersistOptionsImpl, 'name' | 'onRehydrateStorage' | 'migrate'>>

const defaultOptions: EPersistDefaultedOptions = {
  getStorage: (() => localStorage) as unknown as EPersistDefaultedOptions['getStorage'],
  serialize: JSON.stringify as unknown as EPersistDefaultedOptions['serialize'],
  deserialize: JSON.parse as unknown as EPersistDefaultedOptions['deserialize'],
  partialize: (<T>(x: T) => x) as unknown as EPersistDefaultedOptions['partialize'],
  version: 0 as EPersistDefaultedOptions['version'],
  merge: (persistedState, currentState) => ({
    ...currentState,
    ...persistedState,
  })
}

const messages = {
  noPersistentStorage: (name: PersistentStorageNameImpl) =>
    `[zustand persist middleware] Unable to update item '${name}', ` +
    `the given storage is currently unavailable.`,
  couldNotMigrate: () =>
    `[zustand persist middleware] State loaded from storage couldn't be migrated ` +
    `since no migrate function was provided`
}




// ============================================================================
// Utilities

const tryElse = <T, U>(result: () => T, fallback: (e: unknown) => U) => {
  let r: T | U
  try { r = result() }
  catch (e) { r = fallback(e) }
  return r
}

const update =
  <T, K extends keyof T>(t: T, k: K, replacer: (original: T[K]) => T[K]) => {
    const original = t[k]
    Object.assign(t, { [k]: replacer(original) })
    return t
  }

const emitter = <L extends (...a: never[]) => void>(listeners: Set<L>) => {
  return ({
    emit: (...a: Parameters<L>) => listeners.forEach(f => f(...a)),
    listen: (listener: L) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    }
  })
}

export interface Thenable<T>
  { then: <U>(onFulfilled: (value: T) => U | Promise<U> | Thenable<U>) =>
      Thenable<U>
  , catch: <U>(onRejected: (error: unknown) => U | Promise<U> | Thenable<U>) =>
      Thenable<U>
  }

export const thenablify =
  <A extends unknown[], R>
    (f: (...a: A) => R | Promise<R> | Thenable<R>, throwImmediately = false) =>
      (...a: A): Thenable<R> => {

  try {
    const r = f(...a)
    if (hasThen(r)) return r as Thenable<R>

    return {
      then(f) { return thenablify(f, throwImmediately)(r) },
      catch() { return this as Thenable<never> }
    }
  } catch (error) {
    if (throwImmediately) throw error;
    return {
      then() { return this as Thenable<never> },
      catch(f) { return thenablify(f, throwImmediately)(error) }
    }
  }
}

const hasThen = (t: unknown): t is { then: unknown } =>
  typeof t === 'object' && t !== null && (t as { then?: never }).then !== undefined

type MaybePromise<T> =
  T | Promise<T>

type Serialized<T> = { __serialized: T }

type Write<T extends object, U extends object> =
  Omit<T, keyof U> & U

type PopArgument<T extends (...a: never[]) => unknown> =
  T extends (...a: [...infer A, infer _]) => infer R
    ? (...a: A) => R
    : never

// ============================================================================
// Exports

export {
  persist,
  PersistOptions,
  PersistentStorage,
  $$persist,
  WithPersist
}
 