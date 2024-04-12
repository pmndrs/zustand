import { produce } from 'immer'
import type { Draft } from 'immer'
import type { StateCreator, StoreMutatorIdentifier } from '../vanilla.ts'

type Immer = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
>(
  initializer: StateCreator<T, [...Mps, ['zustand/immer', never]], Mcs>,
) => StateCreator<T, Mps, [['zustand/immer', never], ...Mcs]>

declare module '../vanilla' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface StoreMutators<S, A> {
    ['zustand/immer']: WithImmer<S>
  }
}

type Write<T, U> = Omit<T, keyof U> & U
type SkipTwo<T> = T extends { length: 0 }
  ? []
  : T extends { length: 1 }
    ? []
    : T extends { length: 0 | 1 }
      ? []
      : T extends [unknown, unknown, ...infer A]
        ? A
        : T extends [unknown, unknown?, ...infer A]
          ? A
          : T extends [unknown?, unknown?, ...infer A]
            ? A
            : never

type WithImmer<S> = Write<S, StoreImmer<S>>

type StoreImmer<S> = S extends {
  getState: () => infer T
  setState: infer SetState
}
  ? SetState extends (...a: infer A) => infer Sr
    ? {
        setState(
          nextStateOrUpdater: T | Partial<T> | ((state: Draft<T>) => void),
          ...a: SkipTwo<A>
        ): Sr
      }
    : never
  : never

type ImmerImpl = <T>(
  storeInitializer: StateCreator<T, [], []>,
) => StateCreator<T, [], []>

const immerImpl: ImmerImpl = (initializer) => (set, get, store) => {
  type T = ReturnType<typeof initializer>

  store.setState = (updater, _, ...a) => {
    const nextState = produce(updater as any) as (s: T) => T

    return set(nextState as any, /* replace */ true, ...a)
  }

  return initializer(store.setState, get, store)
}

export const immer = immerImpl as unknown as Immer
