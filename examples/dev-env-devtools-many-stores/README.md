# Better zustand devtools by @pavlobu

This demo shows you how to use redux devtools with @pavlobu/zustand-middleware.

This project is based on Create React App.

## Note on devOnlyDevtools() usage

Use this `import { devOnlyDevtools } from '@pavlobu/zustand` export instead of standard `devtools` export of zustand.
This helps to remove react devtools in prod build with less hustle.

#### A small react refresher:

- When running `npm run build` `NODE_ENV` is `production`. But
- when running `npm run start` `NODE_ENV` is `development`.

#### _This may be not flexible in some cases._

For example if you need to have a non-prod build of this react on lower environments
`dev`, `qa`, `uat` etc.
But we have a solution. In this demo we are using `npm run build:dev` and `npm run build:prod`
commands that read `.env.production` and `.env.development` files.

The important variable in those `.env.*` files is `REACT_APP_CUSTOM_NODE_ENV`, if it's set
and it's value is `production` then devtools will be excluded, so you don't have to remove devOnlyDevtools() middleware wrapper on all of your zustand stores for prod build.
This variable is handled by `@pavlobu/zustand` package internally. But you don't have to create these `.env.*` files
with this `REACT_APP_CUSTOM_NODE_ENV` variable for basic usage.

### _Simple `npm run build` will also remove redux devtools middleware, because it's treated as prod build by default._

---

## Demo of redux devtools rewind feature

In this demo you can see a Redux Devtools Extension state rewind feature in action, when multiple zustand stores connected to one Redux Devtools Extension connection.
The code for this demo gif is in this current project. Here is the [link](https://github.com/pavlobu/zustand/tree/%40pavlobu-zustand-devtools-middleware/examples/dev-env-devtools-many-stores) in case if you need it

![demo of zustand devtools middleware by pavlobu. showing how redux devtools rewind feature works](https://github.com/pavlobu/zustand/blob/e0ffeebebfb825f30c36992f2110f978f4f44c93/examples/dev-env-devtools-many-stores/docs/img/zustand-devtools-rewind.gif)

---

---

# Getting Started with this demo project

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
