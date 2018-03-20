const common = require('./webpack.common.js');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const merge = require('webpack-merge');

module.exports = merge(common, {
	plugins: [
		new UglifyJSPlugin()
	]
});