import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { startServer, stopServer, client } from "./helpers.js"

before(startServer)
after(stopServer)

const lum = (h) => {
  const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }

test("catalog lists the 7 categories plus a default", async () => {
  const r = await client()("/api/catalog")
  assert.equal(r.status, 200)
  const keys = r.data.categories.map((c) => c.key)
  assert.deepEqual(keys, ["barber", "women_salon", "hair", "skincare", "nails", "hammam", "makeup"])
  assert.equal(r.data.default.key, "default")
  const barber = r.data.categories.find((c) => c.key === "barber")
  assert.equal(barber.value, "حلاقة رجالية")
  assert.deepEqual(barber.features, ["live_status", "walkin_queue", "style_tags"])
  assert.deepEqual(barber.liveStates, ["free", "busy", "closed"])
  const hammam = r.data.categories.find((c) => c.key === "hammam")
  assert.deepEqual(hammam.features, ["crowd_status", "gender_schedule", "ritual_builder", "bring_list"])
  assert.ok(r.data.amenities.wifi.ar)
})

test("every theme colour is #RRGGBB and readable (WCAG AA)", async () => {
  const r = await client()("/api/catalog")
  for (const cat of [...r.data.categories, r.data.default]) {
    for (const mode of ["light", "dark"]) {
      const c = cat.theme.colors[mode]
      for (const v of Object.values(c)) assert.match(v, /^#[0-9A-F]{6}$/i, `${cat.key} ${mode}`)
      for (const [f, b] of [["text", "background"], ["text", "surface"], ["muted", "background"], ["onPrimary", "primary"]]) {
        assert.ok(contrast(c[f], c[b]) >= 4.5, `${cat.key} ${mode} ${f}/${b}`)
      }
    }
  }
})

test("catalog supports ETag / 304", async () => {
  const c = client()
  const r1 = await c("/api/catalog")
  const etag = r1.headers.get("etag")
  assert.ok(etag)
  assert.match(r1.headers.get("cache-control"), /max-age=300/)
  const r2 = await c("/api/catalog", { headers: { "If-None-Match": etag } })
  assert.equal(r2.status, 304)
})
