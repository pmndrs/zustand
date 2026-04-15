<!-- crag:auto-start -->
# Copilot Instructions — zustand

> Generated from governance.md by crag. Regenerate: `crag compile --target copilot`

🐻 Bear necessities for state management in React

**Stack:** node, typescript

## Runtimes

node

## Quality Gates

When you propose changes, the following checks must pass before commit:

- **lint**: `npx eslint . --max-warnings 0`
- **lint**: `npx tsc --noEmit`
- **test**: `npm run test`
- **build**: `npm run build`
- **ci (inferred from workflow)**: `pnpm run test:spec`
- **ci (inferred from workflow)**: `sed -i~ 's/"isolatedDeclarations": true,//' tsconfig.json`
- **ci (inferred from workflow)**: `sed -i~ 's/"verbatimModuleSyntax": true,//' tsconfig.json`
- **ci (inferred from workflow)**: `sed -i~ 's/"moduleResolution": "bundler",/"moduleResolution": "node",/' tsconfig.json`
- **ci (inferred from workflow)**: `sed -i~ 's/"allowImportingTsExtensions": true,//' tsconfig.json`
- **ci (inferred from workflow)**: `sed -i~ 's/"zustand": \["\.\/src\/index\.ts"\],/"zustand": [".\/dist\/index.d.ts"],/' tsconfig.json`
- **ci (inferred from workflow)**: `sed -i~ 's/"zustand\/\*": \["\.\/src\/\*\.ts"\]/"zustand\/*": [".\/dist\/*.d.ts"]/' tsconfig.json`
- **contributor docs (advisory — confirm before enforcing)**: `pnpm run fix:format  # from CONTRIBUTING.md`
- **contributor docs (advisory — confirm before enforcing)**: `pnpm run build-watch  # from CONTRIBUTING.md`

## Expectations for AI-Assisted Code

1. **Run gates before suggesting a commit.** If you cannot run them (no shell access), explicitly remind the human to run them.
2. **Respect classifications.** `MANDATORY` gates must pass. `OPTIONAL` gates should pass but may be overridden with a note. `ADVISORY` gates are informational only.
3. **Respect workspace paths.** When a gate is scoped to a subdirectory, run it from that directory.
4. **No hardcoded secrets.** - No hardcoded secrets — grep for sk_live, AKIA, password= before commit
5. Follow project commit conventions.
6. **Conservative changes.** Do not rewrite unrelated files. Do not add new dependencies without explaining why.

## Tool Context

This project uses **crag** (https://www.npmjs.com/package/@whitehatd/crag) as its AI-agent governance layer. The `governance.md` file is the authoritative source. If you have shell access, run `crag check` to verify the infrastructure and `crag diff` to detect drift.

<!-- crag:auto-end -->
