const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  entry: './example/index.js',
  output: {
    filename: '[name].js',
  },
  module: {
    rules: [
      {
        test: /\.js/,
        use: 'babel-loader',
      },
    ],
  },
  devServer: {},
  resolve: {
    alias: {
      teen: path.resolve(__dirname, './src/teen/index.js'),
      'teen-dom': path.resolve(__dirname, './src/teen-dom/index.js'),
    },
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, './index.html'),
    }),
  ],
}
