import { test } from "node:test"
import assert from "node:assert/strict"
import { DateTime } from "luxon"
import { computeLive, currentAudience, estimateWait, openRangeAt, todayStatus, LIVE_STALE_MS } from "../src/lib/schedule.js"

// Wednesday 2026-11-11 at the given Casablanca time (weekday 3).
const at = (hhmm) => DateTime.fromISO(`2026-11-11T${hhmm}`, { zone: "Africa/Casablanca" }).toJSDate()
const hours = [
  { weekday: 3, start: "09:00", end: "13:00" },
  { weekday: 3, start: "15:00", end: "20:00" },
  { weekday: 4, start: "10:00", end: "18:00" },
]

test("openRangeAt finds the current range", () => {
  assert.equal(openRangeAt(hours, at("10:00")).end, "13:00")
  assert.equal(openRangeAt(hours, at("14:00")), null)
  assert.equal(openRangeAt(hours, at("20:00")), null)
})

test("todayStatus: open, lunch break, after closing", () => {
  assert.deepEqual(todayStatus(hours, at("10:00")), { openNow: true, closesAt: "13:00", nextOpen: null })
  assert.deepEqual(todayStatus(hours, at("14:00")), { openNow: false, closesAt: null, nextOpen: { weekday: 3, time: "15:00" } })
  assert.deepEqual(todayStatus(hours, at("21:00")), { openNow: false, closesAt: null, nextOpen: { weekday: 4, time: "10:00" } })
  assert.deepEqual(todayStatus([], at("10:00")), { openNow: false, closesAt: null, nextOpen: null })
})

test("currentAudience", () => {
  const sched = [
    { weekday: 3, start: "08:00", end: "14:00", audience: "women" },
    { weekday: 3, start: "14:00", end: "22:00", audience: "men" },
  ]
  assert.deepEqual(currentAudience(sched, at("10:00")), { now: "women", until: "14:00", next: "men" })
  assert.deepEqual(currentAudience(sched, at("15:00")), { now: "men", until: "22:00", next: null })
  assert.equal(currentAudience(sched, at("07:00")), null)
})

test("estimateWait", () => {
  assert.equal(estimateWait(0, 2, 30), 0)
  assert.equal(estimateWait(3, 2, 30), 60)
  assert.equal(estimateWait(3, 0, 30), 90)
})

test("computeLive: closed outside hours, stale, queue overrides waiting", () => {
  const now = at("10:00")
  const fresh = new Date(now.getTime() - 10 * 60_000)
  const base = { categoryKey: "barber", hours, chairs: 1, avgDuration: 30 }
  assert.equal(computeLive({ ...base, live: { state: "free", updatedAt: fresh } }, at("14:00")).state, "closed")
  const stale = computeLive({ ...base, live: { state: "free", updatedAt: new Date(now.getTime() - LIVE_STALE_MS - 1) } }, now)
  assert.equal(stale.state, "unknown"); assert.equal(stale.stale, true)
  assert.equal(computeLive({ ...base, live: null }, now).state, "unknown")
  const busy = computeLive({ ...base, live: { state: "free", waiting: 0, updatedAt: fresh }, queueWaiting: 2 }, now)
  assert.deepEqual([busy.state, busy.waiting, busy.estimatedWaitMinutes], ["busy", 2, 60])
  const free = computeLive({ ...base, live: { state: "free", updatedAt: fresh }, queueWaiting: 0 }, now)
  assert.deepEqual([free.state, free.estimatedWaitMinutes], ["free", 0])
  assert.equal(computeLive({ ...base, live: { state: "closed", updatedAt: fresh } }, now).state, "closed")
  const hammam = computeLive({ categoryKey: "hammam", hours, live: { state: "crowded", updatedAt: fresh } }, now)
  assert.deepEqual([hammam.state, hammam.estimatedWaitMinutes], ["crowded", null])
})
