const path = require('path')
const alias = require('@rollup/plugin-alias')
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

function getEsbuild() {
  return esbuild({
    target: 'es2018',
    supported: { 'import-meta': true },
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
      getEsbuild(),
    ],
  }
}

function createCommonJSConfig(input, output) {
  return {
    input,
    output: { file: output, format: 'cjs' },
    external,
    plugins: [
      alias({ entries: entries.filter((e) => !e.find.test(input)) }),
      resolve({ extensions }),
      replace({
        'import.meta.env?.MODE': 'process.env.NODE_ENV',
        delimiters: ['\\b', '\\b(?!(\\.|/))'],
        preventAssignment: true,
      }),
      getEsbuild(),
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
    createCommonJSConfig(`src/${c}.ts`, `dist/${c}.js`),
    createESMConfig(`src/${c}.ts`, `dist/esm/${c}.mjs`),
  ]
}

module.exports.entries = []
