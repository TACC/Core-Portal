// webpack plugins
// const CommonsChunkPlugin = require('webpack/lib/optimize/CommonsChunkPlugin');
// const ngAnnotatePlugin = require('ng-annotate-webpack-plugin');
const LiveReloadPlugin = require('webpack-livereload-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const webpack = require('webpack');

// console.log(ngAnnotatePlugin)

module.exports = function(env, argv){
  var smap = false;
  env == 'prod' ? smap = false : smap='cheap-module-eval-source-map';
  return {
    devtool: smap,
    entry: './src/index.js',
    output: {
      publicPath: '/static/build/',
      path: __dirname + '/build',
      filename: "bundle.[hash].js",

    },
    module: {
      rules: [
        {
          test: /\.css$/,
          use: ExtractTextPlugin.extract({use: 'css-loader'}),
        },
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: [
            {
              loader: 'babel-loader',
              options: {
                "presets": ["es2015"],
                "plugins": ["angularjs-annotate"]
              }
            },
            {
              loader: 'eslint-loader',
              options: {
               failonError: true
             }
           }
         ]
        },
        {
          test: /\.html$/,
          exclude: /node_modules/,
          loader: 'html-loader'
        },
        {
          test: /\.(ttf|eot|svg)(\?[\s\S]+)?$/,
          loader: 'file-loader'
        }
        // {
        //   test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        //   loader: "file-loader?limit=10000&mimetype=application/font-woff"
        // },
        // {
        //   test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        //   loader: "file-loader"
        // },

      ]
    },
    plugins: [
      new CleanWebpackPlugin(['./build', '../server/portal/templates/base.html'], { watch: true}),
      // new ngAnnotatePlugin({add:true}),
      new LiveReloadPlugin(),
      new HtmlWebpackPlugin(
        {
          inject : false,
          template : '../server/portal/templates/base.j2',
          filename: '../../server/portal/templates/base.html',
        }
      ),

      
       new webpack.optimize.CommonsChunkPlugin({
         name: 'vendor',
         filename: 'vendor.[hash].js',
         //minChunks: 2,
         minChunks (module) {
           return module.context &&
                  module.context.indexOf('node_modules') >= 0;
         }
       }),

       
       new ExtractTextPlugin({
  		  filename: "[name].[hash].css",
        allChunks: true,
      }),
      new webpack.ProvidePlugin({
         jQuery: 'jquery',
         $: 'jquery',
         jquery: 'jquery'
     })
    ]
  };
};
