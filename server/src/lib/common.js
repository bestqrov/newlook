import { DateTime } from "luxon"
import { config } from "../config.js"
import { Audit, Business, Booking, Lock, Plan, Subscription, isObjectId } from "../models.js"

export const CATEGORIES = ["حلاقة رجالية", "صالون نسائي", "الشعر والتصفيف", "العناية بالبشرة", "الأظافر", "الحمام والسبا", "المكياج"]
export const CITIES = ["الدار البيضاء", "الرباط", "مراكش", "طنجة", "فاس", "أكادير", "وجدة", "تطوان", "مدينة أخرى"]

// ─── Errors ─────────────────────────────────────────────────────────
export class HttpError extends Error {
  constructor(status, code, message) { super(message || code); this.status = status; this.code = code }
}
export const badRequest = (code) => new HttpError(400, code)
export const notFound = (code = "not_found") => new HttpError(404, code)
export const forbidden = (code = "forbidden") => new HttpError(403, code)
export const conflict = (code) => new HttpError(409, code)

// Wrap async route handlers so rejections reach the error middleware.
export const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

export function parse(schema, data) {
  const r = schema.safeParse(data)
  if (!r.success) throw new HttpError(400, "invalid_input", r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "))
  return r.data
}

export function requireId(v) {
  if (!isObjectId(v)) throw notFound()
  return v
}

// ─── Phones (Morocco) ───────────────────────────────────────────────
/** Returns "0XXXXXXXXX" or null. Accepts 06…, +2126…, 002126…, with spaces/dashes. */
export function normalizePhone(raw) {
  let p = String(raw || "").replace(/[^\d+]/g, "")
  p = p.replace(/^(\+|00)212/, "0")
  if (/^[5-7]\d{8}$/.test(p)) p = "0" + p
  return /^0[5-7]\d{8}$/.test(p) ? p : null
}

// ─── Subscriptions ──────────────────────────────────────────────────
export const subIsOk = (s) => !!s && ["active", "trial"].includes(s.status) && (!s.expiresAt || s.expiresAt > new Date())

/** Set of business ids (strings) whose subscription is currently valid. */
export async function activeBusinessIds(ids) {
  if (!ids.length) return new Set()
  const subs = await Subscription.find({ businessId: { $in: ids } }).lean()
  return new Set(subs.filter(subIsOk).map((s) => String(s.businessId)))
}

export async function businessIsActive(businessId) {
  const s = await Subscription.findOne({ businessId }).lean()
  return subIsOk(s)
}

/**
 * Extend (or start) a subscription with a plan. When still valid, the new
 * period is added to the current expiry, so early renewals keep their days.
 */
export async function extendSubscription(businessId, planId) {
  const [plan, biz, cur] = await Promise.all([
    Plan.findById(planId).lean(),
    Business.findById(businessId).lean(),
    Subscription.findOne({ businessId }).lean(),
  ])
  if (!plan) throw badRequest("invalid_plan")
  if (!biz) throw badRequest("invalid_business")
  const now = new Date()
  const stillValid = subIsOk(cur) && cur.expiresAt && cur.expiresAt > now
  const base = stillValid ? DateTime.fromJSDate(cur.expiresAt) : DateTime.fromJSDate(now)
  const expiresAt = base.plus({ months: plan.months }).toJSDate()
  const startsAt = stillValid && cur.status === "active" ? cur.startsAt : now
  return Subscription.findOneAndUpdate(
    { businessId },
    { $set: { userId: biz.userId, planId: plan._id, status: "active", startsAt, expiresAt } },
    { upsert: true, new: true },
  )
}

// ─── Locks (serialise bookings per business) ────────────────────────
export async function withLock(key, fn, { ttlMs = 10_000, tries = 40 } = {}) {
  for (let i = 0; i < tries; i++) {
    try {
      await Lock.create({ _id: key, expiresAt: new Date(Date.now() + ttlMs) })
      try { return await fn() } finally { await Lock.deleteOne({ _id: key }).catch(() => {}) }
    } catch (e) {
      if (e?.code !== 11000) throw e
      await Lock.deleteOne({ _id: key, expiresAt: { $lt: new Date() } }) // stale lock
      await new Promise((r) => setTimeout(r, 75))
    }
  }
  throw new HttpError(503, "busy")
}

// ─── Slots ──────────────────────────────────────────────────────────
const toMinutes = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m }
const SLOT_STEP = 15
const MIN_NOTICE_MIN = 30

/** Free start times (ISO strings) for a service on a given day (YYYY-MM-DD, Casablanca time). */
export async function computeSlots(business, service, day) {
  const dayStart = DateTime.fromISO(day, { zone: config.timezone }).startOf("day")
  if (!dayStart.isValid) throw badRequest("invalid_day")
  const weekday = dayStart.weekday % 7 // luxon: Mon=1..Sun=7 → Sun=0
  const ranges = (business.hours || []).filter((h) => h.weekday === weekday)
  if (!ranges.length) return []

  const dayEnd = dayStart.plus({ days: 1 })
  const busy = await Booking.find({
    businessId: business._id, status: { $in: ["pending", "confirmed"] },
    startsAt: { $lt: dayEnd.toJSDate() }, endsAt: { $gt: dayStart.toJSDate() },
  }).select("startsAt endsAt").lean()

  const earliest = Date.now() + MIN_NOTICE_MIN * 60_000
  const out = []
  for (const r of ranges) {
    const open = toMinutes(r.start), close = toMinutes(r.end)
    for (let m = open; m + service.durationMinutes <= close; m += SLOT_STEP) {
      const s = dayStart.plus({ minutes: m }), e = s.plus({ minutes: service.durationMinutes })
      if (s.toMillis() < earliest) continue
      const clash = busy.some((b) => b.startsAt.getTime() < e.toMillis() && b.endsAt.getTime() > s.toMillis())
      if (!clash) out.push(s.toUTC().toISO())
    }
  }
  return [...new Set(out)].sort()
}

// ─── Audit ──────────────────────────────────────────────────────────
export function audit(req, action, target = "", meta = {}) {
  return Audit.create({ actorId: req.user?._id, action, target: String(target), meta }).catch(() => {})
}
