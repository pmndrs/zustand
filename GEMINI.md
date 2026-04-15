<!-- crag:auto-start -->
# GEMINI.md

> Generated from governance.md by crag. Regenerate: `crag compile --target gemini`

## Project Context

- **Name:** zustand
- **Description:** 🐻 Bear necessities for state management in React
- **Stack:** node, typescript
- **Runtimes:** node

## Rules

### Quality Gates

Run these checks in order before committing any changes:

1. [lint] `npx eslint . --max-warnings 0`
2. [lint] `npx tsc --noEmit`
3. [test] `npm run test`
4. [build] `npm run build`
5. [ci (inferred from workflow)] `pnpm run test:spec`
6. [ci (inferred from workflow)] `sed -i~ 's/"isolatedDeclarations": true,//' tsconfig.json`
7. [ci (inferred from workflow)] `sed -i~ 's/"verbatimModuleSyntax": true,//' tsconfig.json`
8. [ci (inferred from workflow)] `sed -i~ 's/"moduleResolution": "bundler",/"moduleResolution": "node",/' tsconfig.json`
9. [ci (inferred from workflow)] `sed -i~ 's/"allowImportingTsExtensions": true,//' tsconfig.json`
10. [ci (inferred from workflow)] `sed -i~ 's/"zustand": \["\.\/src\/index\.ts"\],/"zustand": [".\/dist\/index.d.ts"],/' tsconfig.json`
11. [ci (inferred from workflow)] `sed -i~ 's/"zustand\/\*": \["\.\/src\/\*\.ts"\]/"zustand\/*": [".\/dist\/*.d.ts"]/' tsconfig.json`
12. [contributor docs (advisory — confirm before enforcing)] `pnpm run fix:format  # from CONTRIBUTING.md`
13. [contributor docs (advisory — confirm before enforcing)] `pnpm run build-watch  # from CONTRIBUTING.md`

### Security

- No hardcoded secrets — grep for sk_live, AKIA, password= before commit

### Workflow

- Follow project commit conventions
- Run quality gates before committing
- Review security implications of all changes

<!-- crag:auto-end -->
