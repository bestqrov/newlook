import crypto from "node:crypto"
import { Router } from "express"
import { z } from "zod"
import { Business, QueueEntry } from "../models.js"
import { HttpError, ah, badRequest, businessIsActive, conflict, normalizePhone, notFound, parse, requireId, withLock } from "../lib/common.js"
import { requireAuth } from "../lib/auth.js"
import { limiter } from "../lib/limits.js"
import { categoryByValue } from "../catalog/categories.js"
import { avgDurations, expireQueue, positionOf } from "../lib/queue.js"
import { estimateWait } from "../lib/schedule.js"
import { presentMany } from "../lib/present.js"

const QUEUE_MAX = 30
const hash = (t) => crypto.createHash("sha256").update(t).digest("hex")
const sameHash = (a, b) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))

async function waitFor(b, position) {
  const avg = (await avgDurations([b._id])).get(String(b._id)) ?? 30
  return estimateWait(position - 1, b.extras?.chairs ?? 1, avg)
}

async function entryByToken(id, token) {
  const e = await QueueEntry.findById(requireId(id)).select("+tokenHash")
  if (!e || !sameHash(e.tokenHash, hash(String(token ?? "")))) throw notFound()
  return e
}

// ─── Clients (no account) ───────────────────────────────────────────
export const publicQueue = Router()

publicQueue.post("/businesses/:id/queue", limiter(60 * 60_000, 6), ah(async (req, res) => {
  const id = requireId(req.params.id)
  const body = parse(z.object({
    name: z.string().trim().min(2).max(80), phone: z.string().max(30),
    website: z.string().max(0).optional(), // honeypot
  }), req.body)
  const phone = normalizePhone(body.phone)
  if (!phone) throw badRequest("invalid_phone")
  const b = await Business.findOne({ _id: id, published: true }).lean()
  if (!b || !(await businessIsActive(b._id))) throw notFound()
  if (!categoryByValue(b.category).features.includes("walkin_queue")) throw badRequest("feature_unavailable")

  await expireQueue({ phone })
  if (await QueueEntry.exists({ phone, status: "waiting" })) throw new HttpError(429, "already_in_queue")

  const { entry, token } = await withLock(`queue:${b._id}`, async () => {
    const [p] = await presentMany([b])
    if (p.live?.state === "closed") throw conflict("closed_now")
    if ((await QueueEntry.countDocuments({ businessId: b._id, status: "waiting" })) >= QUEUE_MAX) throw conflict("queue_full")
    const t = crypto.randomBytes(24).toString("base64url")
    return { entry: await QueueEntry.create({ businessId: b._id, name: body.name, phone, tokenHash: hash(t) }), token: t }
  })
  const position = await positionOf(entry)
  res.status(201).json({ id: String(entry._id), token, position, estimatedWaitMinutes: await waitFor(b, position) })
}))

publicQueue.get("/queue/:id", ah(async (req, res) => {
  const { token } = parse(z.object({ token: z.string().min(10).max(100) }), req.query)
  const e = await entryByToken(req.params.id, token)
  await expireQueue({ _id: e._id })
  const fresh = await QueueEntry.findById(e._id).lean()
  const b = await Business.findById(fresh.businessId).lean()
  const position = fresh.status === "waiting" ? await positionOf(fresh) : null
  res.json({
    status: fresh.status, position,
    estimatedWaitMinutes: position ? await waitFor(b, position) : null,
    businessName: b?.name ?? "",
  })
}))

publicQueue.post("/queue/:id/cancel", ah(async (req, res) => {
  const { token } = parse(z.object({ token: z.string().min(10).max(100) }), req.body)
  const e = await entryByToken(req.params.id, token)
  await QueueEntry.updateOne({ _id: e._id, status: "waiting" }, { $set: { status: "cancelled" } })
  res.json({ ok: true })
}))

// ─── Barber (owner) ─────────────────────────────────────────────────
export const proQueue = Router()
proQueue.use(requireAuth)

async function ownBusiness(req) {
  const b = await Business.findOne({ userId: req.user._id })
  if (!b) throw notFound("no_business")
  return b
}

proQueue.get("/", ah(async (req, res) => {
  const b = await ownBusiness(req)
  await expireQueue({ businessId: b._id })
  const list = await QueueEntry.find({ businessId: b._id, status: "waiting" }).sort({ createdAt: 1 }).lean()
  res.json({ entries: list.map((e) => ({ id: String(e._id), name: e.name, phone: e.phone, createdAt: e.createdAt })) })
}))

proQueue.post("/clear", ah(async (req, res) => {
  const b = await ownBusiness(req)
  await QueueEntry.updateMany({ businessId: b._id, status: "waiting" }, { $set: { status: "cancelled" } })
  res.json({ ok: true })
}))

for (const [action, status] of [["serve", "served"], ["no-show", "no_show"]]) {
  proQueue.post(`/:id/${action}`, ah(async (req, res) => {
    const b = await ownBusiness(req)
    const e = await QueueEntry.findOneAndUpdate(
      { _id: requireId(req.params.id), businessId: b._id, status: "waiting" },
      { $set: { status, calledAt: new Date() } },
      { new: true },
    )
    if (!e) throw notFound()
    // Serving clients proves the shop is open: keep the live status fresh.
    const state = b.live?.state && b.live.state !== "closed" ? b.live.state : "free"
    await Business.updateOne({ _id: b._id }, { $set: { "live.state": state, "live.updatedAt": new Date() } })
    res.json({ ok: true })
  }))
}
