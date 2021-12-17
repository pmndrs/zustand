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
    ? S & SubscribeWithSelector<Extract<T, UnknownState>>
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
  PopArgument<StoreInitializer<EState, [], []>>

interface ESubscribeWithSelectorStore
  { subscribe:
    ( selector: (state: EState) => ESelectedState
    , listener:
        ( selectedState: ESelectedState
        , previousSelectedState: Previous<ESelectedState>
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
  type UpdatedSubscribeArguments = Parameters2<(typeof updatedParentStore)['subscribe']>

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
    let previousSelected = currentSelected as Previous<ESelectedState>
    const emit = () => listener(currentSelected, previousSelected)

    const unsubscribe = parentSubscribe(() => {
      const nextSelected = selector(parentGet())
      if (equals(currentSelected, nextSelected)) return
  
      previousSelected = previous(currentSelected)
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

type Previous<T> = T & { __isPrevious: true }
const previous = <T>(t: T) => t as Previous<T>

const objectIs =
  Object.is as (<T>(a: T, b: T) => boolean)

function pseudoAssert<T extends boolean>(predicate: T):
  asserts predicate {}

type Parameters2<T extends (...a: never[]) => unknown> =
  T extends {
    (...a: infer A1): unknown 
    (...a: infer A2): unknown 
  }
    ? A1 | A2
    : never

type PopArgument<T extends (...a: never[]) => unknown> =
  T extends (...a: [...infer A, infer _]) => infer R
    ? (...a: A) => R
    : never

// ============================================================================
// Exports

export { subscribeWithSelector, SubscribeWithSelector }