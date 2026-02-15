---
title: Docs style guide
description: Conventions for writing and maintaining Zustand documentation.
---

## Voice and framing

- Lead with the problem and outcome before showing code.
- Prefer short sentences, active voice, and concrete nouns.
- Assume readers know React but not Zustand internals; avoid jargon unless defined.

## Page structure

1. Summary (2-3 sentences) that states the goal and when to use the feature.
2. Show the minimal working snippet first; follow with deeper options.
3. Add an "Edge cases" or "Gotchas" section when behavior can surprise readers.
4. Finish with a small checklist or "See also" links.

## Headings and length

- Use H2 for major sections and keep sections tight; split pages that exceed ~600 words into task-sized topics.
- Avoid manual tables of contents; rely on the sidebar and in-page TOC.

## Code blocks

- Use `ts` or `tsx` fences for TypeScript, `js` or `jsx` otherwise.
- Keep snippets minimal: remove imports not shown in text, prefer inline handlers over unrelated UI.
- Highlight key lines with comments only when they clarify behavior (not restating the code).

## Links and cross-navigation

- Link to related guides, hooks, and middleware from each page's end.
- When mentioning React concepts, link to the relevant react.dev page if it helps context.

## Examples and sandboxes

- Provide a runnable link (StackBlitz or CodeSandbox) when adding a new tutorial or long guide.
- Keep sandbox dependencies aligned with the versions used in this repo.

## Accessibility and assets

- Add `alt` text for images and explain diagrams in the surrounding text.
- Avoid relying solely on color to convey meaning in screenshots or diagrams.

## Frontmatter

- Include `title` and `description` for every page. Use `pageType: home` only on the landing page.

## Review checklist (before merging)

- Does the page answer who, when, and how in the first screenful?
- Are state updates shown with selectors and without unnecessary re-renders?
- Are edge cases and common pitfalls covered or linked?
- Do links work locally under `pnpm docs:dev`?
