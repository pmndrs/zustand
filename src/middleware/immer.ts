import { produce, Draft } from 'immer'
import { StoreInitializer, StoreMutatorIdentifier, UnknownState } from '../'

// ============================================================================
// Types

type Immer =
  < T extends UnknownState
  , Mps extends [StoreMutatorIdentifier, unknown][] = []
  , Mcs extends [StoreMutatorIdentifier, unknown][] = []
  >
    ( initializer: StoreInitializer<T, [...Mps, [$$immer, never]], Mcs>
    ) =>
      StoreInitializer<T, Mps, [[$$immer, never], ...Mcs]>

const $$immer = Symbol("$$immer");
type $$immer = typeof $$immer

declare module 'zustand' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface StoreMutators<S, A> {
    [$$immer]: WithImmer<S>
  }
}

type WithImmer<S> = 
  S extends { getState: () => infer T, setState: infer SetState }
    ? Write<S, {
        setState:
          SetState extends (...a: [infer _, infer __, ...infer A]) => infer Sr
            ? <Nt extends (R extends true ? T : Partial<T>), R extends boolean>
                ( nextStateOrUpdater: Nt | ((state: Draft<T>) => void | undefined | Undefined)
                , shouldReplace?: R
                , ...a: A
                ) =>
                  Sr
            : never
      }>
  : never

declare class Undefined { private _: undefined }

// ============================================================================
// Implementation

type EState = { __isState: true }
type EImmer = 
  (storeInitializer: EStoreInitializer) =>
    EStoreInitializer

type EStoreInitializer = 
  PopArgument<StoreInitializer<EState, [], []>>

const immerImpl: EImmer = initializer => (set, get, store) =>
  initializer(
    ((updater, replace) => {
      const nextState =
        ( typeof updater === 'function'
            ? produce(updater)
            : updater
        ) as ((s: EState) => EState) | EState | Partial<EState>

      return set(nextState as any, replace)
    }),
    get,
    store
  )

const immer = immerImpl as unknown as Immer;

// ============================================================================
// Utilities
  
type Write<T extends object, U extends object> =
  Omit<T, keyof U> & U

type PopArgument<T extends (...a: never[]) => unknown> =
  T extends (...a: [...infer A, infer _]) => infer R
    ? (...a: A) => R
    : never


// ============================================================================
// Exports

export { immer, $$immer, WithImmer };