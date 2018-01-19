// webpack plugins
const CommonsChunkPlugin = require('webpack/lib/optimize/CommonsChunkPlugin');
const webpack = require('webpack');
const path = require('path');
const ngAnnotatePlugin = require('ng-annotate-webpack-plugin');
const LiveReloadPlugin = require('webpack-livereload-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');

module.exports = {
  devtool: 'eval-source-map',
  entry: './portal/static/portal/scripts/index.js',
  output: {
    publicPath: '/static/build/',
    path: __dirname + "/portal/static/build",
    filename: "bundle.[hash].js",

  },
  resolve: {
    extensions: ['.js'],
    modules: ['node_modules']
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: {
          presets: ['es2015']
        }
      },
      {test: /\.css$/, use: 'css-loader'},
    ]
  },
  plugins: [
    new CleanWebpackPlugin(['./portal/static/build', './portal/templates/base.html'], { watch: true}),
    new ngAnnotatePlugin({add:true}),
    new LiveReloadPlugin(),
    new HtmlWebpackPlugin(
      {
       inject : false,
       template : './portal/templates/base.j2',
       filename: '../../templates/base.html'
     }
   ),
  ],

  externals: {
    jQuery: 'jQuery',
    $: 'jQuery',
    jquery: 'jQuery',
    Modernizr: 'Modernizr',
    angular: 'angular',
    d3: 'd3',
    moment: 'moment',
    _: '_',
    _: 'underscore',
    L: 'L',
    window: 'window',
  }
};
