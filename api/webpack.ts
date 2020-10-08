/* eslint-disable @typescript-eslint/no-var-requires */
import express from "express"

export const router = express.Router()

router.use((req, res, next) => {
  if (/^text\/html/.test(req.headers["accept"] || "")) req.url = "/index.html"
  next()
})
if (process.env.NODE_ENV != "production") {
  const webpack = require("webpack")
  const config = require("../webpack.config")
  const compiler = webpack(config)
  const webpackHotMiddleware = require("webpack-hot-middleware")(compiler)
  const webpackDevMiddleware = require("webpack-dev-middleware")(compiler, {
    logLevel: "warn",
    publicPath: config.output && config.output.publicPath,
  })
  router.use(webpackHotMiddleware)
  router.use(webpackDevMiddleware)
}
