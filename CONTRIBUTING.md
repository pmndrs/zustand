# Contributing

## Reporting Issues

If you have found what you think is a bug, please [start a discussion](https://github.com/pmndrs/zustand/discussions/new).

Also for usage questions, please [start a discussion](https://github.com/pmndrs/zustand/discussions/new).

## Suggesting new features

If you are here to suggest a feature, first [start a discussion](https://github.com/pmndrs/zustand/discussions/new) if it does not already exist. From there, we will discuss use-cases for the feature and then finally discuss how it could be implemented.

## Documentation

- Fork the [Zustand repo](https://github.com/pmndrs/zustand/) into your own Github account
- Locally, clone down your fork
- Separately, clone the [Pmdrs-Website](https://github.com/pmndrs/website}
  - this runs most of the doc websites under the pmndrs banner, including React Three Fiber and Zustand
  - Switch to the `docs`-branch.
- Now, you should have two repositories locally
- Inside the website folder, run `npm install` and then `npm run dev`
  - This will launch the website locally. You should be able to open and see the various documentation sites
- One little catch here is that the website reads directly from Github, not locally. As a temporary measure, you can do the following (without actually committing these changes):
  - Inside website codebase, open `src/data/libraries.ts`
  - Within the `Zustand` key, change `docs: 'pmndrs/zustand/main/docs`, to `docs: '[username]/zustand/[test-branch]/docs'`,
    - For example,`docs: 'chrisk-7777/zustand/docs-test/docs'`,
  - Now, inside your Zustand fork, make the appropriate changes to the `.md` files in the `/docs` folder
  - Push those changes up to your fork on a branch such as `docs-test` (_this should match whatever you set it to above in `libraries.ts`_
  - Restart the website locally (`control + c` -> `npm run dev`)
  - Visit the Zustand docs locally, and you should see the content you just pushed up
- Once you are happy with your changes, commit them to a real branch and push up to your fork
  - For now there are no formal naming conventions for branches.
  - Commit messages follow a [conventional commit](#committing) style.
- Jump back to the official repo (this one) and raise a PR from the branch you just pushed up

## Development

If you would like to contribute by fixing an open issue or developing a new feature you can use this suggested workflow:

- Fork this repository.
- Create a new feature branch based off the `main` branch.
- Install dependencies by running `$ yarn`. [(version 1)](https://classic.yarnpkg.com/lang/en/docs/install)
- Create failing tests for your fix or new feature.
- Implement your changes and confirm that all test are passing. You can run the tests continuously during development via the `$ yarn test:dev` command.
- If you want to test it in a React project you can either use `$ yarn link` or the `yalc` package.
- Git stage your required changes and commit (see below commit guidelines).
- Submit PR for review.

### Committing

We are applying the ideas of [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/) here. In short that means that commit has to be one of the following (a _type_ in conventional commit speech):

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **test**: Adding missing or correcting existing tests
- **chore**: Changes to the build process or auxiliary tools and libraries such as documentation
  generation

## Pull requests

Please try to keep your pull request focused in scope and avoid including unrelated commits.

After you have submitted your pull request, we'll try to get back to you as soon as possible. We may suggest some changes or improvements.

Thank you for contributing! :heart:
