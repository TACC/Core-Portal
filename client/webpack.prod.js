const merge = require('webpack-merge');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const HtmlWebpackChangeAssetsExtensionPlugin = require('html-webpack-change-assets-extension-plugin');
const TerserJSPlugin = require('terser-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const path = require('path');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'production',
  output: {
    path: path.resolve(__dirname, 'build'),
    publicPath: '/core/static/build/',
    filename: '[name].[hash].bundle.js',
    chunkFilename: '[name].[hash].bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.s?[ac]ss$/i,
        use: [
          {
            loader: MiniCssExtractPlugin.loader
          },
          {
            loader: 'css-loader',
            options: {
              sourceMap: true,
              modules: true
            }
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true
            }
          }
        ]
      }
    ]
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      inject: false,
      template:
        '../server/portal/apps/workbench/templates/portal/apps/workbench/index.j2',
      filename:
        '../../server/portal/apps/workbench/templates/portal/apps/workbench/index.html'
      // jsExtension: '.gz'
    }),
    new MiniCssExtractPlugin({
      filename: '[name].[hash].css',
      chunkFilename: '[id].css'
    }),
    new CompressionPlugin({
      // filename: '[path].br[query]',
      // algorithm: 'brotliCompress',
      // // test: /\.(js|css|html|svg|png|jpg)$/,
      // compressionOptions: { level: 11 },
      // threshold: 10240,
      // minRatio: 0.8
    }),
    new HtmlWebpackChangeAssetsExtensionPlugin()
  ],
  optimization: {
    minimizer: [new TerserJSPlugin({}), new OptimizeCSSAssetsPlugin({})]
  }
});
