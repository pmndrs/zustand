## Start here

If you are new to Zustand, begin here for installation, a high-level overview, and a hands-on tutorial.

- [Introduction](/zustand/learn/getting-started/introduction.md) — Install Zustand and create your first store.
- [Comparison with other tools](/zustand/learn/getting-started/comparison.md) — See how Zustand compares to Redux, Jotai, Recoil, and others.
- [Tutorial: Tic Tac Toe](/zustand/learn/guides/tutorial-tic-tac-toe.md) — Build a complete game to learn Zustand concepts step by step.

## Core concepts

The fundamentals of reading and updating state in a Zustand store.

- [Updating state](/zustand/learn/guides/updating-state.md) — How to update primitive values, objects, and nested state.
- [Practice with no store actions](/zustand/learn/guides/practice-with-no-store-actions.md) — Define state updates outside the store for simpler patterns.
- [Slices pattern](/zustand/learn/guides/slices-pattern.md) — Split a large store into smaller, composable slices.
- [Immutable state and merging](/zustand/learn/guides/immutable-state-and-merging.md) — Understand how Zustand merges state and when to spread manually.
- [Maps and sets usage](/zustand/learn/guides/maps-and-sets-usage.md) — Work with `Map` and `Set` inside Zustand state correctly.

## Performance and rendering

Techniques for keeping re-renders minimal and components fast.

- [Prevent rerenders with useShallow](/zustand/learn/guides/prevent-rerenders-with-use-shallow.md) — Use shallow comparison to avoid unnecessary re-renders when selecting objects.
- [Connect to state with URL hash](/zustand/learn/guides/connect-to-state-with-url-hash.md) — Sync store state with the URL hash for shareable UI state.
- [Event handler in pre React 18](/zustand/learn/guides/event-handler-in-pre-react-18.md) — Handle the batching edge case in React 17 and earlier.

## TypeScript path

Guides for typing stores, actions, and selectors with TypeScript.

- [Beginner TypeScript](/zustand/learn/guides/beginner-typescript.md) — Type a basic store with state and actions.
- [Advanced TypeScript](/zustand/learn/guides/advanced-typescript.md) — Type slices, middleware stacks, and complex patterns.
- [Auto-generating selectors](/zustand/learn/guides/auto-generating-selectors.md) — Generate typed selectors automatically from a store definition.

## Frameworks and platforms

Using Zustand in server-rendered and framework-specific environments.

- [Next.js](/zustand/learn/guides/nextjs.md) — Set up Zustand in a Next.js app with proper SSR handling.
- [SSR and hydration](/zustand/learn/guides/ssr-and-hydration.md) — Avoid hydration mismatches when rendering on the server.
- [Initialize state with props](/zustand/learn/guides/initialize-state-with-props.md) — Seed a store's initial state from React component props.

## Testing and quality

Best practices for writing reliable, maintainable code with Zustand.

- [Testing stores and components](/zustand/learn/guides/testing.md) — Test store logic and React components that consume a store.
- [Flux-inspired practice](/zustand/learn/guides/flux-inspired-practice.md) — Apply Flux conventions to keep state changes predictable.
- [How to reset state](/zustand/learn/guides/how-to-reset-state.md) — Reset a store back to its initial state on demand.
