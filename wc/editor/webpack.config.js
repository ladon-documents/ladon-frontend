const path = require('path');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

module.exports = {
  entry: './src/monaco-editor.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'wc-ladon-editor.js',
    library: 'LadonEditorWC',
    libraryTarget: 'umd'
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.ttf$/,
        type: 'asset/resource'
      }
    ]
  },
  plugins: [
    new MonacoWebpackPlugin({
      languages: ['javascript', 'typescript', 'html', 'css', 'json', 'markdown']
    })
  ],
  resolve: {
    fallback: {
      "path": false,
      "fs": false
    }
  }
};
