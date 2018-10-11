// webpack plugins
// const CommonsChunkPlugin = require('webpack/lib/optimize/CommonsChunkPlugin');
// const ngAnnotatePlugin = require('ng-annotate-webpack-plugin');
const webpack = require('webpack');

// console.log(ngAnnotatePlugin)

module.exports = {
    devtool: 'inline-source-map',
    module: {
      rules: [
        {
          test: /\.css$/,
          loader: 'ignore-loader',
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
        {test: /\.js$/,
          use: {
            loader: 'istanbul-instrumenter-loader',
            options: { esModules: true }
          },
          enforce: 'pre',
          exclude: /node_modules|\.spec\.js$/,
        },
        {
          test: /\.html$/,
          exclude: /node_modules/,
          loader: 'html-loader'
        },
        {
          test: /\.(ttf|eot|svg)(\?[\s\S]+)?$/,
          loader: 'ignore-loader'
        }
      ]
    },
    plugins: [
      new webpack.ProvidePlugin({
         jQuery: 'jquery',
         $: 'jquery',
         jquery: 'jquery',
         tv4: 'tv4'
     })
    ]
};
