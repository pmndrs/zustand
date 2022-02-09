import { produce } from 'immer'
import type { Draft } from 'immer'
import { State, StateCreator, StoreMutatorIdentifier } from '../vanilla'

type Immer = <
  T extends State,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = []
>(
  initializer: StateCreator<T, [...Mps, ['zustand/immer', never]], Mcs>
) => StateCreator<T, Mps, [['zustand/immer', never], ...Mcs]>

declare module 'zustand' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface StoreMutators<S, A> {
    ['zustand/immer']: WithImmer<S>
  }
}

type WithImmer<S> = S extends {
  getState: () => infer T
  setState: infer SetState
}
  ? Write<
      S,
      {
        setState: SetState extends (
          ...a: [infer _, infer __, ...infer A]
        ) => infer Sr
          ? <Nt extends R extends true ? T : Partial<T>, R extends boolean>(
              nextStateOrUpdater: Nt | ((state: Draft<T>) => void),
              shouldReplace?: R,
              ...a: A
            ) => Sr
          : never
      }
    >
  : never

type Write<T extends object, U extends object> = Omit<T, keyof U> & U

type PopArgument<T extends (...a: never[]) => unknown> = T extends (
  ...a: [...infer A, infer _]
) => infer R
  ? (...a: A) => R
  : never

type ImmerImpl = <T extends State>(
  storeInitializer: PopArgument<StateCreator<T, [], []>>
) => PopArgument<StateCreator<T, [], []>>

const immerImpl: ImmerImpl = (initializer) => (set, get, store) => {
  type T = ReturnType<typeof initializer>
  return initializer(
    (updater, replace) => {
      const nextState = (
        typeof updater === 'function' ? produce(updater as any) : updater
      ) as ((s: T) => T) | T | Partial<T>

      return set(nextState as any, replace)
    },
    get,
    store
  )
}

export const immer = immerImpl as unknown as Immer
