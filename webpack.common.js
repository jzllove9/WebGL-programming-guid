const path = require("path");
const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
	entry: {
		app: "./src/PointLightCube_f.js"
	},

	plugins: [
		new CleanWebpackPlugin(['dist']),
		new HtmlWebpackPlugin({
			title: "Demo for jzl (WebGL)"
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