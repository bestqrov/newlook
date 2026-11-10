import { Router } from "express"
import { CATALOG_VERSION, publicCatalog } from "../catalog/categories.js"

const r = Router()
const body = JSON.stringify(publicCatalog())
const etag = `"catalog-${CATALOG_VERSION}"`

r.get("/catalog", (req, res) => {
  res.setHeader("ETag", etag)
  res.setHeader("Cache-Control", "public, max-age=300")
  if (req.get("if-none-match") === etag) return res.status(304).end()
  res.type("application/json").send(body)
})

export default r
