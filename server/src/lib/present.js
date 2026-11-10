import { categoryByValue } from "../catalog/categories.js"
import { computeLive, currentAudience, todayStatus } from "./schedule.js"
import { avgDurations, waitingCounts } from "./queue.js"

/** Public shape of one business (no owner data). `ctx` = { avgDuration, queueWaiting }. */
export function presentOne(b, ctx, now = new Date()) {
  const cat = categoryByValue(b.category)
  const f = cat.features
  const extras = b.extras ?? {}
  const hours = b.hours ?? []
  return {
    id: String(b._id),
    name: b.name, category: b.category, city: b.city, bio: b.bio ?? "", phone: b.phone ?? "",
    categoryKey: cat.key,
    address: { line: b.address?.line ?? "", district: b.address?.district ?? "", lat: b.address?.lat ?? null, lng: b.address?.lng ?? null },
    amenities: b.amenities ?? [],
    extras,
    todayStatus: todayStatus(hours, now),
    live: f.includes("live_status") || f.includes("crowd_status")
      ? computeLive({
        categoryKey: cat.key, live: b.live, hours,
        chairs: extras.chairs ?? 1, avgDuration: ctx.avgDuration,
        queueWaiting: f.includes("walkin_queue") ? ctx.queueWaiting : undefined,
      }, now)
      : null,
    currentAudience: f.includes("gender_schedule") ? currentAudience(extras.genderSchedule ?? [], now) : null,
  }
}

/** Presents a list of lean business documents in 2 queries. */
export async function presentMany(list, now = new Date()) {
  const ids = list.map((b) => b._id)
  const [avg, waiting] = await Promise.all([avgDurations(ids), waitingCounts(ids, now)])
  return list.map((b) => presentOne(b, { avgDuration: avg.get(String(b._id)) ?? 30, queueWaiting: waiting.get(String(b._id)) ?? 0 }, now))
}
