// webpack plugins
// const CommonsChunkPlugin = require('webpack/lib/optimize/CommonsChunkPlugin');
// const ngAnnotatePlugin = require('ng-annotate-webpack-plugin');
const LiveReloadPlugin = require('webpack-livereload-plugin'),
    HtmlWebpackPlugin = require('html-webpack-plugin'),
    CleanWebpackPlugin = require('clean-webpack-plugin'),
    ExtractTextPlugin = require('extract-text-webpack-plugin'),
    webpack = require('webpack');

// console.log(ngAnnotatePlugin)

module.exports = function(env){  // ,argv  - unused.
    var smap = false;
    env == 'prod' ? smap = false : smap='cheap-module-eval-source-map';
    return {
        devtool: smap,
        entry: './src/index.js',
        output: {
            publicPath: '/static/build/',
            path: __dirname + '/build',
            filename: 'bundle.[hash].js'
        },
        module: {
            rules: [
                {
                    test: /\.(s?)css$/,
                    use: ExtractTextPlugin.extract({
                        fallback: 'style-loader',
                        use: [{
                            loader: 'css-loader',
                        },
                        {
                            loader: 'sass-loader',
                            options: {
                                sourceMap: true,
                            }
                        }]
                    }),
                },
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    use: [
                        {
                            loader: 'babel-loader',
                            options: {
                                presets: ['es2015'],
                                plugins: ['angularjs-annotate']
                            }
                        }
                    ]
                },
                {
                    test: /\.html$/,
                    exclude: /node_modules/,
                    loader: 'html-loader',
                    options: {
                        interpolate: 'require',
                    },
                },
                {
                    test: /\.(ttf|eot|svg)(\?[\s\S]+)?$/,
                    loader: 'file-loader'
                }
            ]
        },
        plugins: [
            new CleanWebpackPlugin(['./build', '../server/portal/templates/base.html'], { watch: true }),
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
                filename: '[name].[hash].css',
                allChunks: true,
            }),
            new webpack.ProvidePlugin({
                jQuery: 'jquery',
                $: 'jquery',
                jquery: 'jquery',
                tv4: 'tv4'
            })
        ]
    };
};
