const path = require("path");
const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
	entry: {
		app: "./src/shadow.js"
	},

	plugins: [
		new CleanWebpackPlugin(['dist']),
		new HtmlWebpackPlugin({
			title: "Demo for WebGL (jzl)"
		})
	],

	output: {
		filename: '[name].bundle.js',
		path: path.resolve(__dirname, 'dist')
	},

	module:{
		rules:[
			{
				test: /\.(png|svg|jpg|gif)$/,
				use:[
					'file-loader'
				]
			}
		]
	}
};