import { DateTime } from "luxon"

export const TZ = "Africa/Casablanca"
export const LIVE_STALE_MS = 3 * 3600_000

export const toMinutes = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m }
const byStart = (a, b) => toMinutes(a.start) - toMinutes(b.start)

/** Weekday (0 = Sunday) and minutes since midnight in Casablanca. */
export function localNow(now = new Date()) {
  const dt = DateTime.fromJSDate(now, { zone: TZ })
  return { weekday: dt.weekday % 7, minutes: dt.hour * 60 + dt.minute }
}

/** The opening range containing `now`, or null. */
export function openRangeAt(hours = [], now = new Date()) {
  const { weekday, minutes } = localNow(now)
  return hours.find((h) => h.weekday === weekday && toMinutes(h.start) <= minutes && minutes < toMinutes(h.end)) ?? null
}

/** { openNow, closesAt, nextOpen: { weekday, time } | null } */
export function todayStatus(hours = [], now = new Date()) {
  const open = openRangeAt(hours, now)
  if (open) return { openNow: true, closesAt: open.end, nextOpen: null }
  const { weekday, minutes } = localNow(now)
  for (let i = 0; i < 8; i++) {
    const d = (weekday + i) % 7
    for (const h of hours.filter((x) => x.weekday === d).sort(byStart)) {
      if (i === 0 && toMinutes(h.start) <= minutes) continue
      return { openNow: false, closesAt: null, nextOpen: { weekday: d, time: h.start } }
    }
  }
  return { openNow: false, closesAt: null, nextOpen: null }
}

/** Hammam: who is admitted now. { now, until, next } or null. */
export function currentAudience(schedule = [], now = new Date()) {
  const { weekday, minutes } = localNow(now)
  const today = schedule.filter((s) => s.weekday === weekday).sort(byStart)
  const cur = today.find((s) => toMinutes(s.start) <= minutes && minutes < toMinutes(s.end))
  if (!cur) return null
  const next = today.find((s) => toMinutes(s.start) >= toMinutes(cur.end))
  return { now: cur.audience, until: cur.end, next: next?.audience ?? null }
}

/** Minutes to wait for someone with `ahead` people before them. */
export const estimateWait = (ahead, chairs, avgDuration) => (ahead <= 0 ? 0 : Math.ceil(ahead / Math.max(1, chairs)) * avgDuration)

/**
 * Status shown to clients. Never trusts a stale or out-of-hours manual value.
 * For barbers, `queueWaiting` (walk-in queue size) replaces the manual counter.
 */
export function computeLive({ categoryKey, live, hours = [], chairs = 1, avgDuration = 30, queueWaiting }, now = new Date()) {
  const updatedAt = live?.updatedAt ? new Date(live.updatedAt) : null
  const base = { updatedAt: updatedAt ? updatedAt.toISOString() : null }
  if (!openRangeAt(hours, now)) return { ...base, state: "closed", waiting: 0, estimatedWaitMinutes: null, stale: false }
  if (!updatedAt || !live?.state || now - updatedAt > LIVE_STALE_MS) return { ...base, state: "unknown", waiting: 0, estimatedWaitMinutes: null, stale: true }
  if (live.state === "closed") return { ...base, state: "closed", waiting: 0, estimatedWaitMinutes: null, stale: false }
  if (categoryKey === "barber") {
    const waiting = queueWaiting ?? live.waiting ?? 0
    const state = waiting > 0 ? "busy" : live.state
    const estimatedWaitMinutes = waiting > 0 ? estimateWait(waiting, chairs, avgDuration) : state === "busy" ? avgDuration : 0
    return { ...base, state, waiting, estimatedWaitMinutes, stale: false }
  }
  return { ...base, state: live.state, waiting: 0, estimatedWaitMinutes: null, stale: false }
}
