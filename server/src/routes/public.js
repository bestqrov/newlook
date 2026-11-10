import { Router } from "express"
import { z } from "zod"
import { limiter } from "../lib/limits.js"
import { DateTime } from "luxon"
import { Booking, Business, Plan, Portfolio, Service, Setting } from "../models.js"
import {
  CATEGORIES, CITIES, HttpError, activeBusinessIds, ah, badRequest, businessIsActive,
  computeSlots, conflict, normalizePhone, notFound, parse, requireId, textMatches, withLock,
} from "../lib/common.js"
import { requireAuth } from "../lib/auth.js"
import { config } from "../config.js"
import { presentMany } from "../lib/present.js"

const r = Router()

/** Published businesses with a valid subscription. */
async function listActive(filter) {
  const biz = await Business.find({ published: true, ...filter }).sort({ createdAt: -1 }).limit(500).lean()
  const ok = await activeBusinessIds(biz.map((b) => b._id))
  return biz.filter((b) => ok.has(String(b._id)))
}

/** Services of a business, in the requested order. 1–6 distinct ids, all from that business. */
async function servicesOf(businessId, ids) {
  const unique = [...new Set(ids)]
  if (!unique.length || unique.length > 6 || unique.length !== ids.length) throw badRequest("invalid_input")
  const list = await Service.find({ _id: { $in: unique.map(requireId) }, businessId }).lean()
  if (list.length !== unique.length) throw badRequest("invalid_input")
  return unique.map((id) => list.find((s) => String(s._id) === id))
}
const totalMinutes = (list) => list.reduce((n, s) => n + s.durationMinutes, 0)

// GET /api/businesses?category=&city=
r.get("/businesses", ah(async (req, res) => {
  const q = parse(z.object({ category: z.enum(CATEGORIES).optional(), city: z.enum(CITIES).optional() }), req.query)
  const biz = await listActive({ ...(q.category && { category: q.category }), ...(q.city && { city: q.city }) })
  const covers = await Portfolio.aggregate([
    { $match: { businessId: { $in: biz.map((b) => b._id) }, published: true } },
    { $sort: { createdAt: -1 } },
    { $group: { _id: "$businessId", imageUrl: { $first: "$imageUrl" } } },
  ])
  const coverOf = new Map(covers.map((c) => [String(c._id), c.imageUrl]))
  const presented = await presentMany(biz)
  res.json({ businesses: presented.map((p) => ({ ...p, cover: coverOf.get(p.id) ?? null })) })
}))

// GET /api/businesses/:id
r.get("/businesses/:id", ah(async (req, res) => {
  const id = requireId(req.params.id)
  const b = await Business.findOne({ _id: id, published: true }).lean()
  if (!b || !(await businessIsActive(b._id))) throw notFound()
  const [services, works] = await Promise.all([
    Service.find({ businessId: b._id }).sort({ price: 1 }).lean(),
    Portfolio.find({ businessId: b._id, published: true }).sort({ createdAt: -1 }).lean(),
  ])
  const [presented] = await presentMany([b])
  res.json({
    business: presented,
    services: services.map((s) => ({ id: String(s._id), name: s.name, price: s.price, durationMinutes: s.durationMinutes })),
    works: works.map((w) => ({ id: String(w._id), title: w.title, caption: w.caption, imageUrl: w.imageUrl, tags: w.tags ?? [] })),
  })
}))

// GET /api/search?city=&category=&keyword=&budget=  → cheapest matching service per business, cheapest first
// city and category are optional ("" or missing = all).
r.get("/search", ah(async (req, res) => {
  const q = parse(z.object({
    city: z.enum(CITIES).optional(), category: z.enum(CATEGORIES).optional(),
    keyword: z.string().trim().max(60).optional().default(""),
    budget: z.coerce.number().positive().max(100000).optional(),
    availableNow: z.enum(["0", "1"]).optional(),
  }), req.query)
  const biz = await listActive({ ...(q.city && { city: q.city }), ...(q.category && { category: q.category }) })
  if (!biz.length) return res.json({ results: [] })
  const services = await Service.find({
    businessId: { $in: biz.map((b) => b._id) },
    ...(q.budget && { price: { $lte: q.budget } }),
  }).sort({ price: 1 }).lean()
  const presented = new Map((await presentMany(biz)).map((p) => [p.id, p]))
  const results = []
  for (const b of biz) {
    const p = presented.get(String(b._id))
    if (q.availableNow === "1" && !["free", "quiet"].includes(p.live?.state)) continue
    const best = services.find((s) => String(s.businessId) === p.id && (!q.keyword || textMatches(s.name, q.keyword)))
    if (best) results.push({ ...p, service: best.name, price: best.price })
  }
  results.sort((a, c) => a.price - c.price)
  res.json({ results })
}))

