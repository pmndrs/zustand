const { addWebpackPlugin, override } = require('customize-cra')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin

module.exports = override(
  process.env.BUNDLE_ANALYZE === 'true' ? addWebpackPlugin(new BundleAnalyzerPlugin()) : undefined
)
