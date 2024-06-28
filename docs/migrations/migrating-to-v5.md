---
title: Migrating to v5
nav: 22
---

The only breaking changes are in types.
If you are using Zustand with TypeScript
or JSDoc type annotations,
this guide applies.
Otherwise, no migration is required.

## `setState` / `set`

**Change**

```diff
- setState:
-   (partial: T | Partial<T> | ((state: T) => T | Partial<T>), replace?: boolean | undefined) => void;
+ setState:
+   (partial: T | Partial<T> | ((state: T) => T | Partial<T>), replace?: false) => void;
+   (state: T | ((state: T) => T), replace: true) => void;
```

**Migration**

If you are not using the `replace` flag, no migration is required.

If you are using the `replace` flag and it's set to `true`,
you must provide a complete state object.
This change ensures that `store.setState({}, true)` (which results in an invalid state) is no longer considered valid.

**Examples:**

```ts
// Partial state update (valid)
store.setState({ key: 'value' });

// Complete state replacement (valid)
store.setState({ key: 'value' }, true);

// Incomplete state replacement (invalid)
store.setState({}, true); // Error
```

### Handling Dynamic `replace` Flag

If the value of the `replace` flag is dynamic and determined at runtime, you might face issues. To handle this, you can use a workaround by annotating the `replace` parameter with `as any`:

```ts
const replaceFlag = Math.random() > 0.5;
store.setState(partialOrFull, replaceFlag as any);
```
