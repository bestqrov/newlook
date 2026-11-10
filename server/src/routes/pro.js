import { Router } from "express"
import { z } from "zod"
import { DateTime } from "luxon"
import rateLimit from "express-rate-limit"
import { config } from "../config.js"
import { Booking, Business, Offer, Payment, Plan, Portfolio, Service, Subscription } from "../models.js"
import {
  CATEGORIES, CITIES, HttpError, ah, badRequest, businessIsActive, conflict, normalizePhone,
  notFound, parse, requireId,
} from "../lib/common.js"
import { requireAuth } from "../lib/auth.js"
import { PRIVATE_DIR, PUBLIC_DIR, removeUpload, saveUpload, upload } from "../lib/uploads.js"

const r = Router()
r.use(requireAuth)

const uploadLimiter = rateLimit({ windowMs: 60 * 60_000, limit: 30, standardHeaders: "draft-7", legacyHeaders: false })

async function myBusiness(req, { required = true } = {}) {
  const b = await Business.findOne({ userId: req.user._id })
  if (!b && required) throw notFound("no_business")
  return b
}

const svcOut = (s) => ({ id: String(s._id), name: s.name, price: s.price, durationMinutes: s.durationMinutes })
const workOut = (w) => ({ id: String(w._id), title: w.title, caption: w.caption, imageUrl: w.imageUrl })

// ─── Business profile ───────────────────────────────────────────────
r.get("/business", ah(async (req, res) => {
  const b = await myBusiness(req, { required: false })
  if (!b) return res.json({ business: null })
  const [services, works, sub] = await Promise.all([
    Service.find({ businessId: b._id }).sort({ createdAt: -1 }).lean(),
    Portfolio.find({ businessId: b._id }).sort({ createdAt: -1 }).lean(),
    Subscription.findOne({ businessId: b._id }).populate("planId", "name").lean(),
  ])
  res.json({
    business: b.toJSON(),
    services: services.map(svcOut),
    works: works.map(workOut),
    subscription: sub && { status: sub.status, expiresAt: sub.expiresAt, planName: sub.planId?.name ?? null },
  })
}))

const bizInput = z.object({
  name: z.string().trim().min(2).max(100),
  category: z.enum(CATEGORIES),
  city: z.enum(CITIES),
  bio: z.string().trim().max(1000).default(""),
  phone: z.string().trim().max(30).default(""),
  published: z.boolean().default(false),
})

r.put("/business", ah(async (req, res) => {
  const body = parse(bizInput, req.body)
  let phone = ""
  if (body.phone) { phone = normalizePhone(body.phone); if (!phone) throw badRequest("invalid_phone") }
  const existing = await myBusiness(req, { required: false })
  const b = await Business.findOneAndUpdate(
    { userId: req.user._id },
    { $set: { ...body, phone } },
    { upsert: true, new: true, runValidators: true },
  )
  if (!existing && config.trialDays > 0) {
    await Subscription.updateOne(
      { businessId: b._id },
      { $setOnInsert: { userId: req.user._id, status: "trial", startsAt: new Date(), expiresAt: DateTime.now().plus({ days: config.trialDays }).toJSDate() } },
      { upsert: true },
    )
  }
  res.json({ business: b.toJSON() })
}))

// ─── Working hours (several ranges per day → lunch breaks) ─────────
const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)
r.put("/hours", ah(async (req, res) => {
  const { hours } = parse(z.object({
    hours: z.array(z.object({ weekday: z.number().int().min(0).max(6), start: hhmm, end: hhmm })).max(28),
  }), req.body)
  for (const h of hours) if (h.end <= h.start) throw badRequest("invalid_hours")
  for (let d = 0; d < 7; d++) {
    const day = hours.filter((h) => h.weekday === d).sort((a, c) => a.start.localeCompare(c.start))
    for (let i = 1; i < day.length; i++) if (day[i].start < day[i - 1].end) throw badRequest("overlapping_hours")
  }
  const b = await Business.findOneAndUpdate({ userId: req.user._id }, { $set: { hours } }, { new: true })
  if (!b) throw notFound("no_business")
  res.json({ hours: b.hours })
}))

// ─── Services ───────────────────────────────────────────────────────
const svcInput = z.object({
  name: z.string().trim().min(2).max(100),
  price: z.number().min(0).max(100000),
  durationMinutes: z.number().int().min(5).max(600),
})

r.post("/services", ah(async (req, res) => {
  const b = await myBusiness(req)
  if ((await Service.countDocuments({ businessId: b._id })) >= 100) throw badRequest("too_many_services")
  const s = await Service.create({ ...parse(svcInput, req.body), businessId: b._id })
  res.status(201).json({ service: svcOut(s) })
}))

r.patch("/services/:id", ah(async (req, res) => {
  const b = await myBusiness(req)
  const s = await Service.findOneAndUpdate({ _id: requireId(req.params.id), businessId: b._id }, { $set: parse(svcInput.partial(), req.body) }, { new: true, runValidators: true })
  if (!s) throw notFound()
  res.json({ service: svcOut(s) })
}))

r.delete("/services/:id", ah(async (req, res) => {
  const b = await myBusiness(req)
  const out = await Service.deleteOne({ _id: requireId(req.params.id), businessId: b._id })
  if (!out.deletedCount) throw notFound()
  res.json({ ok: true })
}))

