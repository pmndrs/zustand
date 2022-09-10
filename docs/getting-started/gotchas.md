---
title: Gotchas
description:
nav: 18
---

On this page we can somethings that we need to keep in mind when you are using
Zustand with or without other libraries.

## Immer

### My subscriptions aren't being called

If you are using ImmerJS, make sure you are actually following the rules of
ImmerJS.

For example, you have to add [immerable] = true for class objects to work. If
you don't to this, ImmerJS will still mutate the object, but not as a proxy, so
it will also update the base state. Zustand checks if the state has actually
changed, so since both the base state as well as the next state are equal (if
you don't do it correctly), it will skip calling the subscriptions.
