module.exports = ({ env }, targets) => {
  const isTest = env('test')
  return {
    exclude: '**/node_modules/**',
    presets: [
      !isTest && [
        '@babel/preset-env',
        { loose: true, modules: false, targets },
      ],
    ].filter(Boolean),
    plugins: [
      '@babel/plugin-transform-react-jsx',
      ['@babel/plugin-transform-typescript', { isTSX: true }],
      isTest && '@babel/plugin-transform-modules-commonjs',
    ].filter(Boolean),
  }
}
