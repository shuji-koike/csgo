/* eslint-disable @typescript-eslint/no-var-requires */
import child_process from "child_process"
import fs from "fs"
import path from "path"
import util from "util"
import express from "express"
import readdir from "recursive-readdir"

const exec = util.promisify(child_process.execFile)
const exists = util.promisify(fs.exists)

export const router = express.Router()

router.get("/api/files", async (req, res) => {
  res.send(
    (await readdir(process.env["APP_DEMO_DIR"]!))
      .map(e => e.replace(process.env["APP_DEMO_DIR"]!, "").slice(1))
      .filter(e => !/^[.~]/.test(e))
      .filter(e => /\.(dem|dem\.gz|rar)$/.test(e))
  )
})
router.use("/api/files", async (req, res, next) => {
  const filePath =
    process.env["APP_DEMO_DIR"] +
    path.posix.normalize(req.path.replace("/api/files/", "/"))
  if (filePath.endsWith(".json")) {
    require("connect-gzip-static")(process.env["APP_DEMO_DIR"])(req, res, next) //FIXME
  } else if (filePath.endsWith(".dem")) {
    if (await exists(filePath))
      if (!(await exists(filePath.replace(/\.dem$/, ".dem.json.gz"))))
        await exec("go", ["run", ".", filePath])
    res.redirect(req.originalUrl.replace(/\.dem$/, ".dem.json"))
  } else if (filePath.endsWith(".rar")) {
    if (typeof req.query.file == "string") {
      res.send({}) //TODO
    } else {
      const ret = await exec("unrar", ["lb", filePath])
      res.send(ret.stdout.split("\n").slice(0, -1))
    }
  } else {
    console.error(req.path, filePath)
    res.status(500).send()
  }
})
