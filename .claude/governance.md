# Governance — zustand
# Inferred by crag analyze — review and adjust as needed

## Identity
- Project: zustand
- Description: 🐻 Bear necessities for state management in React
- Stack: node, typescript
- Workspace: pnpm

## Gates (run in order, stop on failure)
### Lint
- npx eslint . --max-warnings 0
- npx tsc --noEmit

### Test
- npm run test

### Build
- npm run build

### CI (inferred from workflow)
- pnpm run test:spec
- sed -i~ 's/"isolatedDeclarations": true,//' tsconfig.json
- sed -i~ 's/"verbatimModuleSyntax": true,//' tsconfig.json
- sed -i~ 's/"moduleResolution": "bundler",/"moduleResolution": "node",/' tsconfig.json
- sed -i~ 's/"allowImportingTsExtensions": true,//' tsconfig.json
- sed -i~ 's/"zustand": \["\.\/src\/index\.ts"\],/"zustand": [".\/dist\/index.d.ts"],/' tsconfig.json
- sed -i~ 's/"zustand\/\*": \["\.\/src\/\*\.ts"\]/"zustand\/*": [".\/dist\/*.d.ts"]/' tsconfig.json

### Contributor docs (ADVISORY — confirm before enforcing)
- pnpm run fix:format  # from CONTRIBUTING.md
- pnpm run build-watch  # from CONTRIBUTING.md

## Advisories (informational, not enforced)
- actionlint  # [ADVISORY]

## Branch Strategy
- Trunk-based development
- Free-form commits
- Commit trailer: Co-Authored-By: Claude <noreply@anthropic.com>

## Security
- No hardcoded secrets — grep for sk_live, AKIA, password= before commit

## Autonomy
- Auto-commit after gates pass

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

## Dependencies
- Package manager: pnpm (pnpm-lock.yaml)
- Node: >=12.20.0

## Import Conventions
- Module system: CJS

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

