---
trigger: always_on
description: Governance rules for zustand — compiled from governance.md by crag
---

# Windsurf Rules — zustand

Generated from governance.md by crag. Regenerate: `crag compile --target windsurf`

## Project

🐻 Bear necessities for state management in React

**Stack:** node, typescript

## Runtimes

node

## Cascade Behavior

When Windsurf's Cascade agent operates on this project:

- **Always read governance.md first.** It is the single source of truth for quality gates and policies.
- **Run all mandatory gates before proposing changes.** Stop on first failure.
- **Respect classifications.** OPTIONAL gates warn but don't block. ADVISORY gates are informational.
- **Respect path scopes.** Gates with a `path:` annotation must run from that directory.
- **No destructive commands.** Never run rm -rf, dd, DROP TABLE, force-push to main, curl|bash, docker system prune.
- - No hardcoded secrets — grep for sk_live, AKIA, password= before commit
- Follow the project commit conventions.

## Quality Gates (run in order)

1. `npx eslint . --max-warnings 0`
2. `npx tsc --noEmit`
3. `npm run test`
4. `npm run build`
5. `pnpm run test:spec`
6. `sed -i~ 's/"isolatedDeclarations": true,//' tsconfig.json`
7. `sed -i~ 's/"verbatimModuleSyntax": true,//' tsconfig.json`
8. `sed -i~ 's/"moduleResolution": "bundler",/"moduleResolution": "node",/' tsconfig.json`
9. `sed -i~ 's/"allowImportingTsExtensions": true,//' tsconfig.json`
10. `sed -i~ 's/"zustand": \["\.\/src\/index\.ts"\],/"zustand": [".\/dist\/index.d.ts"],/' tsconfig.json`
11. `sed -i~ 's/"zustand\/\*": \["\.\/src\/\*\.ts"\]/"zustand\/*": [".\/dist\/*.d.ts"]/' tsconfig.json`
12. `pnpm run fix:format  # from CONTRIBUTING.md`
13. `pnpm run build-watch  # from CONTRIBUTING.md`

## Rules of Engagement

1. **Minimal changes.** Don't rewrite files that weren't asked to change.
2. **No new dependencies** without explicit approval.
3. **Prefer editing** existing files over creating new ones.
4. **Always explain** non-obvious changes in commit messages.
5. **Ask before** destructive operations (delete, rename, migrate schema).

---

**Tool:** crag — https://www.npmjs.com/package/@whitehatd/crag
