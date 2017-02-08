var path = require('path');

var webpack = require('webpack');

module.exports = {
	entry: './src/index.jsx',
	output: {
		filename: 'bundle.js',
		path: path.join(__dirname, 'dist')
	},
	module: {
		rules: [
			{
				test: /(\.js$|\.jsx$)/,
				exclude: /(node_modules|dist)/,
				loader: 'babel-loader',
				query: {
					presets: ['react']
				}
			}
		]
	}
};