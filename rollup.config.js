import path from 'path'
import babel from 'rollup-plugin-babel'
import resolve from 'rollup-plugin-node-resolve'
import { sizeSnapshot } from 'rollup-plugin-size-snapshot'
import typescript from 'rollup-plugin-typescript2'

const getBabelRc = require('./.babelrc.js')
const root = process.platform === 'win32' ? path.resolve('/') : '/'
const external = id => !id.startsWith('.') && !id.startsWith(root)
const extensions = ['.js', '.ts', '.tsx']
const getBabelOptions = targets => ({
  babelrc: false,
  extensions,
  ...getBabelRc({ env: v => v === 'production' }, targets),
})

function createConfig(entry, out) {
  return [
    {
      input: entry,
      output: { file: `dist/${out}.js`, format: 'esm' },
      external,
      plugins: [
        typescript(),
        babel(getBabelOptions('last 2 chrome versions')),
        sizeSnapshot(),
        resolve({ extensions }),
      ],
    },
    {
      input: entry,
      output: { file: `dist/${out}.cjs.js`, format: 'cjs', exports: 'named' },
      external,
      plugins: [
        typescript(),
        babel(getBabelOptions()),
        sizeSnapshot(),
        resolve({ extensions }),
      ],
    },
  ]
}

export default [...createConfig('src/index.ts', 'index')]
