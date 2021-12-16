import * as React from "react";
import { useStore } from "./react";
import { Store, UnknownState } from "./vanilla";

// ============================================================================
// Types

type CreateContext = 
  <S extends Store<UnknownState>>() =>
    { Provider: Provider<S>
    , useStore: UseStore<S>
    , useStoreRef: UseStoreRef<S>
    }

type Provider<S> =
  ( props: 
      { createStore: () => S
      , children?: React.ReactNode
      }
  ) =>
    React.ReactNode

type UseStore<S> =
  <U = State<S>>
    ( selector?: (state: State<S>) => U
    , equals?: (a: U, b: U) => boolean
    ) =>
       U

type UseStoreRef<S> =
  () => S

type State<S> =
  S extends { getState: () => infer T }
    ? T
    : never


// ============================================================================
// Implementation

type EState = { __isState: true }
type EStore = Store<EState>
type ECreateContext = 
  () =>
    { Provider: Provider<EStore>
    , useStoreRef: UseStoreRef<EStore>
    , useStore: UseStore<EStore>
    }

const createContextImpl: ECreateContext = () => {
  
  const StoreContext =
    React.createContext<EStore | undefined>(undefined);

  const Provider: F.Call<ECreateContext>["Provider"] =
    ({ createStore, children }) =>
      <StoreContext.Provider value={useConstant(createStore)}>
        {children}
      </StoreContext.Provider>

  const useStoreRef: F.Call<ECreateContext>["useStoreRef"] =
    () => {
      let store = React.useContext(StoreContext);
      if (!store) {
        throw new Error("Seems like you have not used zustand provider as an ancestor.")
      }
      return store;
    }

  const useBoundStore: F.Call<ECreateContext>["useStore"] =
    (...a) => useStore(useStoreRef(), ...a)

  return {
    Provider,
    useStoreRef,
    useStore: useBoundStore
  }
}
const createContext = createContextImpl as CreateContext;


// ============================================================================
// Utilities

const useConstant = <T extends unknown>(create: () => T) => {
  let ref = React.useRef<T | undefined>();
  if (!ref.current) {
    ref.current = create();
  }
  return ref.current;
}

namespace F {
  export type Unknown =
    (...a: never[]) => unknown

  export type Call<T extends F.Unknown> =
    T extends (...a: never[]) => infer R ? R : never
}

// ============================================================================
// Exports

export default createContext;
