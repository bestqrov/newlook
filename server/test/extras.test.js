import { test } from "node:test"
import assert from "node:assert/strict"
// lib/common.js loads config.js, which requires these variables (no DB is used here).
process.env.MONGODB_URI ??= "mongodb://127.0.0.1:1/unused"
process.env.JWT_SECRET ??= "test_secret_test_secret_test_secret_123456"
const { checkHammamExtras, parseAmenities, parseExtras, parseTags } = await import("../src/lib/extras.js")

const fails = (fn, code) => assert.throws(fn, (e) => e.code === code)

test("barber extras: chairs default and bounds", () => {
  assert.deepEqual(parseExtras("barber", {}), { chairs: 1 })
  assert.deepEqual(parseExtras("barber", { chairs: 3 }), { chairs: 3 })
  fails(() => parseExtras("barber", { chairs: 0 }), "invalid_input")
  fails(() => parseExtras("barber", { genderSchedule: [] }), "invalid_input")
})

test("other categories accept only an empty object", () => {
  assert.deepEqual(parseExtras("nails", {}), {})
  fails(() => parseExtras("nails", { chairs: 2 }), "invalid_input")
})

test("hammam extras defaults and validation", () => {
  assert.deepEqual(parseExtras("hammam", {}), { genderSchedule: [], ritualSteps: [], bringList: [] })
  fails(() => parseExtras("hammam", { genderSchedule: [{ weekday: 1, start: "08:00", end: "12:00", audience: "kids" }] }), "invalid_input")
})

test("checkHammamExtras: inside hours, no overlap, known services", () => {
  const hours = [{ weekday: 1, start: "08:00", end: "22:00" }]
  const ok = parseExtras("hammam", { genderSchedule: [{ weekday: 1, start: "08:00", end: "14:00", audience: "women" }, { weekday: 1, start: "14:00", end: "22:00", audience: "men" }], ritualSteps: ["a"] })
  checkHammamExtras(ok, { hours, serviceIds: ["a"] })
  const outside = parseExtras("hammam", { genderSchedule: [{ weekday: 1, start: "07:00", end: "12:00", audience: "women" }] })
  fails(() => checkHammamExtras(outside, { hours, serviceIds: [] }), "schedule_outside_hours")
  const overlap = parseExtras("hammam", { genderSchedule: [{ weekday: 1, start: "08:00", end: "14:00", audience: "women" }, { weekday: 1, start: "13:00", end: "16:00", audience: "men" }] })
  fails(() => checkHammamExtras(overlap, { hours, serviceIds: [] }), "invalid_input")
  const unknown = parseExtras("hammam", { ritualSteps: ["zzz"] })
  fails(() => checkHammamExtras(unknown, { hours, serviceIds: ["a"] }), "invalid_input")
})

test("amenities and tags are limited to the category list", () => {
  assert.deepEqual(parseAmenities("barber", ["wifi", "wifi", "ac"]), ["wifi", "ac"])
  fails(() => parseAmenities("barber", ["towels"]), "invalid_input")
  assert.deepEqual(parseTags("barber", "fade,beard"), ["fade", "beard"])
  assert.deepEqual(parseTags("barber", ""), [])
  fails(() => parseTags("barber", "spa"), "invalid_input")
  fails(() => parseTags("nails", "fade"), "invalid_input")
})
