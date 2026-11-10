import { Router } from "express"
import { z } from "zod"
import rateLimit from "express-rate-limit"
import { Offer } from "../models.js"
import { CATEGORIES, CITIES, HttpError, ah, badRequest, conflict, parse, requireId } from "../lib/common.js"
import { requireAuth } from "../lib/auth.js"

const r = Router()
r.use(requireAuth)

const out = (o) => ({
  id: String(o._id), category: o.category, city: o.city, serviceName: o.serviceName, proposedPrice: o.proposedPrice,
  preferredDate: o.preferredDate, status: o.status, appointmentAt: o.appointmentAt, location: o.location, proMessage: o.proMessage,
})

r.get("/mine", ah(async (req, res) => {
  const list = await Offer.find({ clientId: req.user._id }).sort({ createdAt: -1 }).limit(100).lean()
  res.json({ offers: list.map(out) })
}))

const createLimiter = rateLimit({ windowMs: 60 * 60_000, limit: 10, standardHeaders: "draft-7", legacyHeaders: false })

r.post("/", createLimiter, ah(async (req, res) => {
  const body = parse(z.object({
    category: z.enum(CATEGORIES), city: z.enum(CITIES),
    serviceName: z.string().trim().min(2).max(120),
    proposedPrice: z.number().min(1).max(100000),
    preferredDate: z.string().datetime().nullable().optional(),
  }), req.body)
  const preferredDate = body.preferredDate ? new Date(body.preferredDate) : null
  if (preferredDate && preferredDate <= new Date()) throw badRequest("past_date")
  if ((await Offer.countDocuments({ clientId: req.user._id, status: "open" })) >= 5) throw new HttpError(429, "too_many_offers")
  const o = await Offer.create({ ...body, preferredDate, clientId: req.user._id, clientName: req.user.name || "" })
  res.status(201).json({ offer: out(o) })
}))

r.post("/:id/cancel", ah(async (req, res) => {
  const o = await Offer.findOneAndUpdate({ _id: requireId(req.params.id), clientId: req.user._id, status: "open" }, { $set: { status: "cancelled" } }, { new: true })
  if (!o) throw conflict("cannot_cancel")
  res.json({ offer: out(o) })
}))

export default r
