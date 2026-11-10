import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import mongoose from "mongoose"
import { startServer, stopServer, client, createPro } from "./helpers.js"

before(startServer)
after(stopServer)

const join = (id, name, phone, extra = {}) => client()(`/api/businesses/${id}/queue`, { body: { name, phone, ...extra } })

test("join, position, estimate, status by token, cancel", async () => {
  const { c, businessId } = await createPro("حلاقة رجالية", { services: [{ name: "قصة", price: 50, durationMinutes: 20 }] })
  await c("/api/me/live", { method: "PATCH", body: { state: "free" } })
  const a = await join(businessId, "Ali", "0611111111")
  assert.equal(a.status, 201, JSON.stringify(a.data))
  assert.equal(a.data.position, 1)
  assert.equal(a.data.estimatedWaitMinutes, 0)
  const b = await join(businessId, "Omar", "0622222222")
  assert.equal(b.data.position, 2)
  assert.equal(b.data.estimatedWaitMinutes, 20)
  const s = await client()(`/api/queue/${b.data.id}?token=${b.data.token}`)
  assert.equal(s.data.position, 2)
  assert.equal(s.data.status, "waiting")
  assert.equal((await client()(`/api/queue/${b.data.id}?token=wrongtoken123`)).status, 404)
  const p = await client()(`/api/businesses/${businessId}`)
  assert.deepEqual([p.data.business.live.state, p.data.business.live.waiting], ["busy", 2])
  await client()(`/api/queue/${a.data.id}/cancel`, { body: { token: a.data.token } })
  const s2 = await client()(`/api/queue/${b.data.id}?token=${b.data.token}`)
  assert.equal(s2.data.position, 1)
})

test("same phone cannot be in two queues; honeypot; invalid phone", async () => {
  const x = await createPro("حلاقة رجالية")
  const y = await createPro("حلاقة رجالية")
  assert.equal((await join(x.businessId, "Ali", "0633333333")).status, 201)
  const dup = await join(y.businessId, "Ali", "+212 6 33 33 33 33")
  assert.deepEqual([dup.status, dup.data.error], [429, "already_in_queue"])
  assert.equal((await join(x.businessId, "Bot", "0644444444", { website: "x" })).status, 400)
  assert.equal((await join(x.businessId, "Ali", "123")).status, 400)
})

test("closed shop refuses; non-barber refuses", async () => {
  const { c, businessId } = await createPro("حلاقة رجالية")
  await c("/api/me/live", { method: "PATCH", body: { state: "closed" } })
  const r = await join(businessId, "Ali", "0655555555")
  assert.deepEqual([r.status, r.data.error], [409, "closed_now"])
  const nails = await createPro("الأظافر")
  assert.equal((await join(nails.businessId, "Ali", "0655555556")).status, 400)
})

test("pro sees the queue, serves, marks no-show, clears", async () => {
  const { c, businessId } = await createPro("حلاقة رجالية")
  const a = await join(businessId, "Ali", "0666666661")
  const b = await join(businessId, "Omar", "0666666662")
  await join(businessId, "Sami", "0666666663")
  const list = await c("/api/me/queue")
  assert.deepEqual(list.data.entries.map((e) => e.name), ["Ali", "Omar", "Sami"])
  assert.equal((await c(`/api/me/queue/${a.data.id}/serve`, { method: "POST" })).status, 200)
  assert.equal((await c(`/api/me/queue/${b.data.id}/no-show`, { method: "POST" })).status, 200)
  assert.equal((await client()(`/api/queue/${a.data.id}?token=${a.data.token}`)).data.status, "served")
  assert.equal((await c("/api/me/queue")).data.entries.length, 1)
  await c("/api/me/queue/clear", { method: "POST" })
  assert.equal((await c("/api/me/queue")).data.entries.length, 0)
  const other = await createPro("حلاقة رجالية")
  assert.equal((await other.c(`/api/me/queue/${a.data.id}/serve`, { method: "POST" })).status, 404)
})

test("entries older than 4 hours expire as no_show", async () => {
  const { businessId } = await createPro("حلاقة رجالية")
  const a = await join(businessId, "Old", "0677777777")
  await mongoose.connection.db.collection("queueentries").updateOne(
    { _id: new mongoose.Types.ObjectId(a.data.id) },
    { $set: { createdAt: new Date(Date.now() - 5 * 3600_000) } },
  )
  const s = await client()(`/api/queue/${a.data.id}?token=${a.data.token}`)
  assert.equal(s.data.status, "no_show")
  assert.equal((await join(businessId, "Old", "0677777777")).status, 201)
})
