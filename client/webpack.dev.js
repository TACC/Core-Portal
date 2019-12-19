const merge = require('webpack-merge');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin');
const webpack = require('webpack');
const fs = require('fs');
const path = require('path');
const common = require('./webpack.common.js');

module.exports = merge.smart(common, {
  mode: 'development',
  devtool: 'eval-cheap-module-source-map',
  output: {
    path: path.resolve(__dirname, 'build'),
    publicPath: 'https://cep.dev:8080/build/',
    filename: '[name].bundle.js',
    chunkFilename: '[name].bundle.js'
  },
  // serve assets via webpack-dev-server instead of Django for HMR to work
  devServer: {
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    compress: true,
    hot: true,
    host: 'cep.dev',
    https: {
      key: fs.readFileSync(
        '../server/conf/nginx/certificates/frontera.dev.key'
      ),
      cert: fs.readFileSync(
        '../server/conf/nginx/certificates/frontera.dev.crt'
      )
    },
    open: false
  },
  module: {
    rules: [
      {
        test: /\.s?[ac]ss$/i,
        use: [
          {
            loader: 'style-loader'
          },
          {
            loader: 'css-loader',
            options: {
              sourceMap: true
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
    new HtmlWebpackPlugin({
      template:
        '../server/portal/apps/workbench/templates/portal/apps/workbench/index.j2',
      filename:
        '../../server/portal/apps/workbench/templates/portal/apps/workbench/index.html',
      alwaysWriteToDisk: true
    }),
    new HtmlWebpackHarddiskPlugin(),
    new webpack.HotModuleReplacementPlugin()
  ]
});
