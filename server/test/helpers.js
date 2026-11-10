import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { MongoMemoryServer } from "mongodb-memory-server"

let mongo, httpServer, mongoose
export let BASE = ""

/** Starts an in-memory MongoDB + the API on a random port. Call once per test file (before()). */
export async function startServer() {
  mongo = await MongoMemoryServer.create({ instance: { launchTimeout: 120_000 } })
  process.env.MONGODB_URI = mongo.getUri("nltest")
  process.env.JWT_SECRET = "test_secret_test_secret_test_secret_123456"
  process.env.UPLOAD_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "nl-up-"))
  process.env.CLIENT_ORIGINS = "http://localhost:5173"
  process.env.TRIAL_DAYS = "30"
  process.env.RATE_LIMIT_OFF = "1"
  mongoose = (await import("mongoose")).default
  const { createApp } = await import("../src/app.js")
  await mongoose.connect(process.env.MONGODB_URI)
  await new Promise((resolve) => { httpServer = createApp().listen(0, "127.0.0.1", resolve) })
  BASE = `http://127.0.0.1:${httpServer.address().port}`
}

export async function stopServer() {
  await new Promise((r) => httpServer.close(r))
  await mongoose.disconnect()
  await mongo.stop()
}

/** HTTP client with its own cookie jar (one per simulated user). */
export function client() {
  const jar = {}
  return async (p, { method, body, form, headers: extra = {} } = {}) => {
    const headers = { ...extra, Cookie: Object.entries(jar).map(([k, v]) => `${k}=${v}`).join("; ") }
    let payload
    if (form) payload = form
    else if (body !== undefined) { payload = JSON.stringify(body); headers["Content-Type"] = "application/json" }
    const res = await fetch(BASE + p, { method: method ?? (payload ? "POST" : "GET"), headers, body: payload })
    for (const c of res.headers.getSetCookie?.() ?? []) {
      const [kv] = c.split(";"); const i = kv.indexOf("="); const k = kv.slice(0, i); const v = kv.slice(i + 1)
      if (!v || /Expires=Thu, 01 Jan 1970/.test(c)) delete jar[k]; else jar[k] = v
    }
    const text = await res.text()
    let data = {}; try { data = text ? JSON.parse(text) : {} } catch { data = { raw: text } }
    return { status: res.status, data, headers: res.headers }
  }
}

export const ALL_DAY = Array.from({ length: 7 }, (_, d) => ({ weekday: d, start: "00:00", end: "23:59" }))

let seq = 0
/** Registers a pro, creates a published business (trial subscription), services and hours. */
export async function createPro(category, { city = "مراكش", services = [{ name: "خدمة", price: 50, durationMinutes: 30 }], hours = ALL_DAY } = {}) {
  const c = client()
  await c("/api/auth/register", { body: { email: `pro${++seq}-${Date.now()}@t.ma`, password: "password123", name: "Pro" } })
  const b = await c("/api/me/business", { method: "PUT", body: { name: `Salon ${seq}`, category, city, published: true } })
  const created = []
  for (const s of services) created.push((await c("/api/me/services", { body: s })).data.service)
  await c("/api/me/hours", { method: "PUT", body: { hours } })
  return { c, businessId: b.data.business.id, services: created }
}

/** YYYY-MM-DD of tomorrow in Casablanca. */
export const tomorrow = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Casablanca" }).format(new Date(Date.now() + 86400000))
