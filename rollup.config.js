const path = require('path')
const alias = require('@rollup/plugin-alias')
const babelPlugin = require('@rollup/plugin-babel')
const resolve = require('@rollup/plugin-node-resolve')
const replace = require('@rollup/plugin-replace')
const typescript = require('@rollup/plugin-typescript')
const { default: esbuild } = require('rollup-plugin-esbuild')

const extensions = ['.js', '.ts', '.tsx']
const { root } = path.parse(process.cwd())
const entries = [
  { find: /.*\/vanilla\/shallow\.ts$/, replacement: 'zustand/vanilla/shallow' },
  { find: /.*\/react\/shallow\.ts$/, replacement: 'zustand/react/shallow' },
  { find: /.*\/vanilla\.ts$/, replacement: 'zustand/vanilla' },
  { find: /.*\/react\.ts$/, replacement: 'zustand/react' },
]

function external(id) {
  return !id.startsWith('.') && !id.startsWith(root)
}

function getBabelOptions(targets) {
  return {
    babelrc: false,
    ignore: ['./node_modules'],
    presets: [['@babel/preset-env', { loose: true, modules: false, targets }]],
    plugins: [
      ['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }],
      ['@babel/plugin-transform-typescript', { isTSX: true }],
    ],
    extensions,
    comments: false,
    babelHelpers: 'bundled',
  }
}

function getEsbuild(target, env = 'development') {
  return esbuild({
    minify: env === 'production',
    target,
    tsconfig: path.resolve('./tsconfig.json'),
  })
}

function createDeclarationConfig(input, output) {
  return {
    input,
    output: {
      dir: output,
    },
    external,
    plugins: [
      typescript({
        declaration: true,
        emitDeclarationOnly: true,
        outDir: output,
      }),
    ],
  }
}

function createESMConfig(input, output) {
  return {
    input,
    output: { file: output, format: 'esm' },
    external,
    plugins: [
      alias({ entries: entries.filter((e) => !e.find.test(input)) }),
      resolve({ extensions }),
      replace({
        ...(output.endsWith('.js')
          ? {
              'import.meta.env?.MODE': 'process.env.NODE_ENV',
            }
          : {
              'import.meta.env?.MODE':
                '(import.meta.env ? import.meta.env.MODE : undefined)',
            }),
        // a workaround for #829
        'use-sync-external-store/shim/with-selector':
          'use-sync-external-store/shim/with-selector.js',
        delimiters: ['\\b', '\\b(?!(\\.|/))'],
        preventAssignment: true,
      }),
      getEsbuild('node12'),
    ],
  }
}

function createCommonJSConfig(input, output) {
  return {
    input,
    output: {
      file: `${output}.js`,
      format: 'cjs',
      esModule: false,
    },
    external,
    plugins: [
      alias({ entries: entries.filter((e) => !e.find.test(input)) }),
      resolve({ extensions }),
      replace({
        'import.meta.env?.MODE': 'process.env.NODE_ENV',
        delimiters: ['\\b', '\\b(?!(\\.|/))'],
        preventAssignment: true,
      }),
      babelPlugin(getBabelOptions({ ie: 11 })),
    ],
  }
}

module.exports = function (args) {
  let c = Object.keys(args).find((key) => key.startsWith('config-'))
  if (c) {
    c = c.slice('config-'.length).replace(/_/g, '/')
  } else {
    c = 'index'
  }
  return [
    ...(c === 'index' ? [createDeclarationConfig(`src/${c}.ts`, 'dist')] : []),
    createCommonJSConfig(`src/${c}.ts`, `dist/${c}`),
    createESMConfig(`src/${c}.ts`, `dist/esm/${c}.mjs`), // just for testing sed -e flag
  ]
}

module.exports.entries = []
