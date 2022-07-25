const { addWebpackPlugin, override, addBabelPlugin } = require('customize-cra')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin

const overrides = [
  addBabelPlugin('module:@react-three/babel'),
  process.env.BUNDLE_ANALYZE === 'true' ? addWebpackPlugin(new BundleAnalyzerPlugin()) : undefined,
]

module.exports = override(...overrides.filter((config) => config))
