module.exports = (api, targets) => {
  // https://babeljs.io/docs/en/config-files#config-function-api
  const isTestEnv = api.env('test')

  return {
    babelrc: false,
    ignore: ['./node_modules'],
    presets: [
      [
        '@babel/preset-env',
        {
          loose: true,
          modules: isTestEnv ? 'commonjs' : false,
          targets: isTestEnv ? { node: 'current' } : targets,
        },
      ],
    ],
    plugins: [
      '@babel/plugin-transform-react-jsx',
      ['@babel/plugin-transform-typescript', { isTSX: true }],
    ],
  }
}