// GET /api/businesses/:id/slots?service=&day=YYYY-MM-DD
r.get("/businesses/:id/slots", ah(async (req, res) => {
  const id = requireId(req.params.id)
  const q = parse(z.object({
    service: z.string().optional(), services: z.string().max(200).optional(),
    day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    audience: z.enum(["women", "men"]).optional(),
  }), req.query)
  const ids = (q.services ?? q.service ?? "").split(",").map((s) => s.trim()).filter(Boolean)
  const b = await Business.findOne({ _id: id, published: true }).lean()
  if (!b || !(await businessIsActive(b._id))) throw notFound()
  const list = await servicesOf(b._id, ids)
  res.json({ slots: await computeSlots(b, totalMinutes(list), q.day, { audience: q.audience }) })
}))

const bookingLimiter = limiter(60 * 60_000, 6)

// POST /api/businesses/:id/bookings
r.post("/businesses/:id/bookings", bookingLimiter, ah(async (req, res) => {
  const id = requireId(req.params.id)
  const body = parse(z.object({
    serviceId: z.string().optional(), serviceIds: z.array(z.string()).max(6).optional(),
    startsAt: z.string().datetime(),
    name: z.string().trim().min(2).max(80), phone: z.string().max(30),
    audience: z.enum(["women", "men"]).optional(),
    website: z.string().max(0).optional(), // honeypot: real users never fill it
  }), req.body)
  const phone = normalizePhone(body.phone)
  if (!phone) throw badRequest("invalid_phone")

  const b = await Business.findOne({ _id: id, published: true }).lean()
  if (!b || !(await businessIsActive(b._id))) throw notFound()
  const list = await servicesOf(b._id, body.serviceIds ?? (body.serviceId ? [body.serviceId] : []))
  const duration = totalMinutes(list)

  const start = DateTime.fromISO(body.startsAt).toUTC()
  if (start.toMillis() > Date.now() + 60 * 86400_000) throw badRequest("too_far")

  const now = new Date()
  const [samePlace, overall] = await Promise.all([
    Booking.countDocuments({ clientPhone: phone, businessId: b._id, status: { $in: ["pending", "confirmed"] }, startsAt: { $gt: now } }),
    Booking.countDocuments({ clientPhone: phone, status: { $in: ["pending", "confirmed"] }, startsAt: { $gt: now } }),
  ])
  if (samePlace >= 2 || overall >= 5) throw new HttpError(429, "too_many_bookings")

  const booking = await withLock(`booking:${b._id}`, async () => {
    // Re-check availability inside the lock → no double booking.
    const day = start.setZone(config.timezone).toISODate()
    const slots = await computeSlots(b, duration, day, { audience: body.audience })
    if (!slots.includes(start.toISO())) throw conflict("slot_unavailable")
    return Booking.create({
      businessId: b._id, serviceId: list[0]._id,
      serviceName: list.map((s) => s.name).join(" + "),
      price: list.reduce((n, s) => n + s.price, 0),
      items: list.map((s) => ({ serviceId: s._id, name: s.name, price: s.price, durationMinutes: s.durationMinutes })),
      audience: body.audience,
      startsAt: start.toJSDate(), endsAt: start.plus({ minutes: duration }).toJSDate(),
      clientName: body.name, clientPhone: phone,
    })
  })
  res.status(201).json({ id: String(booking._id), status: booking.status })
}))

// GET /api/plans (active plans)
r.get("/plans", ah(async (_req, res) => {
  const plans = await Plan.find({ active: true }).sort({ months: 1 }).lean()
  res.json({ plans: plans.map((p) => ({ id: String(p._id), name: p.name, months: p.months, price: p.price })) })
}))

// GET /api/settings/bank — signed-in users only (pros need it to pay)
r.get("/settings/bank", requireAuth, ah(async (_req, res) => {
  const s = await Setting.findOne({ key: "bank_info" }).lean()
  res.json({ value: s?.value ?? "" })
}))

export default r
