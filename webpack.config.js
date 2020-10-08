/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path")
const webpack = require("webpack")
const { NODE_ENV, GITHUB_SHA, BASE_URL } = process.env

module.exports = {
  mode: NODE_ENV == "production" ? "production" : "development",
  entry: {
    index: [
      path.resolve(__dirname, "src/index.tsx"),
      NODE_ENV == "development" && "webpack-hot-middleware/client",
    ].filter(e => e),
  },
  output: {
    path: path.resolve(__dirname, "static"),
  },
  module: {
    rules: [
      { test: /\.tsx?$/, use: "ts-loader" },
      { test: /\.css$/, use: ["style-loader", "css-loader"] },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".jsx", ".js", ".json", ".css"],
  },
  plugins: [
    new (require("html-webpack-plugin"))({
      filename: "index.html",
      template: path.resolve(__dirname, "src/index.html"),
      base: BASE_URL || "/",
      minify: true,
    }),
    new webpack.DefinePlugin({
      "process.env": {
        GITHUB_SHA: JSON.stringify(GITHUB_SHA),
      },
    }),
    NODE_ENV == "development" && new webpack.HotModuleReplacementPlugin(),
    NODE_ENV == "development" && new webpack.NoEmitOnErrorsPlugin(),
  ].filter(e => e),
  devtool: NODE_ENV == "development" && "inline-source-map",
}
