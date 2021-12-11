import { Store, UnknownState, StoreInitializer, StoreMutatorIdentifier } from '../vanilla'

// ============================================================================
// Types

type SubscribeWithSelectorMiddleware = 
  < T extends UnknownState
  , Mps extends [StoreMutatorIdentifier, unknown][] = []
  , Mcs extends [StoreMutatorIdentifier, unknown][] = []
  >
    (initializer: StoreInitializer<T, [...Mps, [$$subscribeWithSelector, never]], Mcs>) =>
      StoreInitializer<T, Mps, [[$$subscribeWithSelector, never], ...Mcs]>


declare const $$subscribeWithSelector: unique symbol;
type $$subscribeWithSelector = typeof $$subscribeWithSelector

declare module '../vanilla' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface StoreMutators<S, A>
    { [$$subscribeWithSelector]: WithSelectorSubscribe<S>
    }
}

type WithSelectorSubscribe<S> =
  S extends { getState: () => infer T }
    ? S & SubscribeWithSelector<A.Cast<T, UnknownState>>
    : never

interface SubscribeWithSelector<T extends UnknownState>
  { subscribe:
      <U>
        ( selector: (state: T) => U
        , listener: (selectedState: U, previousSelectedState: U) => void
        , options?:
            { equalityFn?: (a: U, b: U) => boolean
            , fireImmediately?: boolean
            }
        ) =>
          () => void
  }


// ============================================================================
// Implementation

type EState = { __isState: true }
type ESelectedState = { __isSelectedState: true }
type EStore = Store<EState>

type ESubscribeWithSelector = 
  (storeInitializer: EStoreInitializer) =>
    EStoreInitializer

type EStoreInitializer = 
  F.PopArgument<StoreInitializer<EState, [], []>>

interface ESubscribeWithSelectorStore
  { subscribe:
    ( selector: (state: EState) => ESelectedState
    , listener:
        ( selectedState: ESelectedState
        , previousSelectedState: E.Previous<ESelectedState>
        )
          => void
    , options?:
        { equalityFn?: (a: ESelectedState, b: ESelectedState) => boolean
        , fireImmediately?: boolean
        }
    ) =>
      () => void
  }

const subscribeWithSelectorImpl: ESubscribeWithSelector =
  storeInitializer =>
    (parentSet, parentGet, parentStore) => {

  const parentSubscribe = parentStore.subscribe
  const updatedParentStore = parentStore as EStore & ESubscribeWithSelectorStore
  type UpdatedSubscribeArguments = F.O2.Arguments<(typeof updatedParentStore)['subscribe']>

  updatedParentStore.subscribe = (...args: UpdatedSubscribeArguments) => {
    if (!args[1]) {
      pseudoAssert(args.length === 1)
      return parentSubscribe(...args)
    }
  
    pseudoAssert(args.length === 3)
    const [selector, listener, _options] = args
    const { equalityFn: equals, fireImmediately } =
      { equalityFn: objectIs, fireImmediately: false, ..._options }
  
    let currentSelected = selector(parentGet())
    let previousSelected = currentSelected as E.Previous<ESelectedState>
    const emit = () => listener(currentSelected, previousSelected)

    const unsubscribe = parentSubscribe(() => {
      const nextSelected = selector(parentGet())
      if (equals(currentSelected, nextSelected)) return
  
      previousSelected = E.previous(currentSelected)
      currentSelected = nextSelected
      emit()
    })
    if (fireImmediately) emit()

    return unsubscribe
  }

  return storeInitializer(parentSet, parentGet, updatedParentStore)
}
const subscribeWithSelector = subscribeWithSelectorImpl as unknown as
  SubscribeWithSelectorMiddleware


// ============================================================================
// Utilities

namespace E {
  export type Previous<T> = T & { __isPrevious: true }
  export const previous = <T>(t: T) => t as Previous<T>
}

const objectIs =
  Object.is as (<T>(a: T, b: T) => boolean)

function pseudoAssert<T extends boolean>(predicate: T):
  asserts predicate {}

namespace F {
  export type Unknown = 
    (...a: never[]) => unknown

  export namespace O2 {
    export type Arguments<T extends F.Unknown> =
      T extends {
        (...a: infer A1): unknown 
        (...a: infer A2): unknown 
      }
        ? A1 | A2
        : never
  }

  export type PopArgument<T extends F.Unknown> =
    T extends (...a: [...infer A, infer _]) => infer R
      ? (...a: A) => R
      : never
}

// Bug in eslint, we are using A just in the module augmentation
namespace A { // eslint-disable-line @typescript-eslint/no-unused-vars
  export type Cast<T, U> = T extends U ? T : U;
}

// ============================================================================
// Exports

export { subscribeWithSelector, SubscribeWithSelector }