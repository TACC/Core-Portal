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
      key: fs.readFileSync('../server/conf/nginx/certificates/cep.dev.key'),
      cert: fs.readFileSync('../server/conf/nginx/certificates/cep.dev.crt')
    },
    open: false
  },
  module: {
    rules: [
      {
        test: /^(.)*\.module\.(css|sass|scss)$/i,
        use: [
          {
            loader: 'style-loader'
          },
          {
            loader: 'css-loader',
            options: {
              sourceMap: true,
              modules: {
                localIdentName: '[name]__[local]--[hash:base64:10]'
              }
            }
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true
            }
          }
        ]
      },
      {
        test: /^((?!\.module).)*\.(css|sass|scss)$/i,
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
      inject: false,
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
