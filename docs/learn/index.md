---
title: Learn
description: A guided path to understand Zustand fundamentals, common patterns, and when to reach for specific tools.
---

## Start here

If you are new to Zustand, begin here for installation, a high-level overview, and a hands-on tutorial.

- [Introduction](./getting-started/introduction.md) — Install Zustand and create your first store.
- [Comparison with other tools](./getting-started/comparison.md) — See how Zustand compares to Redux, Jotai, Recoil, and others.
- [Tutorial: Tic Tac Toe](./guides/tutorial-tic-tac-toe.md) — Build a complete game to learn Zustand concepts step by step.

## Core concepts

The fundamentals of reading and updating state in a Zustand store.

- [Updating state](./guides/updating-state.md) — How to update primitive values, objects, and nested state.
- [Practice with no store actions](./guides/practice-with-no-store-actions.md) — Define state updates outside the store for simpler patterns.
- [Slices pattern](./guides/slices-pattern.md) — Split a large store into smaller, composable slices.
- [Immutable state and merging](./guides/immutable-state-and-merging.md) — Understand how Zustand merges state and when to spread manually.
- [Maps and sets usage](./guides/maps-and-sets-usage.md) — Work with `Map` and `Set` inside Zustand state correctly.

## Performance and rendering

Techniques for keeping re-renders minimal and components fast.

- [Prevent rerenders with useShallow](./guides/prevent-rerenders-with-use-shallow.md) — Use shallow comparison to avoid unnecessary re-renders when selecting objects.
- [Connect to state with URL hash](./guides/connect-to-state-with-url-hash.md) — Sync store state with the URL hash for shareable UI state.
- [Event handler in pre React 18](./guides/event-handler-in-pre-react-18.md) — Handle the batching edge case in React 17 and earlier.

## TypeScript path

Guides for typing stores, actions, and selectors with TypeScript.

- [Beginner TypeScript](./guides/beginner-typescript.md) — Type a basic store with state and actions.
- [Advanced TypeScript](./guides/advanced-typescript.md) — Type slices, middleware stacks, and complex patterns.
- [Auto-generating selectors](./guides/auto-generating-selectors.md) — Generate typed selectors automatically from a store definition.

## Frameworks and platforms

Using Zustand in server-rendered and framework-specific environments.

- [Next.js](./guides/nextjs.md) — Set up Zustand in a Next.js app with proper SSR handling.
- [SSR and hydration](./guides/ssr-and-hydration.md) — Avoid hydration mismatches when rendering on the server.
- [Initialize state with props](./guides/initialize-state-with-props.md) — Seed a store's initial state from React component props.

## Testing and quality

Best practices for writing reliable, maintainable code with Zustand.

- [Testing stores and components](./guides/testing.md) — Test store logic and React components that consume a store.
- [Flux-inspired practice](./guides/flux-inspired-practice.md) — Apply Flux conventions to keep state changes predictable.
- [How to reset state](./guides/how-to-reset-state.md) — Reset a store back to its initial state on demand.
