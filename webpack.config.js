const path = require('path');
const webpack = require('webpack');
const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const env = {};
const vars = fs.readFileSync('./.env').toString().split('\n');
for (const envVar of vars) {
    let val = envVar.replace(/^[^=]*=/g, '');
    if (val.indexOf('base64:') === 0) {
        val = Buffer.from(val.replace(/base64:/, ''), 'base64').toString();
    }
    env[envVar.replace(/=.*$/g, '')] = val;
}

module.exports = (webpackEnv) => {
    webpackEnv = webpackEnv || {};

    return {
        mode: webpackEnv.NODE_ENV === 'development' ? 'development' : 'production',
        entry: {
            background: './src/background/index.ts',
            app: './src/index.tsx', // Main entry for the React app
        },
        output: {
            filename: '[name].js',
            path: path.resolve(__dirname, 'build'),
            clean: true,
        },
        plugins: [
            new webpack.EnvironmentPlugin(env),
            new CopyWebpackPlugin({
                patterns: [
                    {
                        from: 'node_modules/webextension-polyfill/dist/browser-polyfill.js',
                    },
                    {
                        from: 'src/_locales',
                        to: '_locales',
                    },
                    {
                        from: 'public',
                        to: '', // Copy public assets to the build folder
                        globOptions: {
                            ignore: ['**/index.html'], // Avoid copying index.html
                        },
                    },
                ],
            }),
            new HtmlWebpackPlugin({
                template: './public/index.html',
                chunks: ['app'],
                inject: 'body',
            }),
        ],
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    exclude: /node_modules/,
                    use: 'ts-loader',
                },
                {
                    test: /\.(js|jsx)$/,
                    exclude: /node_modules/,
                    use: 'babel-loader',
                },
                {
                    test: /\.css$/,
                    use: ['style-loader', 'css-loader'],
                },
                {
                    test: /\.s[ac]ss$/,
                    use: ['style-loader', 'css-loader', 'sass-loader'],
                },
                {
                    test: /\.(png|jpe?g|gif|svg)$/,
                    type: 'asset/resource',
                    generator: {
                        filename: 'static/media/[name].[hash:8][ext]',
                    },
                },
            ],
        },
        resolve: {
            extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
        },
        devtool: webpackEnv.NODE_ENV === 'development' ? 'source-map' : undefined,
        devServer: {
            historyApiFallback: true,
            open: true,
            hot: true,
            port: 3000,
        },
        target: 'web',
    };
};
