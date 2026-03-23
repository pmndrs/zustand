import * as path from 'node:path';
import { defineConfig } from '@rspress/core';
import { transformerNotationHighlight } from '@shikijs/transformers';
import { pluginLlms } from '@rspress/plugin-llms';
import { pluginPreview } from '@rspress/plugin-preview';
import { pluginPlayground } from '@rspress/plugin-playground';

const learnSidebar = [
  {
    text: 'Start here',
    items: [
      { text: 'Introduction', link: '/learn/getting-started/introduction' },
      {
        text: 'Comparison with other tools',
        link: '/learn/getting-started/comparison',
      },
      {
        text: 'Tutorial: Tic Tac Toe',
        link: '/learn/guides/tutorial-tic-tac-toe',
      },
    ],
  },
  {
    text: 'State management basics',
    items: [
      { text: 'Updating state', link: '/learn/guides/updating-state' },
      {
        text: 'Practice with no store actions',
        link: '/learn/guides/practice-with-no-store-actions',
      },
      { text: 'Slices pattern', link: '/learn/guides/slices-pattern' },
      {
        text: 'Immutable state and merging',
        link: '/learn/guides/immutable-state-and-merging',
      },
      {
        text: 'Maps and sets usage',
        link: '/learn/guides/maps-and-sets-usage',
      },
    ],
  },
  {
    text: 'Performance and rendering',
    items: [
      {
        text: 'Prevent rerenders with useShallow',
        link: '/learn/guides/prevent-rerenders-with-use-shallow',
      },
      {
        text: 'Connect to state with URL hash',
        link: '/learn/guides/connect-to-state-with-url-hash',
      },
      {
        text: 'Event handler in pre React 18',
        link: '/learn/guides/event-handler-in-pre-react-18',
      },
    ],
  },
  {
    text: 'TypeScript path',
    items: [
      {
        text: 'Beginner TypeScript',
        link: '/learn/guides/beginner-typescript',
      },
      {
        text: 'Advanced TypeScript',
        link: '/learn/guides/advanced-typescript',
      },
      {
        text: 'Auto-generating selectors',
        link: '/learn/guides/auto-generating-selectors',
      },
    ],
  },
  {
    text: 'Frameworks and platforms',
    items: [
      { text: 'Next.js', link: '/learn/guides/nextjs' },
      { text: 'SSR and hydration', link: '/learn/guides/ssr-and-hydration' },
      {
        text: 'Initialize state with props',
        link: '/learn/guides/initialize-state-with-props',
      },
    ],
  },
  {
    text: 'Testing and quality',
    items: [
      {
        text: 'Testing stores and components',
        link: '/learn/guides/testing',
      },
      {
        text: 'Flux-inspired practice',
        link: '/learn/guides/flux-inspired-practice',
      },
      { text: 'How to reset state', link: '/learn/guides/how-to-reset-state' },
    ],
  },
  {
    text: 'Hands-on tutorials',
    items: [
      {
        text: 'Build Tic Tac Toe',
        link: '/learn/guides/tutorial-tic-tac-toe',
      },
      {
        text: 'Persist state to storage',
        link: '/reference/integrations/persisting-store-data',
      },
      {
        text: 'Initialize state from props',
        link: '/learn/guides/initialize-state-with-props',
      },
      {
        text: 'Hydrate on the server and client',
        link: '/learn/guides/ssr-and-hydration',
      },
    ],
  },
  {
    text: 'Tutorials: performance and UX',
    items: [
      {
        text: 'Prevent rerenders with useShallow',
        link: '/learn/guides/prevent-rerenders-with-use-shallow',
      },
      {
        text: 'Connect to state with URL hash',
        link: '/learn/guides/connect-to-state-with-url-hash',
      },
    ],
  },
  {
    text: 'Tutorials: testing and fixes',
    items: [
      { text: 'Test stores and components', link: '/learn/guides/testing' },
      {
        text: 'Flux-inspired practice',
        link: '/learn/guides/flux-inspired-practice',
      },
      {
        text: 'How to reset state',
        link: '/learn/guides/how-to-reset-state',
      },
      {
        text: 'Event handler in pre React 18',
        link: '/learn/guides/event-handler-in-pre-react-18',
      },
      {
        text: 'Practice with no store actions',
        link: '/learn/guides/practice-with-no-store-actions',
      },
    ],
  },
];

const referenceSidebar = [
  {
    text: 'APIs',
    items: [
      { text: 'create', link: '/reference/apis/create', tag: 'react' },
      { text: 'createStore', link: '/reference/apis/create-store' },
      {
        text: 'createWithEqualityFn',
        link: '/reference/apis/create-with-equality-fn',
        tag: 'react',
      },
      { text: 'shallow', link: '/reference/apis/shallow' },
    ],
  },
  {
    text: 'Hooks',
    items: [
      { text: 'useStore', link: '/reference/hooks/use-store', tag: 'react' },
      {
        text: 'useStoreWithEqualityFn',
        link: '/reference/hooks/use-store-with-equality-fn',
        tag: 'react',
      },
      {
        text: 'useShallow',
        link: '/reference/hooks/use-shallow',
        tag: 'react',
      },
    ],
  },
  {
    text: 'Middlewares',
    items: [
      { text: 'persist', link: '/reference/middlewares/persist' },
      { text: 'devtools', link: '/reference/middlewares/devtools' },
      { text: 'redux', link: '/reference/middlewares/redux' },
      { text: 'immer', link: '/reference/middlewares/immer' },
      { text: 'combine', link: '/reference/middlewares/combine' },
      {
        text: 'subscribeWithSelector',
        link: '/reference/middlewares/subscribe-with-selector',
      },
    ],
  },
  {
    text: 'Integrations',
    items: [
      {
        text: 'Persisting store data',
        link: '/reference/integrations/persisting-store-data',
      },
      {
        text: 'Immer middleware',
        link: '/reference/integrations/immer-middleware',
      },
      {
        text: 'Third-party libraries',
        link: '/reference/integrations/third-party-libraries',
      },
    ],
  },
  {
    text: 'Patterns and guides',
    items: [
      { text: 'Slices pattern', link: '/learn/guides/slices-pattern' },
      { text: 'SSR and hydration', link: '/learn/guides/ssr-and-hydration' },
      {
        text: 'Prevent rerenders with useShallow',
        link: '/learn/guides/prevent-rerenders-with-use-shallow',
      },
      { text: 'Testing', link: '/learn/guides/testing' },
    ],
  },
  {
    text: 'Migrations',
    items: [
      {
        text: 'Migrating to v5',
        link: '/reference/migrations/migrating-to-v5',
      },
      {
        text: 'Migrating to v4',
        link: '/reference/migrations/migrating-to-v4',
      },
    ],
  },
  {
    text: 'Previous versions',
    items: [
      {
        text: 'createContext (v3)',
        link: '/reference/previous-versions/zustand-v3-create-context',
      },
    ],
  },
];

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
  themeConfig: {
    llmsUI: true,
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
      '/reference/': referenceSidebar,
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
});
