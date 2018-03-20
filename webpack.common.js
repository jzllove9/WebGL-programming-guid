const path = require("path");
const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
	entry: {
		app: "./src/MultiPoints.js"
	},

	plugins: [
		new CleanWebpackPlugin(['dist']),
		new HtmlWebpackPlugin({
			title: "click point demo01 (WebGL)"
		})
	],

	output: {
		filename: '[name].bundle.js',
		path: path.resolve(__dirname, 'dist')
	}
};