// ─── Portfolio ──────────────────────────────────────────────────────
r.post("/portfolio", uploadLimiter, upload.single("image"), ah(async (req, res) => {
  const b = await myBusiness(req)
  const body = parse(z.object({ title: z.string().trim().min(1).max(100), caption: z.string().trim().max(300).default("") }), req.body)
  if ((await Portfolio.countDocuments({ businessId: b._id })) >= 200) throw badRequest("too_many_works")
  const rel = await saveUpload(req.file, { dir: PUBLIC_DIR, userId: req.user._id })
  const w = await Portfolio.create({ ...body, businessId: b._id, filePath: rel, imageUrl: `/uploads/${rel}` })
  res.status(201).json({ work: workOut(w) })
}))

r.delete("/portfolio/:id", ah(async (req, res) => {
  const b = await myBusiness(req)
  const w = await Portfolio.findOneAndDelete({ _id: requireId(req.params.id), businessId: b._id })
  if (!w) throw notFound()
  await removeUpload(PUBLIC_DIR, w.filePath)
  res.json({ ok: true })
}))

// ─── Bookings ───────────────────────────────────────────────────────
r.get("/bookings", ah(async (req, res) => {
  const b = await myBusiness(req)
  const since = DateTime.now().minus({ days: 30 }).toJSDate()
  const list = await Booking.find({ businessId: b._id, startsAt: { $gte: since } }).sort({ startsAt: 1 }).limit(500).lean()
  res.json({ bookings: list.map((x) => ({ id: String(x._id), serviceName: x.serviceName, price: x.price, startsAt: x.startsAt, clientName: x.clientName, clientPhone: x.clientPhone, status: x.status })) })
}))

const transitions = { pending: ["confirmed", "cancelled"], confirmed: ["done", "cancelled"], cancelled: [], done: [] }
r.patch("/bookings/:id", ah(async (req, res) => {
  const b = await myBusiness(req)
  const { status } = parse(z.object({ status: z.enum(["confirmed", "cancelled", "done"]) }), req.body)
  const allowedFrom = Object.keys(transitions).filter((k) => transitions[k].includes(status))
  const x = await Booking.findOneAndUpdate({ _id: requireId(req.params.id), businessId: b._id, status: { $in: allowedFrom } }, { $set: { status } }, { new: true })
  if (!x) throw conflict("invalid_transition")
  res.json({ status: x.status })
}))

// ─── Client offers in my city & specialty ──────────────────────────
r.get("/offers", ah(async (req, res) => {
  const b = await myBusiness(req)
  const list = await Offer.find({
    status: "open", city: b.city, category: b.category,
    $or: [{ preferredDate: null }, { preferredDate: { $gt: new Date() } }],
  }).sort({ createdAt: -1 }).limit(100).lean()
  res.json({ offers: list.map((o) => ({ id: String(o._id), serviceName: o.serviceName, proposedPrice: o.proposedPrice, preferredDate: o.preferredDate })) })
}))

// Atomic: only one pro can accept an offer.
r.post("/offers/:id/accept", ah(async (req, res) => {
  const b = await myBusiness(req)
  if (!(await businessIsActive(b._id))) throw new HttpError(402, "subscription_inactive")
  const body = parse(z.object({ appointmentAt: z.string().datetime(), message: z.string().trim().max(300).optional() }), req.body)
  const at = new Date(body.appointmentAt)
  if (at <= new Date()) throw badRequest("past_date")
  const o = await Offer.findOneAndUpdate(
    { _id: requireId(req.params.id), status: "open", businessId: null, city: b.city, category: b.category },
    { $set: { status: "accepted", businessId: b._id, appointmentAt: at, location: `${b.name}, ${b.city}`, proMessage: body.message || "مرحبا بيك! كنتسناوك فالموعد." } },
    { new: true },
  )
  if (!o) throw conflict("offer_taken")
  res.json({ ok: true })
}))

// ─── Subscription payments (bank transfer + receipt) ───────────────
r.get("/payments", ah(async (req, res) => {
  const b = await myBusiness(req)
  const list = await Payment.find({ businessId: b._id }).sort({ createdAt: -1 }).limit(50).lean()
  res.json({ payments: list.map((p) => ({ id: String(p._id), amount: p.amount, status: p.status === "processing" ? "pending" : p.status, createdAt: p.createdAt })) })
}))

r.post("/payments", uploadLimiter, upload.single("receipt"), ah(async (req, res) => {
  const b = await myBusiness(req)
  const { planId } = parse(z.object({ planId: z.string() }), req.body)
  const plan = await Plan.findOne({ _id: requireId(planId), active: true }).lean()
  if (!plan) throw badRequest("invalid_plan")
  if ((await Payment.countDocuments({ businessId: b._id, status: { $in: ["pending", "processing"] } })) >= 3) throw new HttpError(429, "too_many_pending")
  const rel = await saveUpload(req.file, { dir: PRIVATE_DIR, userId: req.user._id, allowPdf: true })
  // The amount is ALWAYS the plan price, never a value sent by the browser.
  const p = await Payment.create({ businessId: b._id, userId: req.user._id, planId: plan._id, amount: plan.price, receiptPath: rel })
  res.status(201).json({ payment: { id: String(p._id), amount: p.amount, status: p.status, createdAt: p.createdAt } })
}))

export default r
