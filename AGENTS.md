<!-- crag:auto-start -->
# AGENTS.md

> Generated from governance.md by crag. Regenerate: `crag compile --target agents-md`

## Project: zustand

🐻 Bear necessities for state management in React

## Quality Gates

All changes must pass these checks before commit:

### Lint
1. `npx eslint . --max-warnings 0`
2. `npx tsc --noEmit`

### Test
1. `npm run test`

### Build
1. `npm run build`

### Ci (inferred from workflow)
1. `pnpm run test:spec`
2. `sed -i~ 's/"isolatedDeclarations": true,//' tsconfig.json`
3. `sed -i~ 's/"verbatimModuleSyntax": true,//' tsconfig.json`
4. `sed -i~ 's/"moduleResolution": "bundler",/"moduleResolution": "node",/' tsconfig.json`
5. `sed -i~ 's/"allowImportingTsExtensions": true,//' tsconfig.json`
6. `sed -i~ 's/"zustand": \["\.\/src\/index\.ts"\],/"zustand": [".\/dist\/index.d.ts"],/' tsconfig.json`
7. `sed -i~ 's/"zustand\/\*": \["\.\/src\/\*\.ts"\]/"zustand\/*": [".\/dist\/*.d.ts"]/' tsconfig.json`

### Contributor docs (advisory — confirm before enforcing)
1. `pnpm run fix:format  # from CONTRIBUTING.md`
2. `pnpm run build-watch  # from CONTRIBUTING.md`

## Coding Standards

- Stack: node, typescript
- Follow project commit conventions

## Architecture

- Type: monolith
- Entry: ./index.js

## Key Directories

- `.github/` — CI/CD
- `docs/` — documentation
- `src/` — source
- `tests/` — tests

## Testing

- Framework: vitest
- Layout: flat

## Code Style

- Linter: eslint

## Anti-Patterns

Do not:
- Do not leave `console.log` in production code — use a proper logger
- Do not use synchronous filesystem APIs in request handlers
- Do not use `any` type — use `unknown` or proper types instead
- Do not use `@ts-ignore` — fix the type error or use `@ts-expect-error` with a reason
- Prefer `as const` over `enum` for string unions

## Framework Conventions

- React 19.2.4
- Use functional components with hooks — no class components

## Security

- No hardcoded secrets — grep for sk_live, AKIA, password= before commit

## Workflow

1. Read `governance.md` at the start of every session — it is the single source of truth.
2. Run all mandatory quality gates before committing.
3. If a gate fails, fix the issue and re-run only the failed gate.
4. Use the project commit conventions for all changes.

<!-- crag:auto-end -->
