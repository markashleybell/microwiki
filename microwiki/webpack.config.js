const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
    output: {
        filename: '[name].js',
        path: __dirname + '/wwwroot/js/dist',
        library: 'MicroWiki'
    },
    entry: {
        'edit': './wwwroot/js/src/edit.ts',
        'read': './wwwroot/js/src/read.ts',
        'tagmanager': './wwwroot/js/src/tagmanager.ts',
        'upload': './wwwroot/js/src/upload.ts'
    },
    devtool: 'source-map',
    plugins: [
        new CleanWebpackPlugin()
    ],
    resolve: {
        extensions: ['.ts', '.tsx', '.js']
    },
    module: {
        rules: [
            {
                test: /\.ts(x)?$/,
                loader: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    }
};
