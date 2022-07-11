const { addWebpackPlugin, addWebpackAlias, override } = require('customize-cra')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
const path = require('path')

module.exports = override(
  addWebpackAlias({
    three$: path.resolve('./src/utils/three.js'),
    '../../../build/three.module.js': path.resolve('./src/utils/three.js'),
  }),
  //addWebpackPlugin(new BundleAnalyzerPlugin())
)
