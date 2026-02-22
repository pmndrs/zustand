import * as path from 'node:path'
import { defineConfig } from '@rspress/core'
import { transformerNotationHighlight } from '@shikijs/transformers'
import { pluginLlms } from '@rspress/plugin-llms'
import { pluginPreview } from '@rspress/plugin-preview'
import { pluginPlayground } from '@rspress/plugin-playground'

const learnSidebar = [
  {
    text: 'Start here',
    items: [
      { text: 'Introduction', link: '/getting-started/introduction' },
      {
        text: 'Comparison with other tools',
        link: '/getting-started/comparison',
      },
      { text: 'Tutorial: Tic Tac Toe', link: '/guides/tutorial-tic-tac-toe' },
    ],
  },
  {
    text: 'State management basics',
    items: [
      { text: 'Updating state', link: '/guides/updating-state' },
      {
        text: 'Practice with no store actions',
        link: '/guides/practice-with-no-store-actions',
      },
      { text: 'Slices pattern', link: '/guides/slices-pattern' },
      {
        text: 'Immutable state and merging',
        link: '/guides/immutable-state-and-merging',
      },
      { text: 'Maps and sets usage', link: '/guides/maps-and-sets-usage' },
    ],
  },
  {
    text: 'Performance and rendering',
    items: [
      {
        text: 'Prevent rerenders with useShallow',
        link: '/guides/prevent-rerenders-with-use-shallow',
      },
      {
        text: 'Connect to state with URL hash',
        link: '/guides/connect-to-state-with-url-hash',
      },
      {
        text: 'Event handler in pre React 18',
        link: '/guides/event-handler-in-pre-react-18',
      },
    ],
  },
  {
    text: 'TypeScript path',
    items: [
      { text: 'Beginner TypeScript', link: '/guides/beginner-typescript' },
      { text: 'Advanced TypeScript', link: '/guides/advanced-typescript' },
      {
        text: 'Auto-generating selectors',
        link: '/guides/auto-generating-selectors',
      },
    ],
  },
  {
    text: 'Frameworks and platforms',
    items: [
      { text: 'Next.js', link: '/guides/nextjs' },
      { text: 'SSR and hydration', link: '/guides/ssr-and-hydration' },
      {
        text: 'Initialize state with props',
        link: '/guides/initialize-state-with-props',
      },
    ],
  },
  {
    text: 'Testing and quality',
    items: [
      { text: 'Testing stores and components', link: '/guides/testing' },
      {
        text: 'Flux-inspired practice',
        link: '/guides/flux-inspired-practice',
      },
      { text: 'How to reset state', link: '/guides/how-to-reset-state' },
    ],
  },
  {
    text: 'Hands-on tutorials',
    items: [
      { text: 'Build Tic Tac Toe', link: '/guides/tutorial-tic-tac-toe' },
      {
        text: 'Persist state to storage',
        link: '/integrations/persisting-store-data',
      },
      {
        text: 'Initialize state from props',
        link: '/guides/initialize-state-with-props',
      },
      {
        text: 'Hydrate on the server and client',
        link: '/guides/ssr-and-hydration',
      },
    ],
  },
  {
    text: 'Tutorials: performance and UX',
    items: [
      {
        text: 'Prevent rerenders with useShallow',
        link: '/guides/prevent-rerenders-with-use-shallow',
      },
      {
        text: 'Connect to state with URL hash',
        link: '/guides/connect-to-state-with-url-hash',
      },
    ],
  },
  {
    text: 'Tutorials: testing and fixes',
    items: [
      { text: 'Test stores and components', link: '/guides/testing' },
      {
        text: 'Flux-inspired practice',
        link: '/guides/flux-inspired-practice',
      },
      { text: 'How to reset state', link: '/guides/how-to-reset-state' },
      {
        text: 'Event handler in pre React 18',
        link: '/guides/event-handler-in-pre-react-18',
      },
      {
        text: 'Practice with no store actions',
        link: '/guides/practice-with-no-store-actions',
      },
    ],
  },
]

