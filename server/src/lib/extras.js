import { z } from "zod"
import { badRequest, parse } from "./common.js"
import { categoryByKey } from "../catalog/categories.js"
import { toMinutes } from "./schedule.js"

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)

export const addressSchema = z.object({
  line: z.string().trim().max(200).default(""),
  district: z.string().trim().max(80).default(""),
  lat: z.number().min(-90).max(90).nullable().optional(),
  lng: z.number().min(-180).max(180).nullable().optional(),
}).strict()

const SCHEMAS = {
  barber: z.object({ chairs: z.number().int().min(1).max(20).default(1) }).strict(),
  hammam: z.object({
    genderSchedule: z.array(z.object({
      weekday: z.number().int().min(0).max(6), start: hhmm, end: hhmm,
      audience: z.enum(["women", "men", "mixed", "private"]),
    }).strict()).max(42).default([]),
    ritualSteps: z.array(z.string().max(40)).max(12).default([]),
    bringList: z.array(z.object({
      label: z.string().trim().min(1).max(40),
      available: z.boolean().default(false),
    }).strict()).max(15).default([]),
  }).strict(),
}
const EMPTY = z.object({}).strict()

/** Validates `extras` for a category key; returns the cleaned object (defaults applied). */
export const parseExtras = (categoryKey, input) => parse(SCHEMAS[categoryKey] ?? EMPTY, input ?? {})

/** Amenity keys allowed for the category, de-duplicated. */
export function parseAmenities(categoryKey, input) {
  const allowed = categoryByKey(categoryKey).amenities
  const list = parse(z.array(z.string()).max(12), input ?? [])
  if (list.some((a) => !allowed.includes(a))) throw badRequest("invalid_input")
  return [...new Set(list)]
}

/** Style tags from a comma-separated string or an array. */
export function parseTags(categoryKey, input) {
  const list = Array.isArray(input) ? input : String(input ?? "").split(",").map((s) => s.trim()).filter(Boolean)
  const allowed = categoryByKey(categoryKey).styleTags.map((t) => t.key)
  if (list.length > 5 || list.some((t) => !allowed.includes(t))) throw badRequest("invalid_input")
  return [...new Set(list)]
}

/** Hammam rules that need the business context (hours and services). */
export function checkHammamExtras(extras, { hours, serviceIds }) {
  const sched = extras.genderSchedule
  for (const s of sched) if (toMinutes(s.end) <= toMinutes(s.start)) throw badRequest("invalid_input")
  for (let d = 0; d < 7; d++) {
    const day = sched.filter((s) => s.weekday === d).sort((a, b) => toMinutes(a.start) - toMinutes(b.start))
    for (let i = 1; i < day.length; i++) if (toMinutes(day[i].start) < toMinutes(day[i - 1].end)) throw badRequest("invalid_input")
  }
  for (const s of sched) {
    const inside = hours.some((h) => h.weekday === s.weekday && toMinutes(h.start) <= toMinutes(s.start) && toMinutes(s.end) <= toMinutes(h.end))
    if (!inside) throw badRequest("schedule_outside_hours")
  }
  const known = new Set(serviceIds.map(String))
  if (extras.ritualSteps.some((id) => !known.has(id)) || new Set(extras.ritualSteps).size !== extras.ritualSteps.length) throw badRequest("invalid_input")
}
