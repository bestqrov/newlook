import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { startServer, stopServer, client, createPro, tomorrow } from "./helpers.js"

before(startServer)
after(stopServer)

const hhmm = (iso) => new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Casablanca" }).format(new Date(iso))
const dayOfTomorrow = () => new Date(`${tomorrow()}T12:00:00Z`).getUTCDay()

test("multi-service booking uses the total duration and blocks overlaps", async () => {
  const { businessId, services } = await createPro("الحمام والسبا", {
    services: [{ name: "كيس", price: 50, durationMinutes: 30 }, { name: "غاسول", price: 40, durationMinutes: 30 }],
    hours: [{ weekday: dayOfTomorrow(), start: "10:00", end: "12:00" }],
  })
  const ids = services.map((s) => s.id).join(",")
  const slots = (await client()(`/api/businesses/${businessId}/slots?services=${ids}&day=${tomorrow()}`)).data.slots
  assert.equal(hhmm(slots.at(-1)), "11:00") // 60 min must fit before 12:00
  const r = await client()(`/api/businesses/${businessId}/bookings`, { body: { serviceIds: services.map((s) => s.id), startsAt: slots[0], name: "Sara", phone: "0611112222" } })
  assert.equal(r.status, 201, JSON.stringify(r.data))
  const after = (await client()(`/api/businesses/${businessId}/slots?services=${services[0].id}&day=${tomorrow()}`)).data.slots
  assert.ok(!after.some((s) => hhmm(s) < "11:00"))
})

test("legacy serviceId still works; foreign service is rejected", async () => {
  const a = await createPro("حلاقة رجالية", { hours: [{ weekday: dayOfTomorrow(), start: "10:00", end: "18:00" }] })
  const b = await createPro("حلاقة رجالية")
  const slots = (await client()(`/api/businesses/${a.businessId}/slots?service=${a.services[0].id}&day=${tomorrow()}`)).data.slots
  const ok = await client()(`/api/businesses/${a.businessId}/bookings`, { body: { serviceId: a.services[0].id, startsAt: slots[0], name: "Ali", phone: "0633334444" } })
  assert.equal(ok.status, 201)
  const bad = await client()(`/api/businesses/${a.businessId}/bookings`, { body: { serviceIds: [b.services[0].id], startsAt: slots[1], name: "Ali", phone: "0633335555" } })
  assert.equal(bad.status, 400)
  const list = await a.c("/api/me/bookings")
  assert.equal(list.data.bookings[0].serviceName, "خدمة")
})

test("hammam: audience required, women slots only in women time", async () => {
  const wd = dayOfTomorrow()
  const { c, businessId, services } = await createPro("الحمام والسبا", { hours: [{ weekday: wd, start: "08:00", end: "20:00" }] })
  const saved = await c("/api/me/business", { method: "PUT", body: { name: "Hammam", category: "الحمام والسبا", city: "مراكش", published: true, extras: {
    genderSchedule: [{ weekday: wd, start: "08:00", end: "12:00", audience: "women" }, { weekday: wd, start: "12:00", end: "20:00", audience: "men" }],
  } } })
  assert.equal(saved.status, 200, JSON.stringify(saved.data))
  const base = `/api/businesses/${businessId}/slots?services=${services[0].id}&day=${tomorrow()}`
  assert.equal((await client()(base)).data.error, "audience_required")
  const women = (await client()(`${base}&audience=women`)).data.slots
  assert.ok(women.length > 0)
  assert.ok(women.every((s) => hhmm(s) < "12:00"))
  const men = (await client()(`${base}&audience=men`)).data.slots
  assert.ok(men.every((s) => hhmm(s) >= "12:00"))
  const wrong = await client()(`/api/businesses/${businessId}/bookings`, { body: { serviceIds: [services[0].id], startsAt: men[0], name: "Sara", phone: "0699990000", audience: "women" } })
  assert.equal(wrong.status, 409)
  const right = await client()(`/api/businesses/${businessId}/bookings`, { body: { serviceIds: [services[0].id], startsAt: women[0], name: "Sara", phone: "0699990000", audience: "women" } })
  assert.equal(right.status, 201)
})