const referenceSidebar = [
  {
    text: 'APIs',
    items: [
      { text: 'create ⚛️', link: '/apis/create' },
      { text: 'createStore', link: '/apis/create-store' },
      {
        text: 'createWithEqualityFn ⚛️',
        link: '/apis/create-with-equality-fn',
      },
      { text: 'shallow', link: '/apis/shallow' },
    ],
  },
  {
    text: 'Hooks',
    items: [
      { text: 'useStore ⚛️', link: '/hooks/use-store' },
      {
        text: 'useStoreWithEqualityFn ⚛️',
        link: '/hooks/use-store-with-equality-fn',
      },
      { text: 'useShallow ⚛️', link: '/hooks/use-shallow' },
    ],
  },
  {
    text: 'Middlewares',
    items: [
      { text: 'persist', link: '/middlewares/persist' },
      { text: 'devtools', link: '/middlewares/devtools' },
      { text: 'redux', link: '/middlewares/redux' },
      { text: 'immer', link: '/middlewares/immer' },
      { text: 'combine', link: '/middlewares/combine' },
      {
        text: 'subscribeWithSelector',
        link: '/middlewares/subscribe-with-selector',
      },
    ],
  },
  {
    text: 'Integrations',
    items: [
      {
        text: 'Persisting store data',
        link: '/integrations/persisting-store-data',
      },
      { text: 'Immer middleware', link: '/integrations/immer-middleware' },
      {
        text: 'Third-party libraries',
        link: '/integrations/third-party-libraries',
      },
    ],
  },
  {
    text: 'Patterns and guides',
    items: [
      { text: 'Slices pattern', link: '/guides/slices-pattern' },
      { text: 'SSR and hydration', link: '/guides/ssr-and-hydration' },
      {
        text: 'Prevent rerenders with useShallow',
        link: '/guides/prevent-rerenders-with-use-shallow',
      },
      { text: 'Testing', link: '/guides/testing' },
    ],
  },
  {
    text: 'Migrations',
    items: [
      { text: 'Migrating to v5', link: '/migrations/migrating-to-v5' },
      { text: 'Migrating to v4', link: '/migrations/migrating-to-v4' },
    ],
  },
]

export default defineConfig({
  plugins: [pluginLlms(), pluginPreview(), pluginPlayground()],
  markdown: {
    shiki: {
      transformers: [transformerNotationHighlight()],
    },
  },
  // @ts-expect-error - RSPress doesn't have the correct types for this yet
  base: import.meta.env.GITHUB_PAGES === 'true' ? '/zustand/' : undefined,
  root: path.join(path.dirname(__dirname), 'docs'),
  title: 'Zustand Docs',
  icon: '/favicon.ico',
  logo: '/favicon.ico',
  logoText: 'Zustand',
  llms: true,
  themeConfig: {
    editLink: {
      docRepoBaseUrl: 'https://github.com/pmndrs/zustand/tree/main/docs',
    },
    nav: [
      {
        text: 'Learn',
        link: '/learn/',
        activeMatch: '/learn/',
      },
      {
        text: 'Reference',
        link: '/reference/',
        activeMatch: '/reference/',
      },
    ],
    sidebar: {
      '/learn/': learnSidebar,
      '/getting-started/': learnSidebar,
      '/guides/': learnSidebar,
      '/reference/': referenceSidebar,
      '/apis/': referenceSidebar,
      '/hooks/': referenceSidebar,
      '/middlewares/': referenceSidebar,
      '/integrations/': referenceSidebar,
      '/migrations/': referenceSidebar,
    },
    socialLinks: [
      {
        icon: 'github',
        mode: 'link',
        content: 'https://github.com/pmndrs/zustand',
      },
      {
        icon: 'npm',
        mode: 'link',
        content: 'https://www.npmjs.com/package/zustand',
      },
    ],
  },
})
