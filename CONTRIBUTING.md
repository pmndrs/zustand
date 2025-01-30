# Contributing

## General Guideline

### Reporting Issues

If you have found what you think is a bug, please [start a discussion](https://github.com/pmndrs/zustand/discussions/new?category=bug-report).

For any usage questions, please [start a discussion](https://github.com/pmndrs/zustand/discussions/new?category=q-a).

### Suggesting New Features

If you are here to suggest a feature, first [start a discussion](https://github.com/pmndrs/zustand/discussions/new?category=ideas) if it does not already exist. From there, we will discuss use-cases for the feature and then finally discuss how it could be implemented.

### Committing

We are applying [conventional commit spec](https://www.conventionalcommits.org/en/v1.0.0/) here. In short, that means a commit has to be one of the following types:

Your commit type must be one of the following:

- **feat**: A new feature.
- **fix**: A bug fix.
- **refactor**: A code change that neither fixes a bug nor adds a feature.
- **chore**: Changes to the build process, configuration, dependencies, CI/CD pipelines, or other auxiliary tools and libraries.
- **docs**: Documentation-only changes.
- **test**: Adding missing or correcting existing tests.

If you are unfamiliar with the usage of conventional commits,
the short version is to simply specify the type as a first word,
and follow it with a colon and a space, then start your message
from a lowercase letter, like this:

```
feat: add a 'foo' type support
```

You can also specify the scope of the commit in the parentheses after a type:

```
fix(react): change the 'bar' parameter type
```

### Development

If you would like to contribute by fixing an open issue or developing a new feature you can use this suggested workflow:

#### General

1. Fork this repository
2. Create a new feature branch based off the `main` branch
3. Follow the [Core](#Core) and/or the [Documentation](#Documentation) guide below and come back to this once done
4. Run `pnpm run fix:format` to format the code
5. Git stage your required changes and commit (review the commit guidelines below)
6. Submit the PR for review

##### Core

1. Install dependencies by running `pnpm install`.
2. Create failing tests for your fix or new feature in the [`tests`](./tests/) folder.
3. Implement your changes
4. Build the library by running `pnpm run build` _(Pro-tip: `pnpm run build-watch` runs the build in watch mode)_
5. Run the tests by running `pnpm run test` and ensure that they pass.
6. You can use `pnpm link` to sym-link this package and test it locally on your own project. Alternatively, you may use CodeSandbox CI's canary releases to test the changes in your own project (requires a PR to be created first)
7. Follow step 4 and onwards from the [General](#General) guide above to bring it to the finish line

### Pull Requests

Please try to keep your pull request focused in scope and avoid including unrelated commits.

After you have submitted your pull request, we'll try to get back to you as soon as possible. We may suggest some changes or request improvements, therefore, please check ✅ ["Allow edits from maintainers"](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request-from-a-fork) on your PR

## Zustand-specific Guideline

##### Documentation

1. Separately, clone the [`pmndrs/website`](https://github.com/pmndrs/website)
   (you don't need to fork it).
   1. This repo runs most of the doc websites under the pmndrs banner,
      including React Three Fiber and Zustand.
   2. Switch to the `docs` branch.
   3. Now, you should have two repositories locally.
2. Inside the `pmndrs/website` directory, run `npm install` and then `npm run dev`.
   1. This will launch the website locally. You should be able to open and see the various documentation sites.
3. One little catch here is that the website reads directly from Github, not locally. As a temporary measure, you can do the following (don't commit any changes made in the pmndrs/website repo):
   1. In your own Zustand fork, create a new working branch (further related to as `[your-branch]`).
   2. Inside website codebase, open `src/data/libraries.ts`.
   3. Within the `zustand` key, change `docs: 'pmndrs/zustand/main/docs'` to `docs: '[your-username]/zustand/[your-branch]/docs'`. (e.g., `docs: 'foo/zustand/docs-test/docs'`)
   4. Now, inside your Zustand fork, make the appropriate changes to the documentation files in the `docs` folder.
   5. Restart the website locally (`control + c` -> `npm run dev`).
   6. Sometimes you may have to also remove the `temp` directory in the website directory (`rm -r temp`).
   7. Visit the Zustand docs locally and you should see the content you've just changed.
4. Follow step 4 and onwards from the [General](#General) guide above to bring it to the finish line.

Thank you for contributing! :heart:
