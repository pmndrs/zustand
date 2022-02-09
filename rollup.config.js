import path from 'path'
import babelPlugin from '@rollup/plugin-babel'
import resolve from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import typescript from '@rollup/plugin-typescript'
import esbuild from 'rollup-plugin-esbuild'
import { terser } from 'rollup-plugin-terser'
const createBabelConfig = require('./babel.config')

const extensions = ['.js', '.ts', '.tsx']
const { root } = path.parse(process.cwd())

function external(id) {
  return !id.startsWith('.') && !id.startsWith(root)
}

function getBabelOptions(targets) {
  return {
    ...createBabelConfig({ env: (env) => env === 'build' }, targets),
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
    output: [
      { file: `${output}.js`, format: 'esm' },
      { file: `${output}.mjs`, format: 'esm' },
    ],
    external,
    plugins: [
      resolve({ extensions }),
      replace({
        __DEV__: '(import.meta.env&&import.meta.env.MODE)!=="production"',
        preventAssignment: true,
      }),
      getEsbuild('node12'),
    ],
  }
}

function createCommonJSConfig(input, output) {
  return {
    input,
    output: { file: `${output}.js`, format: 'cjs', exports: 'named' },
    external,
    plugins: [
      resolve({ extensions }),
      replace({
        __DEV__: 'process.env.NODE_ENV!=="production"',
        preventAssignment: true,
      }),
      babelPlugin(getBabelOptions({ ie: 11 })),
    ],
  }
}

function createUMDConfig(input, output, env) {
  const c = output.split('/').pop()
  return {
    input,
    output: {
      file: `${output}.${env}.js`,
      format: 'umd',
      exports: 'named',
      name:
        c === 'index'
          ? 'zustand'
          : `zustand${c.slice(0, 1).toUpperCase()}${c.slice(1)}`,
      globals: {
        react: 'React',
      },
    },
    external,
    plugins: [
      resolve({ extensions }),
      replace({
        __DEV__: env !== 'production' ? 'true' : 'false',
        preventAssignment: true,
      }),
      babelPlugin(getBabelOptions({ ie: 11 })),
      ...(env === 'production' ? [terser()] : []),
    ],
  }
}

function createSystemConfig(input, output, env) {
  return {
    input,
    output: {
      file: `${output}.${env}.js`,
      format: 'system',
      exports: 'named',
    },
    external,
    plugins: [
      resolve({ extensions }),
      replace({
        __DEV__: env !== 'production' ? 'true' : 'false',
        preventAssignment: true,
      }),
      getEsbuild('node12', env),
    ],
  }
}

export default function (args) {
  let c = Object.keys(args).find((key) => key.startsWith('config-'))
  if (c) {
    c = c.slice('config-'.length).replace(/_/g, '/')
  } else {
    c = 'index'
  }
  return [
    ...(c === 'index' ? [createDeclarationConfig(`src/${c}.ts`, 'dist')] : []),
    createCommonJSConfig(`src/${c}.ts`, `dist/${c}`),
    createESMConfig(`src/${c}.ts`, `dist/esm/${c}`),
    createUMDConfig(`src/${c}.ts`, `dist/umd/${c}`, 'development'),
    createUMDConfig(`src/${c}.ts`, `dist/umd/${c}`, 'production'),
    createSystemConfig(`src/${c}.ts`, `dist/system/${c}`, 'development'),
    createSystemConfig(`src/${c}.ts`, `dist/system/${c}`, 'production'),
  ]
}
