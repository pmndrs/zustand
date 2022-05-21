const { addWebpackPlugin, addWebpackAlias, override } = require('customize-cra')
const { addReactRefresh } = require('customize-cra-react-refresh')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
const path = require('path')

module.exports = {
  webpack: {
    alias: {
      three$: path.resolve('./src/utils/three.js'),
    }
  }
}
