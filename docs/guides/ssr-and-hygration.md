---
title: SSR and Hydration
nav: 15
---

## Server Side Rendering (SSR)

Sever Side Rendering (SSR) is a technique that help us to render our components into
HTML strings on the server, send them directly to the browser, and finally "hydrate" the
static markup into a fully interactive app on the client.

## Hydration

Hydration turns the initial HTML snapshot from the server into a fully interactive app
that runs in the browser. The right way to "hydrate" a component is by using [hydrateRoot](https://react.dev/reference/react-dom/client/hydrateRoot).
