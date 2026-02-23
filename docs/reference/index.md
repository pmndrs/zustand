---
title: Reference
description: API-first reference for stores, hooks, middlewares, and integrations.
---

## APIs

Core functions for creating and configuring stores.

- [`create`](/reference/apis/create.md) — Create a store bound to React via hooks.
- [`createStore`](/reference/apis/create-store.md) — Create a standalone store without React.
- [`createWithEqualityFn`](/reference/apis/create-with-equality-fn.md) — Like `create`, but with a custom equality function.
- [`shallow`](/reference/apis/shallow.md) — Utility for shallow comparison of objects and arrays.

## Hooks

React hooks for reading and subscribing to store state.

- [`useStore`](/reference/hooks/use-store.md) — Access and subscribe to a vanilla store from a React component.
- [`useStoreWithEqualityFn`](/reference/hooks/use-store-with-equality-fn.md) — Like `useStore`, but with a custom equality function.
- [`useShallow`](/reference/hooks/use-shallow.md) — Derive a stable reference from a selector using shallow comparison.

## Middlewares

Composable middleware functions for extending store behavior.

- [`persist`](/reference/middlewares/persist.md) — Persist and rehydrate state using `localStorage` or a custom storage engine.
- [`devtools`](/reference/middlewares/devtools.md) — Connect a store to Redux DevTools for time-travel debugging.
- [`redux`](/reference/middlewares/redux.md) — Use a reducer and dispatch pattern similar to Redux.
- [`immer`](/reference/middlewares/immer.md) — Write state updates with mutable syntax using Immer.
- [`combine`](/reference/middlewares/combine.md) — Combine separate state slices into a single store with inferred types.
- [`subscribeWithSelector`](/reference/middlewares/subscribe-with-selector.md) — Subscribe to a slice of state with selector and equality support.

## Integrations

In-depth guides for using Zustand alongside third-party libraries.

- [Persisting store data](/reference/integrations/persisting-store-data.md) — Detailed guide to the `persist` middleware and storage adapters.
- [Immer middleware](/reference/integrations/immer-middleware.md) — Detailed guide to the `immer` middleware.
- [Third-party libraries](/reference/integrations/third-party-libraries.md) — Using Zustand with other libraries in the ecosystem.

## Migrations

Upgrade guides between major versions.

- [Migrating to v5](/reference/migrations/migrating-to-v5.md) — How to upgrade from Zustand v4.
- [Migrating to v4](/reference/migrations/migrating-to-v4.md) — How to upgrade from Zustand v3.

## Previous versions

APIs that existed in older versions of Zustand and are no longer recommended for new code.

- [createContext (v3)](/reference/previous-versions/zustand-v3-create-context.md) — The `createContext` export from `zustand/context`, deprecated in v4 and removed in v5.
