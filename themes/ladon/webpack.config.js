const { merge } = require("webpack-merge");
const singleSpaDefaults = require("webpack-config-single-spa");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = (webpackConfigEnv, argv) => {
	const defaultConfig = singleSpaDefaults({
		orgName: "mind",
		projectName: "mf-ladon-styles",
		webpackConfigEnv,
		argv,
	});

	return merge(defaultConfig, {
		devServer: {
			https: true,
		},
		module: {
			rules: [
				{
					test: /\.(sc|c)ss$/i,
					exclude: /node_modules/,
					use: ["style-loader", "css-loader", "postcss-loader", "sass-loader"],
				},
				{
					test: /\.(woff|woff2|eot|ttf)$/i,
					type: "asset/resource",
					generator: {
						filename: "assets/fonts/[name][ext]",
					},
				},
				{
					test: /\.(png)$/i,
					exclude: /node_modules/,
					type: "asset/resource",
					generator: {
						filename: "assets/png/[name][ext]",
					},
				},
				{
					test: /\.(svg)$/i,
					exclude: /node_modules/,
					type: "asset/resource",
					generator: {
						filename: "assets/svg/[name][ext]",
					},
				},
			],
		},
	});
};
