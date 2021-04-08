import path from 'path'
import babel from '@rollup/plugin-babel'
import resolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import esbuild from 'rollup-plugin-esbuild'
import { sizeSnapshot } from 'rollup-plugin-size-snapshot'

const createBabelConfig = require('./babel.config')
const extensions = ['.js', '.ts', '.tsx']
const { root } = path.parse(process.cwd())

function external(id) {
  return !id.startsWith('.') && !id.startsWith(root)
}

function getEsbuild(target) {
  return esbuild({
    minify: false,
    target,
    tsconfig: path.resolve('./tsconfig.json'),
  })
}

function getBabelOptions(targets) {
  const config = createBabelConfig({ env: (env) => env === 'build' }, targets)
  if (targets.ie) {
    config.plugins = [
      ...config.plugins,
      '@babel/plugin-transform-regenerator',
      ['@babel/plugin-transform-runtime', { helpers: true, regenerator: true }],
    ]
    config.babelHelpers = 'runtime'
  }
  return {
    ...config,
    comments: false,
    extensions,
  }
}

function createDeclarationConfig(input, output) {
  return {
    input,
    output: {
      dir: output,
    },
    external,
    plugins: [typescript({ declaration: true, outDir: output })],
  }
}

function createESMConfig(input, output) {
  return {
    input,
    output: { file: output, format: 'esm' },
    external,
    plugins: [resolve({ extensions }), getEsbuild('node12'), sizeSnapshot()],
  }
}

function createCommonJSConfig(input, output) {
  return {
    input,
    output: { file: output, format: 'cjs', exports: 'named' },
    external,
    plugins: [
      resolve({ extensions }),
      babel(getBabelOptions({ ie: 11 })),
      sizeSnapshot(),
    ],
  }
}

export default function (args) {
  let c = Object.keys(args).find((key) => key.startsWith('config-'))
  if (c) {
    c = c.slice('config-'.length)
    return [
      createCommonJSConfig(`src/${c}.ts`, `dist/${c}.js`),
      createESMConfig(`src/${c}.ts`, `dist/esm/${c}.js`),
    ]
  }
  return [
    createDeclarationConfig('src/index.ts', 'dist'),
    createCommonJSConfig('src/index.ts', 'dist/index.js'),
    createESMConfig('src/index.ts', 'dist/esm/index.js'),
  ]
}
