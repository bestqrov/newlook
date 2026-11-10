import { QueueEntry, Service } from "../models.js"

export const QUEUE_MAX_AGE_MS = 4 * 3600_000

/** Marks waiting entries older than 4 h as no_show (lazy cleanup, no cron). */
export async function expireQueue(filter = {}, now = new Date()) {
  await QueueEntry.updateMany(
    { ...filter, status: "waiting", createdAt: { $lt: new Date(now.getTime() - QUEUE_MAX_AGE_MS) } },
    { $set: { status: "no_show" } },
  )
}

/** Map businessId → number of people waiting. */
export async function waitingCounts(ids, now = new Date()) {
  if (!ids.length) return new Map()
  await expireQueue({ businessId: { $in: ids } }, now)
  const rows = await QueueEntry.aggregate([
    { $match: { businessId: { $in: ids }, status: "waiting" } },
    { $group: { _id: "$businessId", n: { $sum: 1 } } },
  ])
  return new Map(rows.map((r) => [String(r._id), r.n]))
}

/** Map businessId → average service duration in minutes. */
export async function avgDurations(ids) {
  if (!ids.length) return new Map()
  const rows = await Service.aggregate([
    { $match: { businessId: { $in: ids } } },
    { $group: { _id: "$businessId", avg: { $avg: "$durationMinutes" } } },
  ])
  return new Map(rows.map((r) => [String(r._id), Math.round(r.avg)]))
}

/** 1-based position of a waiting entry in its business queue. */
export async function positionOf(entry) {
  return (await QueueEntry.countDocuments({ businessId: entry.businessId, status: "waiting", createdAt: { $lt: entry.createdAt } })) + 1
}
