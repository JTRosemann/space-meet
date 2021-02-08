const path = require('path');

module.exports = {
  entry: './build-babel/client/src/client.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
    devtool: "source-map",
    node: {
	fs: "empty",
	child_process: "empty"
    }
};
