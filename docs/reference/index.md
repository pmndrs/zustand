## APIs

Core functions for creating and configuring stores.

- [`create`](/zustand/reference/apis/create.md) — Create a store bound to React via hooks.
- [`createStore`](/zustand/reference/apis/create-store.md) — Create a standalone store without React.
- [`createWithEqualityFn`](/zustand/reference/apis/create-with-equality-fn.md) — Like `create`, but with a custom equality function.
- [`shallow`](/zustand/reference/apis/shallow.md) — Utility for shallow comparison of objects and arrays.

## Hooks

React hooks for reading and subscribing to store state.

- [`useStore`](/zustand/reference/hooks/use-store.md) — Access and subscribe to a vanilla store from a React component.
- [`useStoreWithEqualityFn`](/zustand/reference/hooks/use-store-with-equality-fn.md) — Like `useStore`, but with a custom equality function.
- [`useShallow`](/zustand/reference/hooks/use-shallow.md) — Derive a stable reference from a selector using shallow comparison.

## Middlewares

Composable middleware functions for extending store behavior.

- [`persist`](/zustand/reference/middlewares/persist.md) — Persist and rehydrate state using `localStorage` or a custom storage engine.
- [`devtools`](/zustand/reference/middlewares/devtools.md) — Connect a store to Redux DevTools for time-travel debugging.
- [`redux`](/zustand/reference/middlewares/redux.md) — Use a reducer and dispatch pattern similar to Redux.
- [`immer`](/zustand/reference/middlewares/immer.md) — Write state updates with mutable syntax using Immer.
- [`combine`](/zustand/reference/middlewares/combine.md) — Combine separate state slices into a single store with inferred types.
- [`subscribeWithSelector`](/zustand/reference/middlewares/subscribe-with-selector.md) — Subscribe to a slice of state with selector and equality support.

## Integrations

In-depth guides for using Zustand alongside third-party libraries.

- [Persisting store data](/zustand/reference/integrations/persisting-store-data.md) — Detailed guide to the `persist` middleware and storage adapters.
- [Immer middleware](/zustand/reference/integrations/immer-middleware.md) — Detailed guide to the `immer` middleware.
- [Third-party libraries](/zustand/reference/integrations/third-party-libraries.md) — Using Zustand with other libraries in the ecosystem.

## Migrations

Upgrade guides between major versions.

- [Migrating to v5](/zustand/reference/migrations/migrating-to-v5.md) — How to upgrade from Zustand v4.
- [Migrating to v4](/zustand/reference/migrations/migrating-to-v4.md) — How to upgrade from Zustand v3.

## Previous versions

APIs that existed in older versions of Zustand and are no longer recommended for new code.

- [createContext (v3)](/zustand/reference/previous-versions/zustand-v3-create-context.md) — The `createContext` export from `zustand/context`, deprecated in v4 and removed in v5.
