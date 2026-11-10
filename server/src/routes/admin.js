import { Router } from "express"
import { z } from "zod"
import { Audit, Booking, Business, Offer, Payment, Plan, Portfolio, Service, Setting, Subscription, User } from "../models.js"
import {
  CATEGORIES, CITIES, ah, badRequest, conflict, extendSubscription, normalizePhone, notFound, parse, requireId, audit,
} from "../lib/common.js"
import { requireAdmin } from "../lib/auth.js"
import { PRIVATE_DIR, PUBLIC_DIR, privateFile, removeUpload } from "../lib/uploads.js"

const r = Router()
r.use(requireAdmin)

// ─── Businesses ─────────────────────────────────────────────────────
r.get("/businesses", ah(async (_req, res) => {
  const [biz, subs] = await Promise.all([
    Business.find().sort({ createdAt: -1 }).lean(),
    Subscription.find().populate("planId", "name").lean(),
  ])
  const subOf = new Map(subs.map((s) => [String(s.businessId), s]))
  res.json({
    businesses: biz.map((b) => {
      const s = subOf.get(String(b._id))
      return {
        id: String(b._id), name: b.name, category: b.category, city: b.city, phone: b.phone, bio: b.bio,
        published: b.published, createdAt: b.createdAt,
        subscription: s ? { status: s.status, expiresAt: s.expiresAt, planName: s.planId?.name ?? null } : null,
      }
    }),
  })
}))

r.get("/businesses/:id/details", ah(async (req, res) => {
  const id = requireId(req.params.id)
  const [services, works] = await Promise.all([Service.find({ businessId: id }).lean(), Portfolio.find({ businessId: id }).lean()])
  res.json({
    services: services.map((s) => ({ id: String(s._id), name: s.name, price: s.price, durationMinutes: s.durationMinutes })),
    works: works.map((w) => ({ id: String(w._id), title: w.title, imageUrl: w.imageUrl })),
  })
}))

r.patch("/businesses/:id", ah(async (req, res) => {
  const body = parse(z.object({
    name: z.string().trim().min(2).max(100), category: z.enum(CATEGORIES), city: z.enum(CITIES),
    phone: z.string().trim().max(30), bio: z.string().trim().max(1000), published: z.boolean(),
  }).partial(), req.body)
  if (body.phone) { body.phone = normalizePhone(body.phone); if (!body.phone) throw badRequest("invalid_phone") }
  const b = await Business.findByIdAndUpdate(requireId(req.params.id), { $set: body }, { new: true, runValidators: true })
  if (!b) throw notFound()
  await audit(req, "business.update", b._id, body)
  res.json({ ok: true })
}))

r.delete("/businesses/:id", ah(async (req, res) => {
  const id = requireId(req.params.id)
  const b = await Business.findByIdAndDelete(id)
  if (!b) throw notFound()
  const works = await Portfolio.find({ businessId: id }).lean()
  await Promise.all([
    Service.deleteMany({ businessId: id }), Portfolio.deleteMany({ businessId: id }),
    Booking.deleteMany({ businessId: id }), Subscription.deleteMany({ businessId: id }),
    ...works.map((w) => removeUpload(PUBLIC_DIR, w.filePath)),
  ])
  await audit(req, "business.delete", id, { name: b.name })
  res.json({ ok: true })
}))

r.post("/businesses/:id/plan", ah(async (req, res) => {
  const id = requireId(req.params.id)
  const { planId } = parse(z.object({ planId: z.string() }), req.body)
  const s = await extendSubscription(id, requireId(planId))
  await audit(req, "subscription.extend", id, { planId, expiresAt: s.expiresAt })
  res.json({ expiresAt: s.expiresAt })
}))

r.post("/businesses/:id/status", ah(async (req, res) => {
  const id = requireId(req.params.id)
  const { status } = parse(z.object({ status: z.enum(["trial", "active", "expired", "suspended"]) }), req.body)
  const b = await Business.findById(id).lean()
  if (!b) throw notFound()
  await Subscription.updateOne({ businessId: id }, { $set: { status }, $setOnInsert: { userId: b.userId, startsAt: new Date() } }, { upsert: true })
  await audit(req, "subscription.status", id, { status })
  res.json({ ok: true })
}))

r.patch("/services/:id", ah(async (req, res) => {
  const body = parse(z.object({ name: z.string().trim().min(2).max(100), price: z.number().min(0).max(100000), durationMinutes: z.number().int().min(5).max(600) }).partial(), req.body)
  const s = await Service.findByIdAndUpdate(requireId(req.params.id), { $set: body }, { new: true, runValidators: true })
  if (!s) throw notFound()
  await audit(req, "service.update", s._id, body)
  res.json({ ok: true })
}))

r.delete("/services/:id", ah(async (req, res) => {
  const s = await Service.findByIdAndDelete(requireId(req.params.id))
  if (!s) throw notFound()
  await audit(req, "service.delete", s._id, { name: s.name })
  res.json({ ok: true })
}))

r.delete("/portfolio/:id", ah(async (req, res) => {
  const w = await Portfolio.findByIdAndDelete(requireId(req.params.id))
  if (!w) throw notFound()
  await removeUpload(PUBLIC_DIR, w.filePath)
  await audit(req, "portfolio.delete", w._id, { title: w.title })
  res.json({ ok: true })
}))

// ─── Plans ──────────────────────────────────────────────────────────
const planOut = (p) => ({ id: String(p._id), code: p.code, name: p.name, months: p.months, price: p.price, active: p.active })
r.get("/plans", ah(async (_req, res) => res.json({ plans: (await Plan.find().sort({ months: 1 }).lean()).map(planOut) })))

