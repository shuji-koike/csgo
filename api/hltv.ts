import express from "express"
import { unionBy } from "lodash"
import osmosis from "osmosis"

export const router = express.Router()

router.use("/www.hltv.org/results", async (req, res) => {
  let data: { text: string; href: string }[] = []
  const url = "https:/" + req.originalUrl
  osmosis
    .get(url)
    .find("a")
    .set("text")
    .set({ href: "@href" })
    .data(e => data.push(e))
    .done(() => {
      data = data
        .map(a => ({
          ...a,
          text: a.text.split("\n").join("").replace(/\s+/g, " "),
          href: new URL(a.href, url).href,
        }))
        .filter(({ href }) => /www\.hltv\.org\/matches\/[0-9]+\//.test(href))
      res.send(unionBy(data, "href"))
    })
})
router.use("/www.hltv.org/matches/:id/:title", async (req, res) => {
  const data = {}
  const url = "https:/" + req.originalUrl
  osmosis
    .get(url)
    .set({ href: "div.streams a@href" })
    .data(a => {
      a.href && console.info(new URL(a.href, url).href)
    })
    .done(() => res.send(data))
})
