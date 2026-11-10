import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { startServer, stopServer, client, createPro } from "./helpers.js"

before(startServer)
after(stopServer)

test("barber saves address, amenities and chairs; profile exposes them", async () => {
  const { c, businessId } = await createPro("حلاقة رجالية")
  const r = await c("/api/me/business", { method: "PUT", body: {
    name: "Salon", category: "حلاقة رجالية", city: "مراكش", published: true,
    address: { line: "12 زنقة الورد", district: "جليز", lat: 31.63, lng: -8.01 },
    amenities: ["wifi", "ac"], extras: { chairs: 2 },
  } })
  assert.equal(r.status, 200, JSON.stringify(r.data))
  const p = await client()(`/api/businesses/${businessId}`)
  assert.equal(p.data.business.categoryKey, "barber")
  assert.equal(p.data.business.address.district, "جليز")
  assert.deepEqual(p.data.business.amenities, ["wifi", "ac"])
  assert.equal(p.data.business.extras.chairs, 2)
  assert.equal(p.data.business.todayStatus.openNow, true)
  assert.equal(p.data.business.live.state, "unknown")
  assert.equal(p.data.business.currentAudience, null)
})

test("saving the base profile keeps extras; wrong extras are rejected", async () => {
  const { c, businessId } = await createPro("حلاقة رجالية")
  await c("/api/me/business", { method: "PUT", body: { name: "Sa", category: "حلاقة رجالية", city: "مراكش", published: true, extras: { chairs: 3 }, amenities: ["kids"] } })
  await c("/api/me/business", { method: "PUT", body: { name: "S2", category: "حلاقة رجالية", city: "مراكش", published: true } })
  const p = await client()(`/api/businesses/${businessId}`)
  assert.equal(p.data.business.extras.chairs, 3)
  assert.deepEqual(p.data.business.amenities, ["kids"])
  const bad = await c("/api/me/business", { method: "PUT", body: { name: "Sa", category: "حلاقة رجالية", city: "مراكش", published: true, amenities: ["towels"] } })
  assert.equal(bad.status, 400)
  const bad2 = await c("/api/me/business", { method: "PUT", body: { name: "Sa", category: "حلاقة رجالية", city: "مراكش", published: true, extras: { bringList: [] } } })
  assert.equal(bad2.status, 400)
})

test("changing category resets extras and drops foreign amenities", async () => {
  const { c, businessId } = await createPro("حلاقة رجالية")
  await c("/api/me/business", { method: "PUT", body: { name: "Sa", category: "حلاقة رجالية", city: "مراكش", published: true, extras: { chairs: 4 }, amenities: ["wifi", "kids"] } })
  await c("/api/me/business", { method: "PUT", body: { name: "Sa", category: "الحمام والسبا", city: "مراكش", published: true } })
  const p = await client()(`/api/businesses/${businessId}`)
  assert.deepEqual(p.data.business.extras, { genderSchedule: [], ritualSteps: [], bringList: [] })
  assert.deepEqual(p.data.business.amenities, ["kids"])
})

test("live status: pro sets it, public sees it, other categories refuse", async () => {
  const { c, businessId } = await createPro("حلاقة رجالية")
  const r = await c("/api/me/live", { method: "PATCH", body: { state: "free" } })
  assert.equal(r.status, 200)
  assert.equal(r.data.live.state, "free")
  const p = await client()(`/api/businesses/${businessId}`)
  assert.equal(p.data.business.live.state, "free")
  assert.equal((await c("/api/me/live", { method: "PATCH", body: { state: "crowded" } })).status, 400)
  const nails = await createPro("الأظافر")
  assert.equal((await nails.c("/api/me/live", { method: "PATCH", body: { state: "free" } })).status, 400)
  assert.equal((await client()("/api/me/live", { method: "PATCH", body: { state: "free" } })).status, 401)
})

test("search availableNow keeps only free barbers / quiet hammams", async () => {
  const a = await createPro("حلاقة رجالية", { city: "فاس" })
  await a.c("/api/me/live", { method: "PATCH", body: { state: "free" } })
  const b = await createPro("حلاقة رجالية", { city: "فاس" })
  await b.c("/api/me/live", { method: "PATCH", body: { state: "closed" } })
  const all = await client()(`/api/search?city=${encodeURIComponent("فاس")}`)
  assert.equal(all.data.results.length, 2)
  const now = await client()(`/api/search?city=${encodeURIComponent("فاس")}&availableNow=1`)
  assert.deepEqual(now.data.results.map((x) => x.id), [a.businessId])
  assert.equal(now.data.results[0].live.state, "free")
})

test("hammam schedule must stay inside opening hours", async () => {
  const { c } = await createPro("الحمام والسبا", { hours: [{ weekday: 1, start: "08:00", end: "20:00" }] })
  const base = { name: "Ha", category: "الحمام والسبا", city: "مراكش", published: true }
  const out = await c("/api/me/business", { method: "PUT", body: { ...base, extras: { genderSchedule: [{ weekday: 1, start: "07:00", end: "12:00", audience: "women" }] } } })
  assert.equal(out.data.error, "schedule_outside_hours")
  const ok = await c("/api/me/business", { method: "PUT", body: { ...base, extras: { genderSchedule: [{ weekday: 1, start: "08:00", end: "12:00", audience: "women" }] } } })
  assert.equal(ok.status, 200)
  const shrink = await c("/api/me/hours", { method: "PUT", body: { hours: [{ weekday: 1, start: "10:00", end: "20:00" }] } })
  assert.equal(shrink.data.error, "schedule_outside_hours")
})

test("deleting a service removes it from the ritual", async () => {
  const { c, businessId, services } = await createPro("الحمام والسبا", { services: [{ name: "كيس", price: 50, durationMinutes: 30 }, { name: "غاسول", price: 40, durationMinutes: 20 }] })
  await c("/api/me/business", { method: "PUT", body: { name: "Ha", category: "الحمام والسبا", city: "مراكش", published: true, extras: { ritualSteps: services.map((s) => s.id) } } })
  await c(`/api/me/services/${services[0].id}`, { method: "DELETE" })
  const p = await client()(`/api/businesses/${businessId}`)
  assert.deepEqual(p.data.business.extras.ritualSteps, [services[1].id])
})