r.post("/plans", ah(async (req, res) => {
  const p = await Plan.create({ code: `custom-${Date.now()}`, name: "Nouveau forfait", months: 1, price: 0, active: false })
  await audit(req, "plan.create", p._id)
  res.status(201).json({ plan: planOut(p) })
}))

r.patch("/plans/:id", ah(async (req, res) => {
  const body = parse(z.object({ name: z.string().trim().min(1).max(80), months: z.number().int().min(1).max(60), price: z.number().min(0).max(1_000_000), active: z.boolean() }).partial(), req.body)
  const p = await Plan.findByIdAndUpdate(requireId(req.params.id), { $set: body }, { new: true, runValidators: true })
  if (!p) throw notFound()
  await audit(req, "plan.update", p._id, body)
  res.json({ plan: planOut(p) })
}))

r.delete("/plans/:id", ah(async (req, res) => {
  const id = requireId(req.params.id)
  if (await Subscription.exists({ planId: id }) || await Payment.exists({ planId: id })) throw conflict("plan_in_use")
  const p = await Plan.findByIdAndDelete(id)
  if (!p) throw notFound()
  await audit(req, "plan.delete", id, { name: p.name })
  res.json({ ok: true })
}))

// ─── Offers ─────────────────────────────────────────────────────────
r.get("/offers", ah(async (_req, res) => {
  const list = await Offer.find().sort({ createdAt: -1 }).limit(500).lean()
  res.json({ offers: list.map((o) => ({ id: String(o._id), serviceName: o.serviceName, category: o.category, city: o.city, clientName: o.clientName, proposedPrice: o.proposedPrice, status: o.status })) })
}))

r.patch("/offers/:id", ah(async (req, res) => {
  const { status } = parse(z.object({ status: z.enum(["open", "accepted", "cancelled"]) }), req.body)
  const set = status === "open" ? { status, businessId: null, appointmentAt: null, location: null, proMessage: null } : { status }
  const o = await Offer.findByIdAndUpdate(requireId(req.params.id), { $set: set }, { new: true })
  if (!o) throw notFound()
  await audit(req, "offer.status", o._id, { status })
  res.json({ ok: true })
}))

r.delete("/offers/:id", ah(async (req, res) => {
  const o = await Offer.findByIdAndDelete(requireId(req.params.id))
  if (!o) throw notFound()
  await audit(req, "offer.delete", o._id)
  res.json({ ok: true })
}))

// ─── Payments ───────────────────────────────────────────────────────
r.get("/payments", ah(async (_req, res) => {
  const list = await Payment.find().sort({ createdAt: -1 }).limit(500).populate("businessId", "name").populate("planId", "name price").lean()
  res.json({
    payments: list.map((p) => ({
      id: String(p._id), businessName: p.businessId?.name ?? "—", planName: p.planId?.name ?? "—",
      amount: p.amount, planPrice: p.planId?.price ?? null, status: p.status, createdAt: p.createdAt,
    })),
  })
}))

r.get("/payments/:id/receipt", ah(async (req, res) => {
  const p = await Payment.findById(requireId(req.params.id)).lean()
  if (!p) throw notFound()
  res.setHeader("Content-Security-Policy", "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'")
  res.setHeader("Cache-Control", "private, no-store")
  res.sendFile(privateFile(p.receiptPath))
}))

// Atomic claim: pending → processing, so a double click cannot approve twice.
r.post("/payments/:id/approve", ah(async (req, res) => {
  const id = requireId(req.params.id)
  const p = await Payment.findOneAndUpdate({ _id: id, status: "pending" }, { $set: { status: "processing" } }, { new: true })
  if (!p) throw conflict("already_processed")
  try {
    const s = await extendSubscription(p.businessId, p.planId)
    await Payment.updateOne({ _id: id }, { $set: { status: "approved" } })
    await audit(req, "payment.approve", id, { amount: p.amount, expiresAt: s.expiresAt })
    res.json({ expiresAt: s.expiresAt })
  } catch (e) {
    await Payment.updateOne({ _id: id, status: "processing" }, { $set: { status: "pending" } })
    throw e
  }
}))

r.post("/payments/:id/reject", ah(async (req, res) => {
  const id = requireId(req.params.id)
  const p = await Payment.findOneAndUpdate({ _id: id, status: "pending" }, { $set: { status: "rejected" } })
  if (!p) throw conflict("already_processed")
  await audit(req, "payment.reject", id)
  res.json({ ok: true })
}))

// ─── Settings & audit ───────────────────────────────────────────────
r.get("/settings/bank", ah(async (_req, res) => res.json({ value: (await Setting.findOne({ key: "bank_info" }).lean())?.value ?? "" })))

r.put("/settings/bank", ah(async (req, res) => {
  const { value } = parse(z.object({ value: z.string().max(2000) }), req.body)
  await Setting.updateOne({ key: "bank_info" }, { $set: { value } }, { upsert: true })
  await audit(req, "settings.bank", "bank_info", { length: value.length })
  res.json({ ok: true })
}))

r.get("/audit", ah(async (_req, res) => {
  const list = await Audit.find().sort({ createdAt: -1 }).limit(200).populate("actorId", "email").lean()
  res.json({ entries: list.map((a) => ({ id: String(a._id), actor: a.actorId?.email ?? "—", action: a.action, target: a.target, createdAt: a.createdAt })) })
}))

r.get("/stats", ah(async (_req, res) => {
  const [users, approved] = await Promise.all([
    User.countDocuments(),
    Payment.aggregate([{ $match: { status: "approved" } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
  ])
  res.json({ users, revenue: approved[0]?.total ?? 0 })
}))

export default r
