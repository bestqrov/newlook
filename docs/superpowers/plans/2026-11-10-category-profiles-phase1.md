# بروفايل خاص بكل صنف (المرحلة 1): خطة التنفيذ

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** تنفيذ وثيقة التصميم `docs/superpowers/specs/2026-11-10-category-profiles-design.md`. تشمل: كتالوج الأصناف وسماتها عبر الـ API، والحلاق (الحالة الحية والطابور والوسوم)، والحمام (أوقات الرجال والنساء، والطقس، و"شنو تجيب معاك")، والعنوان والأيقونات و"حالته اليوم" والحجز بعدة خدمات لكل الأصناف.

**Architecture:**
- **الـ API:** Express + Mongoose في `server/` هو مصدر كل شيء: الكتالوج (ملف JS ثابت)، والحسابات الزمنية (دوال نقية في `lib/schedule.js`)، و"تقديم" النشاط للعموم (`lib/present.js`).
- **الموقع:** React في `src/` يقرأ الكتالوج ويطبق السمة بمتغيرات CSS داخل `ThemeScope`. كل ميزة عنصر مستقل في `src/components/profile/`.
- **تطبيق Flutter:** يقرأ نفس الـ JSON (وثيقة في `docs/api/`).

**Tech Stack:** Node 20, Express 4, Mongoose 8, zod, luxon, `node:test` + mongodb-memory-server (اختبارات)، React 18 + Vite + Tailwind + lucide-react.

**قواعد عامة:**
- كل الأوامر تُنفذ من جذر المشروع `/Users/mac/Documents/lbienetre/nelook main` إلا إذا ذُكر غير ذلك.
- توقيت المنصة: `Africa/Casablanca`.
- أسبوع الأيام: 0 = الأحد … 6 = السبت.
- رسائل الـ commit تنتهي بالسطر: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

---

## خريطة الملفات

| الملف | المسؤولية |
| --- | --- |
| `server/src/app.js` (جديد) | بناء تطبيق Express (بدون اتصال بقاعدة البيانات ولا `listen`) |
| `server/src/index.js` (تعديل) | الاتصال بـ MongoDB، `listen`، الإيقاف |
| `server/src/lib/limits.js` (جديد) | `limiter()`: حدود الطلبات، تُعطَّل في الاختبارات |
| `server/src/catalog/categories.js` (جديد) | تعريف الأصناف والسمات والأيقونات والوسوم |
| `server/src/routes/catalog.js` (جديد) | `GET /api/catalog` |
| `server/src/lib/schedule.js` (جديد) | دوال زمنية نقية: مفتوح الآن، حالته اليوم، الجمهور الحالي، الحالة الحية، تقدير الانتظار |
| `server/src/lib/extras.js` (جديد) | التحقق من `address` و `amenities` و `extras` حسب الصنف |
| `server/src/lib/queue.js` (جديد) | تنظيف الطابور، عدد المنتظرين، متوسط مدة الخدمات |
| `server/src/lib/present.js` (جديد) | تحويل النشاط إلى الشكل العام (مع الحالة الحية وحالته اليوم) |
| `server/src/routes/queue.js` (جديد) | واجهات الطابور (للزبون وللحلاق) |
| `server/src/models.js` (تعديل) | حقول جديدة + `QueueEntry` |
| `server/src/lib/common.js` (تعديل) | `computeSlots` بمدة إجمالية و `audience` |
| `server/src/routes/public.js` (تعديل) | البروفايل، القائمة، البحث، المواعيد، الحجز بعدة خدمات |
| `server/src/routes/pro.js` (تعديل) | `extras`، `/live`، الوسوم، التحقق من جدول الحمام |
| `server/test/*.test.js` (جديد) | اختبارات `node:test` |
| `src/lib/catalog-api.ts` (جديد) | جلب الكتالوج والأنواع |
| `src/lib/business-types.ts` (جديد) | أنواع النشاط العام |
| `src/components/profile/*.tsx` (جديد) | عناصر البروفايل حسب الميزة |
| `src/components/pro/*.tsx` (جديد) | أدوات المهني: الحالة، الطابور، الإعدادات الإضافية |
| `src/pages/BusinessProfile.tsx` (تعديل) | تركيب العناصر حسب `features` |
| `src/pages/ProStudio.tsx` (تعديل) | دمج أدوات المهني والوسوم |
| `src/components/BookingWidget.tsx` (تعديل) | عدة خدمات + `audience` |
| `public/assets/themes/**` (جديد) | زخارف SVG |
| `docs/api/flutter-integration.md` (جديد) | وثيقة فريق Flutter |

---

### Task 0: بنية الاختبارات (فصل التطبيق عن التشغيل + حدود الطلبات)

**Files:**
- Create: `server/src/app.js`, `server/src/lib/limits.js`, `server/test/helpers.js`, `server/test/health.test.js`
- Modify: `server/src/index.js`, `server/src/routes/auth.js`, `server/src/routes/public.js`, `server/src/routes/pro.js`, `server/src/routes/offers.js`, `server/package.json`

- [ ] **Step 1: أضف أداة الاختبار**

```bash
cd server && npm install --save-dev mongodb-memory-server@10 --no-audit --no-fund && cd ..
```

ثم في `server/package.json` أضف السكربت وإعداد نسخة MongoDB، لأن نسخة 7+ لا تشتغل على macOS 12:

```json
  "scripts": {
    "start": "node src/index.js",
    "dev": "node --watch src/index.js",
    "test": "node --test --test-concurrency=1 test/",
    "create-admin": "node scripts/create-admin.js",
    "seed-plans": "node scripts/seed-plans.js",
    "import-legacy": "node scripts/import-legacy.js"
  },
  "config": { "mongodbMemoryServer": { "version": "6.0.14" } },
```

- [ ] **Step 2: أنشئ `server/src/lib/limits.js`**

```js
import rateLimit from "express-rate-limit"

/** Rate limiter shared by all routes. Disabled when RATE_LIMIT_OFF=1 (tests only). */
export const limiter = (windowMs, limit) => rateLimit({
  windowMs, limit, standardHeaders: "draft-7", legacyHeaders: false,
  skip: () => process.env.RATE_LIMIT_OFF === "1",
})
```

- [ ] **Step 3: استعمل `limiter` في كل الملفات**

**في `server/src/routes/auth.js`:**
- احذف `import rateLimit from "express-rate-limit"` وأضف `import { limiter } from "../lib/limits.js"`.
- غيّر:
  ```js
  const authLimiter = rateLimit({ windowMs: 15 * 60_000, limit: 20, standardHeaders: "draft-7", legacyHeaders: false })
  ```
  إلى:
  ```js
  const authLimiter = limiter(15 * 60_000, 20)
  ```

**في `server/src/routes/public.js`:**
- احذف `import rateLimit from "express-rate-limit"` وأضف `import { limiter } from "../lib/limits.js"`.
- غيّر:
  ```js
  const bookingLimiter = rateLimit({ windowMs: 60 * 60_000, limit: 6, standardHeaders: "draft-7", legacyHeaders: false })
  ```
  إلى:
  ```js
  const bookingLimiter = limiter(60 * 60_000, 6)
  ```

**في `server/src/routes/pro.js`:**
- احذف `import rateLimit from "express-rate-limit"` وأضف `import { limiter } from "../lib/limits.js"`.
- غيّر:
  ```js
  const uploadLimiter = rateLimit({ windowMs: 60 * 60_000, limit: 30, standardHeaders: "draft-7", legacyHeaders: false })
  ```
  إلى:
  ```js
  const uploadLimiter = limiter(60 * 60_000, 30)
  ```

**في `server/src/routes/offers.js`:**
- احذف `import rateLimit from "express-rate-limit"` وأضف `import { limiter } from "../lib/limits.js"`.
- غيّر:
  ```js
  const createLimiter = rateLimit({ windowMs: 60 * 60_000, limit: 10, standardHeaders: "draft-7", legacyHeaders: false })
  ```
  إلى:
  ```js
  const createLimiter = limiter(60 * 60_000, 10)
  ```

- [ ] **Step 4: أنشئ `server/src/app.js`** (محتوى `index.js` الحالي بدون الاتصال و`listen`)

```js
import fs from "node:fs"
import path from "node:path"
import express from "express"
import helmet from "helmet"
import cors from "cors"
import cookieParser from "cookie-parser"
import multer from "multer"
import { config } from "./config.js"
import { HttpError } from "./lib/common.js"
import { loadUser } from "./lib/auth.js"
import { limiter } from "./lib/limits.js"
import { PUBLIC_DIR } from "./lib/uploads.js"
import authRoutes from "./routes/auth.js"
import publicRoutes from "./routes/public.js"
import proRoutes from "./routes/pro.js"
import offerRoutes from "./routes/offers.js"
import adminRoutes from "./routes/admin.js"

export function createApp() {
  const app = express()
  app.disable("x-powered-by")
  if (config.trustProxy) app.set("trust proxy", 1)

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "blob:", "https:"],
        connectSrc: ["'self'"],
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"],
      },
    },
    crossOriginResourcePolicy: { policy: "same-site" },
  }))

  app.use(cors({ origin: config.clientOrigins, credentials: true }))

  // CSRF defence: state-changing requests must come from an allowed origin.
  app.use((req, _res, next) => {
    if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next()
    const origin = req.get("origin")
    const self = `${req.protocol}://${req.get("host")}`
    if (origin && origin !== self && !config.clientOrigins.includes(origin)) return next(new HttpError(403, "bad_origin"))
    next()
  })

  app.use(limiter(15 * 60_000, 600))
  app.use(express.json({ limit: "100kb" }))
  app.use(cookieParser())
  app.use(loadUser)

  app.get("/api/health", (_req, res) => res.json({ ok: true }))
  app.use("/api/auth", authRoutes)
  app.use("/api/me", proRoutes)
  app.use("/api/offers", offerRoutes)
  app.use("/api/admin", adminRoutes)
  app.use("/api", publicRoutes)
  app.use("/api", (_req, _res, next) => next(new HttpError(404, "not_found")))

  // Public portfolio images. Never executed or sniffed as HTML.
  app.use("/uploads", express.static(PUBLIC_DIR, {
    fallthrough: false, index: false, dotfiles: "deny", maxAge: "30d",
    setHeaders: (res) => {
      res.setHeader("X-Content-Type-Options", "nosniff")
      res.setHeader("Content-Security-Policy", "default-src 'none'")
    },
  }))

  // Optional: serve the built front-end (SPA) from the same origin.
  if (config.serveClientDir && fs.existsSync(config.serveClientDir)) {
    app.use("/assets", express.static(path.join(config.serveClientDir, "assets"), { immutable: true, maxAge: "1y", fallthrough: true }))
    app.use(express.static(config.serveClientDir, { index: false, maxAge: "1d" }))
    app.get("*", (_req, res) => {
      res.setHeader("Cache-Control", "no-cache")
      res.sendFile(path.join(config.serveClientDir, "index.html"))
    })
  }

  // Errors: never leak internals to the client.
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err instanceof HttpError) return res.status(err.status).json({ error: err.code, ...(config.isProd ? {} : { message: err.message }) })
    if (err instanceof multer.MulterError) return res.status(400).json({ error: err.code === "LIMIT_FILE_SIZE" ? "file_too_large" : "invalid_upload" })
    if (err?.type === "entity.parse.failed") return res.status(400).json({ error: "invalid_json" })
    if (err?.code === 11000) return res.status(409).json({ error: "duplicate" })
    if (err?.name === "ValidationError" || err?.name === "CastError") return res.status(400).json({ error: "invalid_input" })
    if (err?.status === 404) return res.status(404).json({ error: "not_found" })
    console.error(err)
    res.status(500).json({ error: "server_error" })
  })

  return app
}
```

- [ ] **Step 5: استبدل `server/src/index.js` بالكامل**

```js
import fs from "node:fs"
import mongoose from "mongoose"
import { config } from "./config.js"
import { createApp } from "./app.js"
import { PUBLIC_DIR } from "./lib/uploads.js"

await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 15_000 })
fs.mkdirSync(PUBLIC_DIR, { recursive: true })
const server = createApp().listen(config.port, () => console.log(`NewLook API on :${config.port}`))

// Graceful stop (Coolify sends SIGTERM on redeploy).
for (const sig of ["SIGTERM", "SIGINT"]) {
  process.on(sig, () => {
    server.close(() => mongoose.disconnect().finally(() => process.exit(0)))
    setTimeout(() => process.exit(1), 10_000).unref()
  })
}
```

- [ ] **Step 6: أنشئ `server/test/helpers.js`**

```js
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
```

- [ ] **Step 7: أنشئ `server/test/health.test.js`**

```js
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { startServer, stopServer, client } from "./helpers.js"

before(startServer)
after(stopServer)

test("health endpoint answers", async () => {
  const r = await client()("/api/health")
  assert.equal(r.status, 200)
  assert.deepEqual(r.data, { ok: true })
})
```

- [ ] **Step 8: شغّل الاختبار**

Run: `cd server && npm test`
Expected: `# pass 1` و `# fail 0`.
أول تشغيل ينزّل MongoDB (قد يأخذ دقيقة).

- [ ] **Step 9: Commit**

```bash
git add server/package.json server/package-lock.json server/src/app.js server/src/index.js server/src/lib/limits.js server/src/routes/auth.js server/src/routes/public.js server/src/routes/pro.js server/src/routes/offers.js server/test
git commit -m "test: split app from server start, add node:test harness

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 1: كتالوج الأصناف و `GET /api/catalog`

**Files:**
- Create: `server/src/catalog/categories.js`, `server/src/routes/catalog.js`, `server/test/catalog.test.js`
- Modify: `server/src/app.js`

- [ ] **Step 1: اكتب الاختبار `server/test/catalog.test.js`**

```js
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { startServer, stopServer, client } from "./helpers.js"

before(startServer)
after(stopServer)

const lum = (h) => {
  const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }

test("catalog lists the 7 categories plus a default", async () => {
  const r = await client()("/api/catalog")
  assert.equal(r.status, 200)
  const keys = r.data.categories.map((c) => c.key)
  assert.deepEqual(keys, ["barber", "women_salon", "hair", "skincare", "nails", "hammam", "makeup"])
  assert.equal(r.data.default.key, "default")
  const barber = r.data.categories.find((c) => c.key === "barber")
  assert.equal(barber.value, "حلاقة رجالية")
  assert.deepEqual(barber.features, ["live_status", "walkin_queue", "style_tags"])
  assert.deepEqual(barber.liveStates, ["free", "busy", "closed"])
  const hammam = r.data.categories.find((c) => c.key === "hammam")
  assert.deepEqual(hammam.features, ["crowd_status", "gender_schedule", "ritual_builder", "bring_list"])
  assert.ok(r.data.amenities.wifi.ar)
})

test("every theme colour is #RRGGBB and readable (WCAG AA)", async () => {
  const r = await client()("/api/catalog")
  for (const cat of [...r.data.categories, r.data.default]) {
    for (const mode of ["light", "dark"]) {
      const c = cat.theme.colors[mode]
      for (const v of Object.values(c)) assert.match(v, /^#[0-9A-F]{6}$/i, `${cat.key} ${mode}`)
      for (const [f, b] of [["text", "background"], ["text", "surface"], ["muted", "background"], ["onPrimary", "primary"]]) {
        assert.ok(contrast(c[f], c[b]) >= 4.5, `${cat.key} ${mode} ${f}/${b}`)
      }
    }
  }
})

test("catalog supports ETag / 304", async () => {
  const c = client()
  const r1 = await c("/api/catalog")
  const etag = r1.headers.get("etag")
  assert.ok(etag)
  assert.match(r1.headers.get("cache-control"), /max-age=300/)
  const r2 = await c("/api/catalog", { headers: { "If-None-Match": etag } })
  assert.equal(r2.status, 304)
})
```

- [ ] **Step 2: شغّل الاختبار وتأكد أنه يفشل**

Run: `cd server && node --test test/catalog.test.js`
Expected: FAIL (`404` على `/api/catalog`).

- [ ] **Step 3: أنشئ `server/src/catalog/categories.js`**

```js
// Category catalog: single source of truth for themes and features (web + Flutter).
// Bump CATALOG_VERSION whenever anything in this file changes (clients cache by it).
export const CATALOG_VERSION = "2026-11-10.1"

const L = (ar, fr, en, es) => ({ ar, fr, en, es })

export const AMENITIES = {
  ac: L("مكيف", "Climatisé", "Air conditioning", "Aire acondicionado"),
  wifi: L("Wi-Fi", "Wi-Fi", "Wi-Fi", "Wi-Fi"),
  kids: L("الأطفال مرحب بهم", "Enfants bienvenus", "Kids welcome", "Niños bienvenidos"),
  card: L("الأداء بالبطاقة", "Paiement par carte", "Card payment", "Pago con tarjeta"),
  parking: L("موقف سيارات", "Parking", "Parking", "Aparcamiento"),
  accessible: L("ولوج سهل", "Accès facile", "Step-free access", "Acceso adaptado"),
  towels: L("فوطة متوفرة", "Serviettes fournies", "Towels provided", "Toallas incluidas"),
  private_room: L("حمام خاص", "Hammam privatif", "Private hammam", "Hammam privado"),
  female_staff: L("طاقم نسائي", "Personnel féminin", "Female staff", "Personal femenino"),
}

const STATUS_LIGHT = { success: "#2E7D4F", warning: "#9A6416", danger: "#B42318" }
const STATUS_DARK = { success: "#4CAF7A", warning: "#E0A548", danger: "#F07167" }
const BODY_FONT = "IBM Plex Sans Arabic"

const theme = ({ mode = "light", light, dark, display, accent, radius = 12, assets = {}, priceBoard = "menu" }) => ({
  mode,
  colors: { light: { ...light, ...STATUS_LIGHT }, dark: { ...dark, ...STATUS_DARK } },
  fonts: { display, body: BODY_FONT, ...(accent ? { accent } : {}) },
  radius,
  assets: { ...assets, priceBoard },
})

export const DEFAULT_CATEGORY = {
  key: "default", value: "", labels: L("نيولوك", "NewLook", "NewLook", "NewLook"),
  features: [], styleTags: [], amenities: ["ac", "wifi", "card", "parking", "accessible"], liveStates: [],
  theme: theme({
    light: { background: "#F5FAF7", surface: "#FFFFFF", text: "#182720", muted: "#5A5F70", primary: "#267A54", onPrimary: "#FFFFFF", accent: "#7A5A1F", border: "#DCE8E1" },
    dark: { background: "#0F1813", surface: "#16221B", text: "#E6F1EB", muted: "#A6B5AD", primary: "#5CC596", onPrimary: "#0F1813", accent: "#D8B061", border: "#26362D" },
    display: "Reem Kufi",
  }),
}

export const CATEGORIES = [
  {
    key: "barber", value: "حلاقة رجالية", labels: L("حلاقة رجالية", "Barbier", "Barber", "Barbería"),
    features: ["live_status", "walkin_queue", "style_tags"],
    liveStates: ["free", "busy", "closed"],
    styleTags: [
      { key: "fade", labels: L("فيد", "Dégradé", "Fade", "Degradado") },
      { key: "classic", labels: L("كلاسيك", "Classique", "Classic", "Clásico") },
      { key: "beard", labels: L("لحية", "Barbe", "Beard", "Barba") },
      { key: "shaved", labels: L("رأس محلوق", "Rasé", "Shaved", "Rapado") },
      { key: "kids", labels: L("أطفال", "Enfants", "Kids", "Niños") },
      { key: "design", labels: L("رسم بالماكينة", "Motifs", "Hair design", "Diseños") },
    ],
    amenities: ["ac", "wifi", "kids", "card", "parking", "accessible"],
    theme: theme({
      mode: "dark", radius: 4, priceBoard: "chalkboard", display: "Reem Kufi", accent: "Special Elite",
      assets: { headerPattern: "/assets/themes/barber/pole.svg", background: "/assets/themes/barber/wood.svg" },
      light: { background: "#F4EDE4", surface: "#FFFFFF", text: "#1E1612", muted: "#5E5047", primary: "#A11D24", onPrimary: "#FFFFFF", accent: "#8A6424", border: "#D9CBBB" },
      dark: { background: "#17110E", surface: "#221A15", text: "#F3E9DC", muted: "#B8A693", primary: "#B8302F", onPrimary: "#FFFFFF", accent: "#C99A4B", border: "#3A2E26" },
    }),
  },
  {
    key: "women_salon", value: "صالون نسائي", labels: L("صالون نسائي", "Salon pour femmes", "Women's salon", "Salón de mujeres"),
    features: [], liveStates: [], styleTags: [],
    amenities: ["ac", "wifi", "female_staff", "kids", "card", "parking", "accessible"],
    theme: theme({
      display: "El Messiri", radius: 16, priceBoard: "menu",
      light: { background: "#FBF3F4", surface: "#FFFFFF", text: "#2A1A20", muted: "#6E5560", primary: "#A3324F", onPrimary: "#FFFFFF", accent: "#9C7A2E", border: "#EBD6DB" },
      dark: { background: "#1E1418", surface: "#291C21", text: "#F6E8EC", muted: "#C9A9B4", primary: "#E07A97", onPrimary: "#1E1418", accent: "#D9B25C", border: "#44303A" },
    }),
  },
  {
    key: "hair", value: "الشعر والتصفيف", labels: L("الشعر والتصفيف", "Coiffure", "Hair styling", "Peluquería"),
    features: [], liveStates: [], styleTags: [],
    amenities: ["ac", "wifi", "card", "parking", "accessible"],
    theme: theme({
      display: "El Messiri", radius: 14, priceBoard: "menu",
      light: { background: "#F7F4FA", surface: "#FFFFFF", text: "#1F1828", muted: "#5F5470", primary: "#6A3D9A", onPrimary: "#FFFFFF", accent: "#A0527A", border: "#E2DAEC" },
      dark: { background: "#17131D", surface: "#211B29", text: "#EEE8F5", muted: "#B9AECB", primary: "#B48BE0", onPrimary: "#17131D", accent: "#E08FB5", border: "#352C42" },
    }),
  },
  {
    key: "skincare", value: "العناية بالبشرة", labels: L("العناية بالبشرة", "Soins de la peau", "Skincare", "Cuidado de la piel"),
    features: [], liveStates: [], styleTags: [],
    amenities: ["ac", "female_staff", "card", "parking", "accessible"],
    theme: theme({
      display: "Tajawal", radius: 18, priceBoard: "menu",
      light: { background: "#F4F7F3", surface: "#FFFFFF", text: "#18241D", muted: "#55665B", primary: "#2F6B4C", onPrimary: "#FFFFFF", accent: "#8A6A3B", border: "#D5E0D7" },
      dark: { background: "#121A15", surface: "#1A241E", text: "#E7F0E9", muted: "#A7BAAD", primary: "#7CC49C", onPrimary: "#121A15", accent: "#D2B07A", border: "#2B3A31" },
    }),
  },
  {
    key: "nails", value: "الأظافر", labels: L("الأظافر", "Ongles", "Nails", "Uñas"),
    features: [], liveStates: [], styleTags: [],
    amenities: ["ac", "wifi", "card", "parking", "accessible"],
    theme: theme({
      display: "Lalezar", radius: 20, priceBoard: "tiles",
      light: { background: "#FFF6F2", surface: "#FFFFFF", text: "#2A1712", muted: "#6D5249", primary: "#B23A1F", onPrimary: "#FFFFFF", accent: "#7A4FA0", border: "#F0D9CF" },
      dark: { background: "#1E1411", surface: "#2A1C17", text: "#FBEAE3", muted: "#CFAFA3", primary: "#F08A6C", onPrimary: "#1E1411", accent: "#C4A3E6", border: "#46302A" },
    }),
  },
  {
    key: "hammam", value: "الحمام والسبا", labels: L("الحمام والسبا", "Hammam & spa", "Hammam & spa", "Hammam y spa"),
    features: ["crowd_status", "gender_schedule", "ritual_builder", "bring_list"],
    liveStates: ["quiet", "moderate", "crowded", "closed"],
    styleTags: [],
    amenities: ["private_room", "female_staff", "towels", "kids", "card", "parking", "accessible"],
    theme: theme({
      display: "Amiri", radius: 22, priceBoard: "menu",
      assets: { headerPattern: "/assets/themes/hammam/zellige.svg", background: "/assets/themes/hammam/zellige.svg" },
      light: { background: "#F3EBDD", surface: "#FBF6EE", text: "#2B2118", muted: "#6A5848", primary: "#8C3B1E", onPrimary: "#FFFFFF", accent: "#2F6B5E", border: "#DDCDB7" },
      dark: { background: "#1C1712", surface: "#26201A", text: "#F1E6D6", muted: "#BCA98F", primary: "#D0794F", onPrimary: "#1C1712", accent: "#6FB3A2", border: "#3B3128" },
    }),
  },
  {
    key: "makeup", value: "المكياج", labels: L("المكياج", "Maquillage", "Makeup", "Maquillaje"),
    features: [], liveStates: [], styleTags: [],
    amenities: ["female_staff", "card", "parking", "accessible"],
    theme: theme({
      display: "Aref Ruqaa", radius: 10, priceBoard: "menu",
      light: { background: "#FAF5EE", surface: "#FFFFFF", text: "#22141A", muted: "#645059", primary: "#7A1F3D", onPrimary: "#FFFFFF", accent: "#8C6A1C", border: "#E8D9C6" },
      dark: { background: "#1A1014", surface: "#24171D", text: "#F5E9EE", muted: "#C4A8B3", primary: "#D9708F", onPrimary: "#1A1014", accent: "#D4AF37", border: "#3F2A33" },
    }),
  },
]

export const categoryByValue = (value) => CATEGORIES.find((c) => c.value === value) ?? DEFAULT_CATEGORY
export const categoryByKey = (key) => CATEGORIES.find((c) => c.key === key) ?? DEFAULT_CATEGORY
export const hasFeature = (value, feature) => categoryByValue(value).features.includes(feature)

export function publicCatalog() {
  return { version: CATALOG_VERSION, amenities: AMENITIES, categories: CATEGORIES, default: DEFAULT_CATEGORY }
}
```

- [ ] **Step 4: أنشئ `server/src/routes/catalog.js`**

```js
import { Router } from "express"
import { CATALOG_VERSION, publicCatalog } from "../catalog/categories.js"

const r = Router()
const body = JSON.stringify(publicCatalog())
const etag = `"catalog-${CATALOG_VERSION}"`

r.get("/catalog", (req, res) => {
  res.setHeader("ETag", etag)
  res.setHeader("Cache-Control", "public, max-age=300")
  if (req.get("if-none-match") === etag) return res.status(304).end()
  res.type("application/json").send(body)
})

export default r
```

- [ ] **Step 5: سجّل المسار في `server/src/app.js`**

- أضف مع الـ imports:
  ```js
  import catalogRoutes from "./routes/catalog.js"
  ```
- وقبل السطر `app.use("/api", publicRoutes)` أضف:
  ```js
  app.use("/api", catalogRoutes)
  ```

- [ ] **Step 6: شغّل الاختبار**

Run: `cd server && node --test test/catalog.test.js`
Expected: `# pass 3`, `# fail 0`

- [ ] **Step 7: Commit**

```bash
git add server/src/catalog server/src/routes/catalog.js server/src/app.js server/test/catalog.test.js
git commit -m "feat(api): category catalog with themes and features (GET /api/catalog)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: الدوال الزمنية النقية (`lib/schedule.js`)

**Files:**
- Create: `server/src/lib/schedule.js`, `server/test/schedule.test.js`

- [ ] **Step 1: اكتب الاختبار `server/test/schedule.test.js`**

```js
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
```

- [ ] **Step 2: شغّل وتأكد من الفشل**

Run: `cd server && node --test test/schedule.test.js`
Expected: FAIL (`Cannot find module ../src/lib/schedule.js`).

- [ ] **Step 3: أنشئ `server/src/lib/schedule.js`**

```js
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
```

- [ ] **Step 4: شغّل الاختبار**

Run: `cd server && node --test test/schedule.test.js`
Expected: `# pass 5`, `# fail 0`

- [ ] **Step 5: Commit**

```bash
git add server/src/lib/schedule.js server/test/schedule.test.js
git commit -m "feat(api): pure schedule helpers (open now, today status, audience, live status)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: تعديل النماذج (Models)

**Files:**
- Modify: `server/src/models.js`

- [ ] **Step 1: في `BusinessSchema` أضف الحقول** (قبل سطر `}, opts)` الخاص بـ `BusinessSchema`)

ابحث عن:
```js
  published: { type: Boolean, default: false },
  hours: { type: [HourSchema], default: [] },
}, opts)
```
واستبدله بـ:
```js
  published: { type: Boolean, default: false },
  hours: { type: [HourSchema], default: [] },
  address: {
    line: { type: String, default: "", maxlength: 200 },
    district: { type: String, default: "", maxlength: 80 },
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
  },
  amenities: { type: [String], default: [] },
  // Category-specific settings, validated by lib/extras.js (chairs, genderSchedule, ritualSteps, bringList).
  extras: { type: Schema.Types.Mixed, default: () => ({}) },
  // Manual live status set by the pro (see lib/schedule.js computeLive).
  live: {
    state: { type: String, default: null },
    waiting: { type: Number, default: 0 },
    updatedAt: { type: Date, default: null },
  },
}, { ...opts, minimize: false })
```

- [ ] **Step 2: الوسوم في `PortfolioSchema`**

ابحث عن:
```js
  published: { type: Boolean, default: true },
}, opts)
```
(السطر الذي داخل `PortfolioSchema`) واستبدله بـ:
```js
  published: { type: Boolean, default: true },
  tags: { type: [String], default: [] },
}, opts)
```

- [ ] **Step 3: عدة خدمات في `BookingSchema`**

ابحث عن:
```js
  status: { type: String, enum: ["pending", "confirmed", "cancelled", "done"], default: "pending" },
}, opts)
BookingSchema.index({ businessId: 1, startsAt: 1 })
```
واستبدله بـ:
```js
  status: { type: String, enum: ["pending", "confirmed", "cancelled", "done"], default: "pending" },
  items: {
    type: [{ serviceId: { type: ObjectId, ref: "Service" }, name: String, price: Number, durationMinutes: Number, _id: false }],
    default: [],
  },
  audience: { type: String, enum: ["women", "men"], default: undefined },
}, opts)
BookingSchema.index({ businessId: 1, startsAt: 1 })
```

- [ ] **Step 4: نموذج الطابور**

بعد تعريف `AuditSchema` وقبل `LockSchema` أضف:
```js
const QueueEntrySchema = new Schema({
  businessId: { type: ObjectId, ref: "Business", required: true },
  name: { type: String, required: true, maxlength: 80 },
  phone: { type: String, required: true },
  status: { type: String, enum: ["waiting", "served", "no_show", "cancelled"], default: "waiting" },
  calledAt: { type: Date, default: null },
  tokenHash: { type: String, required: true, select: false },
}, opts)
QueueEntrySchema.index({ businessId: 1, status: 1, createdAt: 1 })
QueueEntrySchema.index({ phone: 1, status: 1 })
```

ومع الـ exports أضف:
```js
export const QueueEntry = model("QueueEntry", QueueEntrySchema)
```

- [ ] **Step 5: تحقق أن الاختبارات السابقة ما زالت ناجحة**

Run: `cd server && npm test`
Expected: كل الاختبارات `pass`.

- [ ] **Step 6: Commit**

```bash
git add server/src/models.js
git commit -m "feat(api): business address/amenities/extras/live, portfolio tags, booking items, queue model

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: التحقق من المعلومات الإضافية (`lib/extras.js`)

**Files:**
- Create: `server/src/lib/extras.js`, `server/test/extras.test.js`

- [ ] **Step 1: اكتب الاختبار `server/test/extras.test.js`**

```js
import { test } from "node:test"
import assert from "node:assert/strict"
import { checkHammamExtras, parseAmenities, parseExtras, parseTags } from "../src/lib/extras.js"

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
```

- [ ] **Step 2: شغّل وتأكد من الفشل**

Run: `cd server && node --test test/extras.test.js`
Expected: FAIL (`Cannot find module`).

- [ ] **Step 3: أنشئ `server/src/lib/extras.js`**

```js
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
```

- [ ] **Step 4: شغّل الاختبار**

Run: `cd server && node --test test/extras.test.js`
Expected: `# pass 5`, `# fail 0`

- [ ] **Step 5: Commit**

```bash
git add server/src/lib/extras.js server/test/extras.test.js
git commit -m "feat(api): per-category validation of extras, amenities and tags

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: الطابور وتقديم النشاط للعموم (`lib/queue.js`, `lib/present.js`)

**Files:**
- Create: `server/src/lib/queue.js`, `server/src/lib/present.js`

هذه دوال مساعدة تُختبر عبر الواجهات في المهام 6 إلى 8.

- [ ] **Step 1: أنشئ `server/src/lib/queue.js`**

```js
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
```

- [ ] **Step 2: أنشئ `server/src/lib/present.js`**

```js
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
```

- [ ] **Step 3: تحقق من الصياغة**

Run: `cd server && node --check src/lib/queue.js && node --check src/lib/present.js && echo ok`
Expected: `ok`

- [ ] **Step 4: Commit**

```bash
git add server/src/lib/queue.js server/src/lib/present.js
git commit -m "feat(api): queue helpers and public business presenter

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: إعدادات المهني (`extras`، العنوان، الأيقونات، الحالة الحية) والبروفايل العام

**Files:**
- Modify: `server/src/routes/pro.js`, `server/src/routes/public.js`
- Create: `server/test/profile.test.js`

- [ ] **Step 1: اكتب الاختبار `server/test/profile.test.js`**

```js
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { startServer, stopServer, client, createPro } from "./helpers.js"

before(startServer)
after(stopServer)

test("barber saves address, amenities and chairs; profile exposes them", async () => {
  const { c, businessId } = await createPro("حلاقة رجالية")
  const r = await c("/api/me/business", { method: "PUT", body: {
    name: "Salon", category: "حلاقة رجالية", city: "مراكش", published: true,
    address: { line: "12 زنقة الورد", district: "جليز", lat: 31.63, lng: -8.01 },
    amenities: ["wifi", "ac"], extras: { chairs: 2 },
  } })
  assert.equal(r.status, 200, JSON.stringify(r.data))
  const p = await client()(`/api/businesses/${businessId}`)
  assert.equal(p.data.business.categoryKey, "barber")
  assert.equal(p.data.business.address.district, "جليز")
  assert.deepEqual(p.data.business.amenities, ["wifi", "ac"])
  assert.equal(p.data.business.extras.chairs, 2)
  assert.equal(p.data.business.todayStatus.openNow, true)
  assert.equal(p.data.business.live.state, "unknown")
  assert.equal(p.data.business.currentAudience, null)
})

test("saving the base profile keeps extras; wrong extras are rejected", async () => {
  const { c, businessId } = await createPro("حلاقة رجالية")
  await c("/api/me/business", { method: "PUT", body: { name: "S", category: "حلاقة رجالية", city: "مراكش", published: true, extras: { chairs: 3 }, amenities: ["kids"] } })
  await c("/api/me/business", { method: "PUT", body: { name: "S2", category: "حلاقة رجالية", city: "مراكش", published: true } })
  const p = await client()(`/api/businesses/${businessId}`)
  assert.equal(p.data.business.extras.chairs, 3)
  assert.deepEqual(p.data.business.amenities, ["kids"])
  const bad = await c("/api/me/business", { method: "PUT", body: { name: "S", category: "حلاقة رجالية", city: "مراكش", published: true, amenities: ["towels"] } })
  assert.equal(bad.status, 400)
  const bad2 = await c("/api/me/business", { method: "PUT", body: { name: "S", category: "حلاقة رجالية", city: "مراكش", published: true, extras: { bringList: [] } } })
  assert.equal(bad2.status, 400)
})

test("changing category resets extras and drops foreign amenities", async () => {
  const { c, businessId } = await createPro("حلاقة رجالية")
  await c("/api/me/business", { method: "PUT", body: { name: "S", category: "حلاقة رجالية", city: "مراكش", published: true, extras: { chairs: 4 }, amenities: ["wifi", "kids"] } })
  await c("/api/me/business", { method: "PUT", body: { name: "S", category: "الحمام والسبا", city: "مراكش", published: true } })
  const p = await client()(`/api/businesses/${businessId}`)
  assert.deepEqual(p.data.business.extras, { genderSchedule: [], ritualSteps: [], bringList: [] })
  assert.deepEqual(p.data.business.amenities, ["kids"])
})

test("live status: pro sets it, public sees it, other categories refuse", async () => {
  const { c, businessId } = await createPro("حلاقة رجالية")
  const r = await c("/api/me/live", { method: "PATCH", body: { state: "free" } })
  assert.equal(r.status, 200)
  assert.equal(r.data.live.state, "free")
  const p = await client()(`/api/businesses/${businessId}`)
  assert.equal(p.data.business.live.state, "free")
  assert.equal((await c("/api/me/live", { method: "PATCH", body: { state: "crowded" } })).status, 400)
  const nails = await createPro("الأظافر")
  assert.equal((await nails.c("/api/me/live", { method: "PATCH", body: { state: "free" } })).status, 400)
  assert.equal((await client()("/api/me/live", { method: "PATCH", body: { state: "free" } })).status, 401)
})

test("search availableNow keeps only free barbers / quiet hammams", async () => {
  const a = await createPro("حلاقة رجالية", { city: "فاس" })
  await a.c("/api/me/live", { method: "PATCH", body: { state: "free" } })
  const b = await createPro("حلاقة رجالية", { city: "فاس" })
  await b.c("/api/me/live", { method: "PATCH", body: { state: "closed" } })
  const all = await client()(`/api/search?city=${encodeURIComponent("فاس")}`)
  assert.equal(all.data.results.length, 2)
  const now = await client()(`/api/search?city=${encodeURIComponent("فاس")}&availableNow=1`)
  assert.deepEqual(now.data.results.map((x) => x.id), [a.businessId])
  assert.equal(now.data.results[0].live.state, "free")
})

test("hammam schedule must stay inside opening hours", async () => {
  const { c } = await createPro("الحمام والسبا", { hours: [{ weekday: 1, start: "08:00", end: "20:00" }] })
  const base = { name: "H", category: "الحمام والسبا", city: "مراكش", published: true }
  const out = await c("/api/me/business", { method: "PUT", body: { ...base, extras: { genderSchedule: [{ weekday: 1, start: "07:00", end: "12:00", audience: "women" }] } } })
  assert.equal(out.data.error, "schedule_outside_hours")
  const ok = await c("/api/me/business", { method: "PUT", body: { ...base, extras: { genderSchedule: [{ weekday: 1, start: "08:00", end: "12:00", audience: "women" }] } } })
  assert.equal(ok.status, 200)
  const shrink = await c("/api/me/hours", { method: "PUT", body: { hours: [{ weekday: 1, start: "10:00", end: "20:00" }] } })
  assert.equal(shrink.data.error, "schedule_outside_hours")
})

test("deleting a service removes it from the ritual", async () => {
  const { c, businessId, services } = await createPro("الحمام والسبا", { services: [{ name: "كيس", price: 50, durationMinutes: 30 }, { name: "غاسول", price: 40, durationMinutes: 20 }] })
  await c("/api/me/business", { method: "PUT", body: { name: "H", category: "الحمام والسبا", city: "مراكش", published: true, extras: { ritualSteps: services.map((s) => s.id) } } })
  await c(`/api/me/services/${services[0].id}`, { method: "DELETE" })
  const p = await client()(`/api/businesses/${businessId}`)
  assert.deepEqual(p.data.business.extras.ritualSteps, [services[1].id])
})
```

- [ ] **Step 2: شغّل وتأكد من الفشل**

Run: `cd server && node --test test/profile.test.js`
Expected: FAIL (الحقول الجديدة غير موجودة، و`/api/me/live` يرجع 404).

- [ ] **Step 3: عدّل `server/src/routes/pro.js`**

**أ) الـ imports.** أضف بعد الموجودة:
```js
import { categoryByKey, categoryByValue } from "../catalog/categories.js"
import { addressSchema, checkHammamExtras, parseAmenities, parseExtras, parseTags } from "../lib/extras.js"
import { presentMany } from "../lib/present.js"
```

**ب) `workOut`.** غيّره ليُرجع الوسوم:
```js
const workOut = (w) => ({ id: String(w._id), title: w.title, caption: w.caption, imageUrl: w.imageUrl, tags: w.tags ?? [] })
```

**ج) `GET /business`.** استبدل الرد `res.json({ business: b.toJSON(), ... })` بـ:
```js
  const [presented] = await presentMany([b.toObject()])
  res.json({
    business: { ...b.toJSON(), categoryKey: presented.categoryKey, live: presented.live, todayStatus: presented.todayStatus, currentAudience: presented.currentAudience },
    services: services.map(svcOut),
    works: works.map(workOut),
    subscription: sub && { status: sub.status, expiresAt: sub.expiresAt, planName: sub.planId?.name ?? null },
  })
```

**د) `bizInput` و `PUT /business`.** استبدل `const bizInput = ...` ومسار `r.put("/business", ...)` كاملاً بـ:
```js
const bizInput = z.object({
  name: z.string().trim().min(2).max(100),
  category: z.enum(CATEGORIES),
  city: z.enum(CITIES),
  bio: z.string().trim().max(1000).default(""),
  phone: z.string().trim().max(30).default(""),
  published: z.boolean().default(false),
  address: addressSchema.optional(),
  amenities: z.array(z.string()).optional(),
  extras: z.record(z.any()).optional(),
})

r.put("/business", ah(async (req, res) => {
  const { address, amenities: amenInput, extras: extrasInput, ...body } = parse(bizInput, req.body)
  let phone = ""
  if (body.phone) { phone = normalizePhone(body.phone); if (!phone) throw badRequest("invalid_phone") }
  const existing = await myBusiness(req, { required: false })
  const key = categoryByValue(body.category).key
  const sameCategory = existing?.category === body.category
  const extras = parseExtras(key, extrasInput ?? (sameCategory ? existing.extras : {}))
  const allowed = categoryByKey(key).amenities
  const amenities = amenInput !== undefined ? parseAmenities(key, amenInput) : (existing?.amenities ?? []).filter((a) => allowed.includes(a))
  if (key === "hammam") {
    const serviceIds = existing ? (await Service.find({ businessId: existing._id }).distinct("_id")).map(String) : []
    checkHammamExtras(extras, { hours: existing?.hours ?? [], serviceIds })
  }
  const b = await Business.findOneAndUpdate(
    { userId: req.user._id },
    { $set: { ...body, phone, extras, amenities, ...(address && { address }) } },
    { upsert: true, new: true, runValidators: true },
  )
  if (!existing && config.trialDays > 0) {
    await Subscription.updateOne(
      { businessId: b._id },
      { $setOnInsert: { userId: req.user._id, status: "trial", startsAt: new Date(), expiresAt: DateTime.now().plus({ days: config.trialDays }).toJSDate() } },
      { upsert: true },
    )
  }
  res.json({ business: b.toJSON() })
}))
```

**هـ) `PUT /hours`.** استبدل المسار ليتحقق من جدول الحمام:
```js
r.put("/hours", ah(async (req, res) => {
  const { hours } = parse(z.object({
    hours: z.array(z.object({ weekday: z.number().int().min(0).max(6), start: hhmm, end: hhmm })).max(28),
  }), req.body)
  for (const h of hours) if (h.end <= h.start) throw badRequest("invalid_hours")
  for (let d = 0; d < 7; d++) {
    const day = hours.filter((h) => h.weekday === d).sort((a, c) => a.start.localeCompare(c.start))
    for (let i = 1; i < day.length; i++) if (day[i].start < day[i - 1].end) throw badRequest("overlapping_hours")
  }
  const b = await myBusiness(req)
  if (categoryByValue(b.category).key === "hammam") {
    const serviceIds = (await Service.find({ businessId: b._id }).distinct("_id")).map(String)
    checkHammamExtras(parseExtras("hammam", b.extras), { hours, serviceIds })
  }
  b.hours = hours
  await b.save()
  res.json({ hours: b.hours })
}))
```

**و) `DELETE /services/:id`.** بعد سطر `if (!out.deletedCount) throw notFound()` أضف:
```js
  await Business.updateOne({ _id: b._id }, { $pull: { "extras.ritualSteps": req.params.id } })
```

**ز) الحالة الحية.** أضف بعد مسارات الخدمات:
```js
// ─── Live status (barber: free/busy/closed, hammam: quiet/moderate/crowded/closed) ──
const liveLimiter = limiter(60 * 60_000, 120)
r.patch("/live", liveLimiter, ah(async (req, res) => {
  const b = await myBusiness(req)
  const states = categoryByValue(b.category).liveStates
  if (!states.length) throw badRequest("feature_unavailable")
  const { state, waiting } = parse(z.object({ state: z.enum(states), waiting: z.number().int().min(0).max(50).optional() }), req.body)
  b.live = { state, waiting: waiting ?? 0, updatedAt: new Date() }
  await b.save()
  const [presented] = await presentMany([b.toObject()])
  res.json({ live: presented.live })
}))
```

**ح) الوسوم.** في `POST /portfolio` غيّر سطر `const body = parse(...)` إلى:
```js
  const body = parse(z.object({ title: z.string().trim().min(1).max(100), caption: z.string().trim().max(300).default(""), tags: z.string().max(200).optional() }), req.body)
  const tags = parseTags(categoryByValue(b.category).key, body.tags)
```
وغيّر سطر الإنشاء إلى:
```js
  const w = await Portfolio.create({ title: body.title, caption: body.caption, tags, businessId: b._id, filePath: rel, imageUrl: `/uploads/${rel}` })
```
ثم أضف بعد `DELETE /portfolio/:id`:
```js
r.patch("/portfolio/:id", ah(async (req, res) => {
  const b = await myBusiness(req)
  const { tags } = parse(z.object({ tags: z.array(z.string()).max(5) }), req.body)
  const w = await Portfolio.findOneAndUpdate({ _id: requireId(req.params.id), businessId: b._id }, { $set: { tags: parseTags(categoryByValue(b.category).key, tags) } }, { new: true })
  if (!w) throw notFound()
  res.json({ work: workOut(w) })
}))
```

- [ ] **Step 4: عدّل `server/src/routes/public.js`**

**أ) الـ imports.** أضف:
```js
import { presentMany } from "../lib/present.js"
```

**ب) احذف الدالة `publicBiz`**، وغيّر المسارات الثلاثة كما يلي.

`GET /businesses` (استبدل المسار كاملاً):
```js
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
```

`GET /businesses/:id` (غيّر الرد فقط):
```js
  const [presented] = await presentMany([b])
  res.json({
    business: presented,
    services: services.map((s) => ({ id: String(s._id), name: s.name, price: s.price, durationMinutes: s.durationMinutes })),
    works: works.map((w) => ({ id: String(w._id), title: w.title, caption: w.caption, imageUrl: w.imageUrl, tags: w.tags ?? [] })),
  })
```

`GET /search` (استبدل المسار كاملاً):
```js
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
```

- [ ] **Step 5: شغّل الاختبار**

Run: `cd server && node --test test/profile.test.js`
Expected: `# pass 7`, `# fail 0`

- [ ] **Step 6: شغّل كل الاختبارات**

Run: `cd server && npm test`
Expected: لا يوجد `fail`.

- [ ] **Step 7: Commit**

```bash
git add server/src/routes/pro.js server/src/routes/public.js server/test/profile.test.js
git commit -m "feat(api): address, amenities, category extras, live status and tags

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: الطابور عن بعد (الحلاق)

**Files:**
- Create: `server/src/routes/queue.js`, `server/test/queue.test.js`
- Modify: `server/src/app.js`

- [ ] **Step 1: اكتب الاختبار `server/test/queue.test.js`**

```js
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import mongoose from "mongoose"
import { startServer, stopServer, client, createPro } from "./helpers.js"

before(startServer)
after(stopServer)

const join = (id, name, phone, extra = {}) => client()(`/api/businesses/${id}/queue`, { body: { name, phone, ...extra } })

test("join, position, estimate, status by token, cancel", async () => {
  const { c, businessId } = await createPro("حلاقة رجالية", { services: [{ name: "قصة", price: 50, durationMinutes: 20 }] })
  await c("/api/me/live", { method: "PATCH", body: { state: "free" } })
  const a = await join(businessId, "Ali", "0611111111")
  assert.equal(a.status, 201, JSON.stringify(a.data))
  assert.equal(a.data.position, 1)
  assert.equal(a.data.estimatedWaitMinutes, 0)
  const b = await join(businessId, "Omar", "0622222222")
  assert.equal(b.data.position, 2)
  assert.equal(b.data.estimatedWaitMinutes, 20)
  const s = await client()(`/api/queue/${b.data.id}?token=${b.data.token}`)
  assert.equal(s.data.position, 2)
  assert.equal(s.data.status, "waiting")
  assert.equal((await client()(`/api/queue/${b.data.id}?token=wrongtoken123`)).status, 404)
  const p = await client()(`/api/businesses/${businessId}`)
  assert.deepEqual([p.data.business.live.state, p.data.business.live.waiting], ["busy", 2])
  await client()(`/api/queue/${a.data.id}/cancel`, { body: { token: a.data.token } })
  const s2 = await client()(`/api/queue/${b.data.id}?token=${b.data.token}`)
  assert.equal(s2.data.position, 1)
})

test("same phone cannot be in two queues; honeypot; invalid phone", async () => {
  const x = await createPro("حلاقة رجالية")
  const y = await createPro("حلاقة رجالية")
  assert.equal((await join(x.businessId, "Ali", "0633333333")).status, 201)
  const dup = await join(y.businessId, "Ali", "+212 6 33 33 33 33")
  assert.deepEqual([dup.status, dup.data.error], [429, "already_in_queue"])
  assert.equal((await join(x.businessId, "Bot", "0644444444", { website: "x" })).status, 400)
  assert.equal((await join(x.businessId, "Ali", "123")).status, 400)
})

test("closed shop refuses; non-barber refuses", async () => {
  const { c, businessId } = await createPro("حلاقة رجالية")
  await c("/api/me/live", { method: "PATCH", body: { state: "closed" } })
  const r = await join(businessId, "Ali", "0655555555")
  assert.deepEqual([r.status, r.data.error], [409, "closed_now"])
  const nails = await createPro("الأظافر")
  assert.equal((await join(nails.businessId, "Ali", "0655555556")).status, 400)
})

test("pro sees the queue, serves, marks no-show, clears", async () => {
  const { c, businessId } = await createPro("حلاقة رجالية")
  const a = await join(businessId, "Ali", "0666666661")
  const b = await join(businessId, "Omar", "0666666662")
  await join(businessId, "Sami", "0666666663")
  const list = await c("/api/me/queue")
  assert.deepEqual(list.data.entries.map((e) => e.name), ["Ali", "Omar", "Sami"])
  assert.equal((await c(`/api/me/queue/${a.data.id}/serve`, { method: "POST" })).status, 200)
  assert.equal((await c(`/api/me/queue/${b.data.id}/no-show`, { method: "POST" })).status, 200)
  assert.equal((await client()(`/api/queue/${a.data.id}?token=${a.data.token}`)).data.status, "served")
  assert.equal((await c("/api/me/queue")).data.entries.length, 1)
  await c("/api/me/queue/clear", { method: "POST" })
  assert.equal((await c("/api/me/queue")).data.entries.length, 0)
  const other = await createPro("حلاقة رجالية")
  assert.equal((await other.c(`/api/me/queue/${a.data.id}/serve`, { method: "POST" })).status, 404)
})

test("entries older than 4 hours expire as no_show", async () => {
  const { businessId } = await createPro("حلاقة رجالية")
  const a = await join(businessId, "Old", "0677777777")
  await mongoose.connection.db.collection("queueentries").updateOne(
    { _id: new mongoose.Types.ObjectId(a.data.id) },
    { $set: { createdAt: new Date(Date.now() - 5 * 3600_000) } },
  )
  const s = await client()(`/api/queue/${a.data.id}?token=${a.data.token}`)
  assert.equal(s.data.status, "no_show")
  assert.equal((await join(businessId, "Old", "0677777777")).status, 201)
})
```

- [ ] **Step 2: شغّل وتأكد من الفشل**

Run: `cd server && node --test test/queue.test.js`
Expected: FAIL (404 على `/api/businesses/:id/queue`).

- [ ] **Step 3: أنشئ `server/src/routes/queue.js`**

```js
import crypto from "node:crypto"
import { Router } from "express"
import { z } from "zod"
import { Business, QueueEntry } from "../models.js"
import { HttpError, ah, badRequest, businessIsActive, conflict, normalizePhone, notFound, parse, requireId, withLock } from "../lib/common.js"
import { requireAuth } from "../lib/auth.js"
import { limiter } from "../lib/limits.js"
import { categoryByValue } from "../catalog/categories.js"
import { avgDurations, expireQueue, positionOf } from "../lib/queue.js"
import { estimateWait } from "../lib/schedule.js"
import { presentMany } from "../lib/present.js"

const QUEUE_MAX = 30
const hash = (t) => crypto.createHash("sha256").update(t).digest("hex")
const sameHash = (a, b) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))

async function waitFor(b, position) {
  const avg = (await avgDurations([b._id])).get(String(b._id)) ?? 30
  return estimateWait(position - 1, b.extras?.chairs ?? 1, avg)
}

async function entryByToken(id, token) {
  const e = await QueueEntry.findById(requireId(id)).select("+tokenHash")
  if (!e || !sameHash(e.tokenHash, hash(String(token ?? "")))) throw notFound()
  return e
}

// ─── Clients (no account) ───────────────────────────────────────────
export const publicQueue = Router()

publicQueue.post("/businesses/:id/queue", limiter(60 * 60_000, 6), ah(async (req, res) => {
  const id = requireId(req.params.id)
  const body = parse(z.object({
    name: z.string().trim().min(2).max(80), phone: z.string().max(30),
    website: z.string().max(0).optional(), // honeypot
  }), req.body)
  const phone = normalizePhone(body.phone)
  if (!phone) throw badRequest("invalid_phone")
  const b = await Business.findOne({ _id: id, published: true }).lean()
  if (!b || !(await businessIsActive(b._id))) throw notFound()
  if (!categoryByValue(b.category).features.includes("walkin_queue")) throw badRequest("feature_unavailable")

  await expireQueue({ phone })
  if (await QueueEntry.exists({ phone, status: "waiting" })) throw new HttpError(429, "already_in_queue")

  const { entry, token } = await withLock(`queue:${b._id}`, async () => {
    const [p] = await presentMany([b])
    if (p.live?.state === "closed") throw conflict("closed_now")
    if ((await QueueEntry.countDocuments({ businessId: b._id, status: "waiting" })) >= QUEUE_MAX) throw conflict("queue_full")
    const t = crypto.randomBytes(24).toString("base64url")
    return { entry: await QueueEntry.create({ businessId: b._id, name: body.name, phone, tokenHash: hash(t) }), token: t }
  })
  const position = await positionOf(entry)
  res.status(201).json({ id: String(entry._id), token, position, estimatedWaitMinutes: await waitFor(b, position) })
}))

publicQueue.get("/queue/:id", ah(async (req, res) => {
  const { token } = parse(z.object({ token: z.string().min(10).max(100) }), req.query)
  const e = await entryByToken(req.params.id, token)
  await expireQueue({ _id: e._id })
  const fresh = await QueueEntry.findById(e._id).lean()
  const b = await Business.findById(fresh.businessId).lean()
  const position = fresh.status === "waiting" ? await positionOf(fresh) : null
  res.json({
    status: fresh.status, position,
    estimatedWaitMinutes: position ? await waitFor(b, position) : null,
    businessName: b?.name ?? "",
  })
}))

publicQueue.post("/queue/:id/cancel", ah(async (req, res) => {
  const { token } = parse(z.object({ token: z.string().min(10).max(100) }), req.body)
  const e = await entryByToken(req.params.id, token)
  await QueueEntry.updateOne({ _id: e._id, status: "waiting" }, { $set: { status: "cancelled" } })
  res.json({ ok: true })
}))

// ─── Barber (owner) ─────────────────────────────────────────────────
export const proQueue = Router()
proQueue.use(requireAuth)

async function ownBusiness(req) {
  const b = await Business.findOne({ userId: req.user._id })
  if (!b) throw notFound("no_business")
  return b
}

proQueue.get("/", ah(async (req, res) => {
  const b = await ownBusiness(req)
  await expireQueue({ businessId: b._id })
  const list = await QueueEntry.find({ businessId: b._id, status: "waiting" }).sort({ createdAt: 1 }).lean()
  res.json({ entries: list.map((e) => ({ id: String(e._id), name: e.name, phone: e.phone, createdAt: e.createdAt })) })
}))

proQueue.post("/clear", ah(async (req, res) => {
  const b = await ownBusiness(req)
  await QueueEntry.updateMany({ businessId: b._id, status: "waiting" }, { $set: { status: "cancelled" } })
  res.json({ ok: true })
}))

for (const [action, status] of [["serve", "served"], ["no-show", "no_show"]]) {
  proQueue.post(`/:id/${action}`, ah(async (req, res) => {
    const b = await ownBusiness(req)
    const e = await QueueEntry.findOneAndUpdate(
      { _id: requireId(req.params.id), businessId: b._id, status: "waiting" },
      { $set: { status, calledAt: new Date() } },
      { new: true },
    )
    if (!e) throw notFound()
    // Serving clients proves the shop is open: keep the live status fresh.
    const state = b.live?.state && b.live.state !== "closed" ? b.live.state : "free"
    await Business.updateOne({ _id: b._id }, { $set: { "live.state": state, "live.updatedAt": new Date() } })
    res.json({ ok: true })
  }))
}
```

- [ ] **Step 4: سجّل المسارات في `server/src/app.js`**

- أضف مع الـ imports:
  ```js
  import { proQueue, publicQueue } from "./routes/queue.js"
  ```
- غيّر:
  ```js
  app.use("/api/me", proRoutes)
  ```
  إلى:
  ```js
  app.use("/api/me/queue", proQueue)
  app.use("/api/me", proRoutes)
  ```
- وقبل `app.use("/api", catalogRoutes)` أضف:
  ```js
  app.use("/api", publicQueue)
  ```

- [ ] **Step 5: شغّل الاختبار**

Run: `cd server && node --test test/queue.test.js`
Expected: `# pass 5`, `# fail 0`

- [ ] **Step 6: Commit**

```bash
git add server/src/routes/queue.js server/src/app.js server/test/queue.test.js
git commit -m "feat(api): walk-in queue for barbers (join, position, serve, no-show, expiry)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: الحجز بعدة خدمات وأوقات الرجال والنساء

**Files:**
- Modify: `server/src/lib/common.js`, `server/src/routes/public.js`
- Create: `server/test/booking.test.js`

- [ ] **Step 1: اكتب الاختبار `server/test/booking.test.js`**

```js
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { startServer, stopServer, client, createPro, tomorrow } from "./helpers.js"

before(startServer)
after(stopServer)

const hhmm = (iso) => new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Casablanca" }).format(new Date(iso))
const dayOfTomorrow = () => new Date(`${tomorrow()}T12:00:00Z`).getUTCDay()

test("multi-service booking uses the total duration and blocks overlaps", async () => {
  const { businessId, services } = await createPro("الحمام والسبا", {
    services: [{ name: "كيس", price: 50, durationMinutes: 30 }, { name: "غاسول", price: 40, durationMinutes: 30 }],
    hours: [{ weekday: dayOfTomorrow(), start: "10:00", end: "12:00" }],
  })
  const ids = services.map((s) => s.id).join(",")
  const slots = (await client()(`/api/businesses/${businessId}/slots?services=${ids}&day=${tomorrow()}`)).data.slots
  assert.equal(hhmm(slots.at(-1)), "11:00") // 60 min must fit before 12:00
  const r = await client()(`/api/businesses/${businessId}/bookings`, { body: { serviceIds: services.map((s) => s.id), startsAt: slots[0], name: "Sara", phone: "0611112222" } })
  assert.equal(r.status, 201, JSON.stringify(r.data))
  const after = (await client()(`/api/businesses/${businessId}/slots?services=${services[0].id}&day=${tomorrow()}`)).data.slots
  assert.ok(!after.some((s) => hhmm(s) < "11:00"))
})

test("legacy serviceId still works; foreign service is rejected", async () => {
  const a = await createPro("حلاقة رجالية", { hours: [{ weekday: dayOfTomorrow(), start: "10:00", end: "18:00" }] })
  const b = await createPro("حلاقة رجالية")
  const slots = (await client()(`/api/businesses/${a.businessId}/slots?service=${a.services[0].id}&day=${tomorrow()}`)).data.slots
  const ok = await client()(`/api/businesses/${a.businessId}/bookings`, { body: { serviceId: a.services[0].id, startsAt: slots[0], name: "Ali", phone: "0633334444" } })
  assert.equal(ok.status, 201)
  const bad = await client()(`/api/businesses/${a.businessId}/bookings`, { body: { serviceIds: [b.services[0].id], startsAt: slots[1], name: "Ali", phone: "0633335555" } })
  assert.equal(bad.status, 400)
  const list = await a.c("/api/me/bookings")
  assert.equal(list.data.bookings[0].serviceName, "خدمة")
})

test("hammam: audience required, women slots only in women time", async () => {
  const wd = dayOfTomorrow()
  const { c, businessId, services } = await createPro("الحمام والسبا", { hours: [{ weekday: wd, start: "08:00", end: "20:00" }] })
  await c("/api/me/business", { method: "PUT", body: { name: "H", category: "الحمام والسبا", city: "مراكش", published: true, extras: {
    genderSchedule: [{ weekday: wd, start: "08:00", end: "12:00", audience: "women" }, { weekday: wd, start: "12:00", end: "20:00", audience: "men" }],
  } } })
  const base = `/api/businesses/${businessId}/slots?services=${services[0].id}&day=${tomorrow()}`
  assert.equal((await client()(base)).data.error, "audience_required")
  const women = (await client()(`${base}&audience=women`)).data.slots
  assert.ok(women.length > 0)
  assert.ok(women.every((s) => hhmm(s) < "12:00"))
  const men = (await client()(`${base}&audience=men`)).data.slots
  assert.ok(men.every((s) => hhmm(s) >= "12:00"))
  const wrong = await client()(`/api/businesses/${businessId}/bookings`, { body: { serviceIds: [services[0].id], startsAt: men[0], name: "Sara", phone: "0699990000", audience: "women" } })
  assert.equal(wrong.status, 409)
  const right = await client()(`/api/businesses/${businessId}/bookings`, { body: { serviceIds: [services[0].id], startsAt: women[0], name: "Sara", phone: "0699990000", audience: "women" } })
  assert.equal(right.status, 201)
})
```

- [ ] **Step 2: شغّل وتأكد من الفشل**

Run: `cd server && node --test test/booking.test.js`
Expected: FAIL.

- [ ] **Step 3: عدّل `computeSlots` في `server/src/lib/common.js`**

**أ) الـ imports.** أضف في أعلى الملف:
```js
import { toMinutes } from "./schedule.js"
import { categoryByValue } from "../catalog/categories.js"
```

**ب) احذف** السطر المحلي:
```js
const toMinutes = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m }
```

**ج) استبدل الدالة `computeSlots` كاملة بـ:**
```js
/**
 * Free start times (ISO strings) for `durationMinutes` on a given day (YYYY-MM-DD, Casablanca).
 * Hammams with a gender schedule need `audience` ("women" | "men").
 */
export async function computeSlots(business, durationMinutes, day, { audience } = {}) {
  const dayStart = DateTime.fromISO(day, { zone: config.timezone }).startOf("day")
  if (!dayStart.isValid) throw badRequest("invalid_day")
  const weekday = dayStart.weekday % 7 // luxon: Mon=1..Sun=7 → Sun=0
  const ranges = (business.hours || []).filter((h) => h.weekday === weekday)
  const schedule = business.extras?.genderSchedule ?? []
  const usesAudience = categoryByValue(business.category).features.includes("gender_schedule") && schedule.length > 0
  if (usesAudience && !["women", "men"].includes(audience)) throw badRequest("audience_required")
  const allowed = usesAudience ? schedule.filter((s) => s.weekday === weekday && (s.audience === audience || s.audience === "mixed")) : null
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
    for (let m = open; m + durationMinutes <= close; m += SLOT_STEP) {
      if (allowed && !allowed.some((a) => toMinutes(a.start) <= m && m + durationMinutes <= toMinutes(a.end))) continue
      const s = dayStart.plus({ minutes: m }), e = s.plus({ minutes: durationMinutes })
      if (s.toMillis() < earliest) continue
      const clash = busy.some((b) => b.startsAt.getTime() < e.toMillis() && b.endsAt.getTime() > s.toMillis())
      if (!clash) out.push(s.toUTC().toISO())
    }
  }
  return [...new Set(out)].sort()
}
```

- [ ] **Step 4: عدّل المواعيد والحجز في `server/src/routes/public.js`**

**أ) أضف دالة مساعدة** بعد `listActive`:
```js
/** Services of a business, in the requested order. 1–6 distinct ids, all from that business. */
async function servicesOf(businessId, ids) {
  const unique = [...new Set(ids)]
  if (!unique.length || unique.length > 6 || unique.length !== ids.length) throw badRequest("invalid_input")
  const list = await Service.find({ _id: { $in: unique.map(requireId) }, businessId }).lean()
  if (list.length !== unique.length) throw badRequest("invalid_input")
  return unique.map((id) => list.find((s) => String(s._id) === id))
}
const totalMinutes = (list) => list.reduce((n, s) => n + s.durationMinutes, 0)
```

**ب) استبدل مسار `GET /businesses/:id/slots` كاملاً بـ:**
```js
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
```

**ج) استبدل مسار `POST /businesses/:id/bookings` كاملاً بـ:**
```js
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
```

- [ ] **Step 5: شغّل الاختبارات**

Run: `cd server && npm test`
Expected: كل الملفات `pass`، و `fail 0`.

- [ ] **Step 6: Commit**

```bash
git add server/src/lib/common.js server/src/routes/public.js server/test/booking.test.js
git commit -m "feat(api): multi-service bookings and hammam women/men time slots

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: الكتالوج في الموقع + `ThemeScope` + الزخارف

**Files:**
- Create: `src/lib/catalog-api.ts`, `src/lib/business-types.ts`, `src/components/profile/ThemeScope.tsx`, `public/assets/themes/barber/pole.svg`, `public/assets/themes/barber/wood.svg`, `public/assets/themes/hammam/zellige.svg`

- [ ] **Step 1: أنشئ `src/lib/catalog-api.ts`**

```ts
import { useEffect, useState } from "react"
import { api } from "@/lib/api"

export type Lang = "ar" | "fr" | "en" | "es"
export type Label = Record<Lang, string>
export type ThemeColors = { background: string; surface: string; text: string; muted: string; primary: string; onPrimary: string; accent: string; border: string; success: string; warning: string; danger: string }
export type CategoryTheme = {
  mode: "light" | "dark"
  colors: { light: ThemeColors; dark: ThemeColors }
  fonts: { display: string; body: string; accent?: string }
  radius: number
  assets: { headerPattern?: string; background?: string; priceBoard: "chalkboard" | "menu" | "tiles" }
}
export type CategoryDef = {
  key: string; value: string; labels: Label; features: string[]; liveStates: string[]
  styleTags: { key: string; labels: Label }[]; amenities: string[]; theme: CategoryTheme
}
export type Catalog = { version: string; amenities: Record<string, Label>; categories: CategoryDef[]; default: CategoryDef }

let cache: Promise<Catalog> | null = null
export function loadCatalog(): Promise<Catalog> {
  cache ??= api<Catalog>("/api/catalog").catch((e) => { cache = null; throw e })
  return cache
}

/** The catalog, or null while loading / if the API is unreachable. */
export function useCatalog(): Catalog | null {
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  useEffect(() => { let on = true; loadCatalog().then((c) => on && setCatalog(c)).catch(() => {}); return () => { on = false } }, [])
  return catalog
}

export const categoryOf = (catalog: Catalog | null, value: string): CategoryDef | null =>
  catalog ? catalog.categories.find((c) => c.value === value) ?? catalog.default : null

export const labelOf = (l: Label | undefined, lang: string) => (l ? l[(lang.slice(0, 2) as Lang)] ?? l.ar : "")
```

- [ ] **Step 2: أنشئ `src/lib/business-types.ts`**

```ts
export type LiveState = "free" | "busy" | "closed" | "quiet" | "moderate" | "crowded" | "unknown"
export type Live = { state: LiveState; waiting: number; estimatedWaitMinutes: number | null; updatedAt: string | null; stale: boolean }
export type TodayStatus = { openNow: boolean; closesAt: string | null; nextOpen: { weekday: number; time: string } | null }
export type Audience = "women" | "men" | "mixed" | "private"
export type ScheduleRange = { weekday: number; start: string; end: string; audience: Audience }
export type BringItem = { label: string; available: boolean }
export type Extras = { chairs?: number; genderSchedule?: ScheduleRange[]; ritualSteps?: string[]; bringList?: BringItem[] }
export type Address = { line: string; district: string; lat: number | null; lng: number | null }
export type PublicBusiness = {
  id: string; name: string; category: string; city: string; bio: string; phone: string
  categoryKey: string; address: Address; amenities: string[]; extras: Extras
  todayStatus: TodayStatus; live: Live | null
  currentAudience: { now: Audience; until: string; next: Audience | null } | null
  cover?: string | null
}
export type Service = { id: string; name: string; price: number; durationMinutes: number }
export type Work = { id: string; title: string; caption: string; imageUrl: string; tags: string[] }

export const DAY_NAMES = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"]
```

- [ ] **Step 3: أنشئ `src/components/profile/ThemeScope.tsx`**

```tsx
import { useEffect, type CSSProperties, type ReactNode } from "react"
import type { CategoryTheme } from "@/lib/catalog-api"

/** "#RRGGBB" → "H S% L%" (the format our Tailwind tokens expect). */
function hsl(hex: string): string {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2
  let h = 0, s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4
    h *= 60
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

const loaded = new Set<string>()
function loadFont(family?: string) {
  if (!family || loaded.has(family)) return
  loaded.add(family)
  const link = document.createElement("link")
  link.rel = "stylesheet"
  link.href = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}:wght@400;600;700&display=swap`
  document.head.appendChild(link)
}

/** Applies a category theme to everything inside it (Tailwind tokens + fonts). */
export default function ThemeScope({ theme, children, className = "" }: { theme: CategoryTheme | null | undefined; children: ReactNode; className?: string }) {
  useEffect(() => { if (theme) { loadFont(theme.fonts.display); loadFont(theme.fonts.body); loadFont(theme.fonts.accent) } }, [theme])
  if (!theme) return <div className={`bg-background text-foreground ${className}`}>{children}</div>
  const c = theme.colors[theme.mode]
  const vars = {
    "--background": hsl(c.background), "--foreground": hsl(c.text),
    "--card": hsl(c.surface), "--card-foreground": hsl(c.text),
    "--popover": hsl(c.surface), "--popover-foreground": hsl(c.text),
    "--primary": hsl(c.primary), "--primary-foreground": hsl(c.onPrimary), "--ring": hsl(c.primary),
    "--muted": hsl(c.surface), "--muted-foreground": hsl(c.muted),
    "--accent": hsl(c.accent), "--border": hsl(c.border), "--input": hsl(c.border),
    "--destructive": hsl(c.danger), "--success": hsl(c.success),
    "--radius": `${theme.radius}px`,
    "--font-display": `'${theme.fonts.display}', 'IBM Plex Sans Arabic', sans-serif`,
    "--font-sans": `'${theme.fonts.body}', sans-serif`,
    "--font-accent": theme.fonts.accent ? `'${theme.fonts.accent}', monospace` : "inherit",
    "--status-warning": c.warning,
  } as CSSProperties
  return <div style={vars} data-theme-mode={theme.mode} className={`bg-background font-sans text-foreground ${className}`}>{children}</div>
}
```

- [ ] **Step 4: أنشئ زخارف SVG**

`public/assets/themes/barber/pole.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="12" viewBox="0 0 48 12"><rect width="48" height="12" fill="#F3E9DC"/><path d="M0 12 12 0h8L8 12zM24 12 36 0h8L32 12z" fill="#B8302F"/><path d="M12 12 24 0h4L16 12zM36 12 48 0v4l-8 8z" fill="#1F4E8C"/></svg>
```

`public/assets/themes/barber/wood.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240"><rect width="240" height="240" fill="#1B1410"/><g fill="none" stroke="#2A1F18" stroke-width="2" opacity=".7"><path d="M0 30c60-10 120 10 240 0M0 80c80 8 140-12 240 0M0 140c50-6 150 14 240 0M0 200c90 10 130-10 240 0"/></g></svg>
```

`public/assets/themes/hammam/zellige.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" fill="#F3EBDD"/><g fill="none" stroke="#2F6B5E" stroke-width="1.5" opacity=".35"><path d="M40 4l10 26 26 10-26 10-10 26-10-26L4 40l26-10z"/><circle cx="40" cy="40" r="8"/></g><g fill="#8C3B1E" opacity=".25"><circle cx="0" cy="0" r="5"/><circle cx="80" cy="0" r="5"/><circle cx="0" cy="80" r="5"/><circle cx="80" cy="80" r="5"/></g></svg>
```

- [ ] **Step 5: تحقق من الأنواع**

Run: `npx tsc -p tsconfig.app.json --noEmit && echo ok`
Expected: `ok`

- [ ] **Step 6: Commit**

```bash
git add src/lib/catalog-api.ts src/lib/business-types.ts src/components/profile/ThemeScope.tsx public/assets/themes
git commit -m "feat(web): catalog client, public business types, ThemeScope and theme patterns

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: عناصر البروفايل العامة (الرأس، الشارة، الأسعار، الأيقونات، المعرض)

**Files:**
- Create: `src/components/profile/LiveBadge.tsx`, `src/components/profile/ProfileHeader.tsx`, `src/components/profile/PriceBoard.tsx`, `src/components/profile/AmenityIcons.tsx`, `src/components/profile/PortfolioGallery.tsx`

- [ ] **Step 1: أنشئ `src/components/profile/LiveBadge.tsx`**

```tsx
import { useTranslation } from "react-i18next"
import type { Live } from "@/lib/business-types"

const TONE: Record<string, string> = {
  free: "bg-emerald-600 text-white", quiet: "bg-emerald-600 text-white",
  busy: "bg-amber-500 text-black", moderate: "bg-amber-500 text-black",
  crowded: "bg-red-600 text-white", closed: "bg-neutral-700 text-white",
}

/** Live status pill. Renders nothing when the status is unknown/stale. */
export default function LiveBadge({ live, className = "" }: { live: Live | null | undefined; className?: string }) {
  const { t } = useTranslation()
  if (!live || live.state === "unknown") return null
  const text =
    live.state === "free" ? t("فاضي دابا")
    : live.state === "busy" ? (live.waiting > 0 ? t("{{n}} فالانتظار ≈ {{m}} دقيقة", { n: live.waiting, m: live.estimatedWaitMinutes ?? 0 }) : t("مشغول دابا"))
    : live.state === "quiet" ? t("خاوي دابا")
    : live.state === "moderate" ? t("متوسط دابا")
    : live.state === "crowded" ? t("عامر دابا")
    : t("مسدود دابا")
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${TONE[live.state] ?? ""} ${className}`}>
    <span className="h-2 w-2 rounded-full bg-current opacity-80" aria-hidden />{text}
  </span>
}
```

- [ ] **Step 2: أنشئ `src/components/profile/ProfileHeader.tsx`**

```tsx
import { MapPin, MessageCircle, Navigation, Phone, Clock } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { CategoryDef } from "@/lib/catalog-api"
import { labelOf } from "@/lib/catalog-api"
import { DAY_NAMES, type PublicBusiness } from "@/lib/business-types"
import { waLink } from "@/lib/catalog"
import LiveBadge from "./LiveBadge"
import AmenityIcons from "./AmenityIcons"
import type { Catalog } from "@/lib/catalog-api"

export function directionsUrl(b: PublicBusiness): string {
  if (b.address.lat != null && b.address.lng != null) return `https://www.google.com/maps/dir/?api=1&destination=${b.address.lat},${b.address.lng}`
  const q = [b.address.line, b.address.district, b.city].filter(Boolean).join(", ")
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q || b.name)}`
}

export default function ProfileHeader({ business: b, category, catalog }: { business: PublicBusiness; category: CategoryDef | null; catalog: Catalog | null }) {
  const { t, i18n } = useTranslation()
  const pattern = category?.theme.assets.headerPattern
  const wa = waLink(b.phone, t("سلام، بغيت ناخد موعد عند {{name}}.", { name: b.name }))
  const ts = b.todayStatus
  const today = ts.openNow ? t("مفتوح حتى {{time}}", { time: ts.closesAt }) : ts.nextOpen ? t("مسدود · كيحل {{day}} {{time}}", { day: t(DAY_NAMES[ts.nextOpen.weekday]), time: ts.nextOpen.time }) : t("أوقات العمل غير محددة")
  return <header className="border-b border-border bg-card">
    {pattern && <div aria-hidden className="h-3 w-full" style={{ backgroundImage: `url(${pattern})`, backgroundRepeat: "repeat-x", backgroundSize: "auto 100%" }} />}
    <div className="mx-auto max-w-5xl px-5 py-10 sm:py-14">
      <p className="text-sm font-semibold text-primary">{category ? labelOf(category.labels, i18n.language) : t(b.category)}</p>
      <h1 className="mt-2 font-display text-4xl sm:text-6xl">{b.name}</h1>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <LiveBadge live={b.live} />
        <span className="inline-flex items-center gap-1"><Clock size={15} />{today}</span>
        <span className="inline-flex items-center gap-1"><MapPin size={15} />{[b.address.district, t(b.city)].filter(Boolean).join(" · ")}</span>
      </div>
      {b.address.line && <p className="mt-2 text-sm text-muted-foreground">{b.address.line}</p>}
      {b.bio && <p className="mt-5 max-w-2xl whitespace-pre-line leading-8">{b.bio}</p>}
      <AmenityIcons keys={b.amenities} catalog={catalog} className="mt-5" />
      <div className="mt-7 flex flex-wrap gap-3">
        <a href={directionsUrl(b)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-[var(--radius)] bg-primary px-5 py-3 font-semibold text-primary-foreground"><Navigation size={18} />{t("خذني ليه")}</a>
        {b.phone && <a href={`tel:${b.phone}`} className="inline-flex items-center gap-2 rounded-[var(--radius)] border border-border px-5 py-3 font-semibold"><Phone size={18} />{t("عيّط")}</a>}
        {wa && <a href={wa} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-[var(--radius)] border border-border px-5 py-3 font-semibold"><MessageCircle size={18} />{t("واتساب")}</a>}
      </div>
    </div>
  </header>
}
```

- [ ] **Step 3: أنشئ `src/components/profile/AmenityIcons.tsx`**

```tsx
import { Accessibility, Baby, Bath, Car, CreditCard, Lock, Snowflake, UserRound, Wifi, type LucideIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { labelOf, type Catalog } from "@/lib/catalog-api"

const ICONS: Record<string, LucideIcon> = {
  ac: Snowflake, wifi: Wifi, kids: Baby, card: CreditCard, parking: Car,
  accessible: Accessibility, towels: Bath, private_room: Lock, female_staff: UserRound,
}

export default function AmenityIcons({ keys, catalog, className = "" }: { keys: string[]; catalog: Catalog | null; className?: string }) {
  const { i18n } = useTranslation()
  if (!keys.length || !catalog) return null
  return <ul className={`flex flex-wrap gap-2 ${className}`}>{keys.map((k) => {
    const Icon = ICONS[k]
    return <li key={k} className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs">{Icon && <Icon size={14} aria-hidden />}{labelOf(catalog.amenities[k], i18n.language)}</li>
  })}</ul>
}
```

- [ ] **Step 4: أنشئ `src/components/profile/PriceBoard.tsx`**

```tsx
import { Clock } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { Service } from "@/lib/business-types"

/** Price list: chalkboard (barber), menu (most), tiles (nails). */
export default function PriceBoard({ services, variant }: { services: Service[]; variant: "chalkboard" | "menu" | "tiles" }) {
  const { t } = useTranslation()
  if (!services.length) return <p className="mt-4 text-sm text-muted-foreground">{t("الخدمات غادي تزاد قريباً.")}</p>
  if (variant === "chalkboard") {
    return <div className="mt-6 rounded-[var(--radius)] border-8 border-[#5A3E2B] bg-[#1F2A24] p-5 text-[#F1EFE6] shadow-inner" style={{ fontFamily: "var(--font-accent)" }}>
      <p className="mb-3 text-center text-lg tracking-widest">— {t("الأسعار")} —</p>
      <ul className="space-y-3">{services.map((s) => <li key={s.id}>
        <div className="flex items-baseline gap-2"><span className="font-sans">{s.name}</span><span className="flex-1 border-b border-dotted border-[#F1EFE6]/40" /><strong>{s.price} {t("درهم")}</strong></div>
        <p className="font-sans text-xs opacity-70">{s.durationMinutes} {t("دقيقة")}</p>
      </li>)}</ul>
    </div>
  }
  if (variant === "tiles") {
    return <ul className="mt-6 grid grid-cols-2 gap-3">{services.map((s) => <li key={s.id} className="rounded-[var(--radius)] border border-border bg-card p-4 text-center">
      <p className="font-semibold">{s.name}</p><p className="mt-2 font-display text-2xl text-primary">{s.price}</p><p className="text-xs text-muted-foreground">{t("درهم")} · {s.durationMinutes} {t("دقيقة")}</p>
    </li>)}</ul>
  }
  return <ul className="mt-6 divide-y divide-border overflow-hidden rounded-[var(--radius)] border border-border bg-card">{services.map((s) => <li key={s.id} className="flex items-center justify-between gap-3 p-4 text-sm">
    <span><span className="block font-semibold">{s.name}</span><span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Clock size={12} />{s.durationMinutes} {t("دقيقة")}</span></span>
    <strong>{s.price} {t("درهماً")}</strong>
  </li>)}</ul>
}
```

- [ ] **Step 5: أنشئ `src/components/profile/PortfolioGallery.tsx`**

```tsx
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { fileUrl } from "@/lib/api"
import { labelOf, type CategoryDef } from "@/lib/catalog-api"
import type { Work } from "@/lib/business-types"

export default function PortfolioGallery({ works, category }: { works: Work[]; category: CategoryDef | null }) {
  const { t, i18n } = useTranslation()
  const [tag, setTag] = useState("")
  const [open, setOpen] = useState<Work | null>(null)
  const used = useMemo(() => (category?.styleTags ?? []).filter((s) => works.some((w) => w.tags.includes(s.key))), [category, works])
  const shown = tag ? works.filter((w) => w.tags.includes(tag)) : works
  return <section>
    <h2 className="font-display text-3xl">{t("آخر الأعمال")}</h2>
    {used.length > 0 && <div className="mt-4 flex flex-wrap gap-2">
      <button onClick={() => setTag("")} className={`rounded-full border px-3 py-1 text-xs ${!tag ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{t("الكل")}</button>
      {used.map((s) => <button key={s.key} onClick={() => setTag(s.key)} className={`rounded-full border px-3 py-1 text-xs ${tag === s.key ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{labelOf(s.labels, i18n.language)}</button>)}
    </div>}
    {shown.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">{t("ما تنشرات حتى أعمال دابا.")}</p>
      : <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">{shown.map((w) => <button key={w.id} onClick={() => setOpen(w)} className="group overflow-hidden rounded-[var(--radius)] border border-border text-start">
        <img src={fileUrl(w.imageUrl)} alt={w.title} loading="lazy" className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        <span className="block truncate p-2 text-xs">{w.title}</span>
      </button>)}</div>}
    {open && <div role="dialog" aria-modal="true" onClick={() => setOpen(null)} className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
      <figure className="max-w-lg overflow-hidden rounded-[var(--radius)] bg-card" onClick={(e) => e.stopPropagation()}>
        <img src={fileUrl(open.imageUrl)} alt={open.title} className="max-h-[70vh] w-full object-contain" />
        <figcaption className="p-4"><strong>{open.title}</strong>{open.caption && <p className="mt-1 text-sm text-muted-foreground">{open.caption}</p>}</figcaption>
      </figure>
    </div>}
  </section>
}
```

- [ ] **Step 6: تحقق من الأنواع**

Run: `npx tsc -p tsconfig.app.json --noEmit && echo ok`
Expected: `ok`

- [ ] **Step 7: Commit**

```bash
git add src/components/profile
git commit -m "feat(web): profile header, live badge, price board, amenities, tagged gallery

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: "زيدني فالصف" وعناصر الحمام والحجز بعدة خدمات

**Files:**
- Create: `src/components/profile/WalkinQueue.tsx`, `src/components/profile/GenderScheduleBar.tsx`, `src/components/profile/RitualBuilder.tsx`, `src/components/profile/BringList.tsx`
- Modify: `src/components/BookingWidget.tsx`

- [ ] **Step 1: أنشئ `src/components/profile/WalkinQueue.tsx`**

```tsx
import { useCallback, useEffect, useState } from "react"
import { Users } from "lucide-react"
import { useTranslation } from "react-i18next"
import { api, errorText } from "@/lib/api"
import { isValidPhone } from "@/lib/catalog"

type Ticket = { id: string; token: string }
type Status = { status: "waiting" | "served" | "no_show" | "cancelled"; position: number | null; estimatedWaitMinutes: number | null }
const storeKey = (businessId: string) => `nl-queue-${businessId}`
const readTicket = (businessId: string): Ticket | null => { try { return JSON.parse(localStorage.getItem(storeKey(businessId)) ?? "null") } catch { return null } }
const writeTicket = (businessId: string, t: Ticket | null) => { try { t ? localStorage.setItem(storeKey(businessId), JSON.stringify(t)) : localStorage.removeItem(storeKey(businessId)) } catch { /* private mode */ } }

export default function WalkinQueue({ businessId, closed }: { businessId: string; closed: boolean }) {
  const { t } = useTranslation()
  const [ticket, setTicket] = useState<Ticket | null>(() => readTicket(businessId))
  const [status, setStatus] = useState<Status | null>(null)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [website, setWebsite] = useState("")
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState("")

  const refresh = useCallback(async (tk: Ticket) => {
    try {
      const s = await api<Status>(`/api/queue/${tk.id}?token=${encodeURIComponent(tk.token)}`)
      setStatus(s)
      if (s.status !== "waiting") { writeTicket(businessId, null); setTicket(null) }
    } catch { writeTicket(businessId, null); setTicket(null); setStatus(null) }
  }, [businessId])

  useEffect(() => {
    if (!ticket) return
    void refresh(ticket)
    const id = window.setInterval(() => void refresh(ticket), 30_000)
    return () => window.clearInterval(id)
  }, [ticket, refresh])

  const join = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValidPhone(phone)) { setMsg("رقم الهاتف ماشي صحيح (مثال: 0612345678).") ; return }
    setBusy(true); setMsg("")
    try {
      const r = await api<Ticket & { position: number; estimatedWaitMinutes: number }>(`/api/businesses/${businessId}/queue`, { body: { name, phone, ...(website ? { website } : {}) } })
      const tk = { id: r.id, token: r.token }
      writeTicket(businessId, tk); setTicket(tk)
      setStatus({ status: "waiting", position: r.position, estimatedWaitMinutes: r.estimatedWaitMinutes })
    } catch (err) { setMsg(errorText(err)) }
    finally { setBusy(false) }
  }

  const cancel = async () => {
    if (!ticket) return
    await api(`/api/queue/${ticket.id}/cancel`, { body: { token: ticket.token } }).catch(() => {})
    writeTicket(businessId, null); setTicket(null); setStatus(null)
  }

  return <section className="mt-8 rounded-[var(--radius)] border border-border bg-card p-5">
    <h2 className="flex items-center gap-2 font-display text-2xl"><Users size={20} className="text-primary" />{t("زيدني فالصف")}</h2>
    {ticket && status?.status === "waiting" ? <div className="mt-4 text-center">
      <p className="text-sm text-muted-foreground">{t("نتا فالصف")}</p>
      <p className="font-display text-6xl text-primary">{status.position}</p>
      <p className="mt-1 text-sm">{status.position === 1 ? t("نتا اللي جاي! سير للمحل.") : t("تقريباً {{m}} دقيقة", { m: status.estimatedWaitMinutes ?? 0 })}</p>
      <button onClick={() => void cancel()} className="mt-4 text-sm text-destructive">{t("خرجني من الصف")}</button>
    </div> : status && status.status !== "waiting" ? <p className="mt-4 text-sm">{status.status === "served" ? t("مرحبا بيك! وصلات نوبتك.") : t("خرجتي من الصف.")}</p>
    : closed ? <p className="mt-4 text-sm text-muted-foreground">{t("المحل مسدود دابا. الصف كيتحل غير ملي يكون مفتوح.")}</p>
    : <form onSubmit={(e) => void join(e)} className="mt-4 space-y-3 text-sm">
      <p className="text-muted-foreground">{t("ما تحتاجش تتسنى فالمحل: دير سميتك وغادي تشوف النوبة ديالك من هنا.")}</p>
      <input required minLength={2} maxLength={80} value={name} onChange={(e) => setName(e.target.value)} placeholder={t("اسمك")} autoComplete="name" className="w-full rounded-[var(--radius)] border border-border bg-background p-3" />
      <input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="06…" inputMode="tel" autoComplete="tel" className="w-full rounded-[var(--radius)] border border-border bg-background p-3" />
      <input tabIndex={-1} autoComplete="off" aria-hidden="true" value={website} onChange={(e) => setWebsite(e.target.value)} className="absolute -left-[9999px] h-0 w-0 opacity-0" />
      <button disabled={busy} className="w-full rounded-[var(--radius)] bg-primary px-5 py-3 font-semibold text-primary-foreground disabled:opacity-60">{t("زيدني فالصف")}</button>
      {msg && <p className="text-destructive">{t(msg)}</p>}
    </form>}
  </section>
}
```

- [ ] **Step 2: أنشئ `src/components/profile/GenderScheduleBar.tsx`**

```tsx
import { useTranslation } from "react-i18next"
import { DAY_NAMES, type Audience, type PublicBusiness } from "@/lib/business-types"

export const AUDIENCE_LABEL: Record<Audience, string> = { women: "👩 نساء", men: "👨 رجال", mixed: "👨‍👩‍👧 عائلي", private: "🔒 حمام خاص" }

export default function GenderScheduleBar({ business }: { business: PublicBusiness }) {
  const { t } = useTranslation()
  const sched = business.extras.genderSchedule ?? []
  if (!sched.length) return null
  const cur = business.currentAudience
  const days = [1, 2, 3, 4, 5, 6, 0].filter((d) => sched.some((s) => s.weekday === d))
  return <section className="border-b border-border bg-card">
    <div className="mx-auto max-w-5xl px-5 py-5">
      <p className="text-lg font-semibold">{cur
        ? <>{t("دابا:")} {t(AUDIENCE_LABEL[cur.now])} {t("حتى {{time}}", { time: cur.until })}{cur.next && <> · {t("من بعد:")} {t(AUDIENCE_LABEL[cur.next])}</>}</>
        : t("ما كاين حتى فترة دابا")}</p>
      <details className="mt-2 text-sm"><summary className="cursor-pointer text-primary">{t("جدول الأسبوع")}</summary>
        <table className="mt-3 w-full text-start"><tbody>{days.map((d) => <tr key={d} className="border-t border-border">
          <td className="py-2 pe-4 font-semibold">{t(DAY_NAMES[d])}</td>
          <td className="py-2">{sched.filter((s) => s.weekday === d).sort((a, b) => a.start.localeCompare(b.start)).map((s, i) => <span key={i} className="me-3 inline-block">{s.start}–{s.end} {t(AUDIENCE_LABEL[s.audience])}</span>)}</td>
        </tr>)}</tbody></table>
      </details>
    </div>
  </section>
}
```

- [ ] **Step 3: أنشئ `src/components/profile/RitualBuilder.tsx`**

```tsx
import { useState } from "react"
import { Sparkles } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { Service } from "@/lib/business-types"

/** Hammam "build your ritual": toggles steps, shows the total, hands the selection to the booking form. */
export default function RitualBuilder({ services, ritualSteps, onChoose }: { services: Service[]; ritualSteps: string[]; onChoose: (ids: string[]) => void }) {
  const { t } = useTranslation()
  const steps = ritualSteps.map((id) => services.find((s) => s.id === id)).filter((s): s is Service => !!s)
  const [picked, setPicked] = useState<string[]>(() => steps.slice(0, 1).map((s) => s.id))
  if (steps.length < 2) return null
  const chosen = steps.filter((s) => picked.includes(s.id))
  const total = chosen.reduce((n, s) => n + s.price, 0)
  const minutes = chosen.reduce((n, s) => n + s.durationMinutes, 0)
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  return <section className="mt-8 rounded-[var(--radius)] border border-border bg-card p-5">
    <h2 className="flex items-center gap-2 font-display text-2xl"><Sparkles size={20} className="text-primary" />{t("صاوب الطقس ديالك")}</h2>
    <ol className="mt-4 space-y-2">{steps.map((s, i) => <li key={s.id}>
      <label className={`flex cursor-pointer items-center justify-between gap-3 rounded-[var(--radius)] border p-3 text-sm ${picked.includes(s.id) ? "border-primary" : "border-border"}`}>
        <span className="flex items-center gap-3"><input type="checkbox" checked={picked.includes(s.id)} onChange={() => toggle(s.id)} className="accent-primary" /><span><span className="me-1 text-muted-foreground">{i + 1}.</span>{s.name}</span></span>
        <span className="text-muted-foreground">{s.durationMinutes} {t("دقيقة")} · <strong className="text-foreground">{s.price}</strong></span>
      </label>
    </li>)}</ol>
    <p className="mt-4 text-sm">{t("{{n}} مراحل · {{m}} دقيقة · {{p}} درهماً", { n: chosen.length, m: minutes, p: total })}</p>
    <button disabled={!chosen.length} onClick={() => { onChoose(chosen.map((s) => s.id)); document.getElementById("booking")?.scrollIntoView({ behavior: "smooth" }) }} className="mt-3 w-full rounded-[var(--radius)] bg-primary px-5 py-3 font-semibold text-primary-foreground disabled:opacity-50">{t("اختار الوقت")}</button>
  </section>
}
```

- [ ] **Step 4: أنشئ `src/components/profile/BringList.tsx`**

```tsx
import { Check } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { BringItem } from "@/lib/business-types"

export default function BringList({ items }: { items: BringItem[] }) {
  const { t } = useTranslation()
  if (!items.length) return null
  return <section className="mt-8 rounded-[var(--radius)] border border-border bg-card p-5">
    <h2 className="font-display text-2xl">{t("شنو تجيب معاك")}</h2>
    <ul className="mt-4 space-y-2 text-sm">{items.map((it, i) => <li key={i} className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2"><Check size={16} className="text-primary" />{it.label}</span>
      {it.available && <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">{t("متوفر عندنا")}</span>}
    </li>)}</ul>
  </section>
}
```

- [ ] **Step 5: استبدل `src/components/BookingWidget.tsx` بالكامل**

```tsx
import { useEffect, useMemo, useState } from "react"
import { CalendarCheck, CheckCircle2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { api, errorText, qs } from "@/lib/api"
import { isValidPhone } from "@/lib/catalog"
import type { Service } from "@/lib/business-types"

const TZ = "Africa/Casablanca"
const fmtTime = (iso: string) => new Intl.DateTimeFormat("fr-MA", { hour: "2-digit", minute: "2-digit", timeZone: TZ }).format(new Date(iso))
const dayKey = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d)

type Props = {
  businessId: string
  services: Service[]
  /** Services chosen elsewhere (hammam ritual). Overrides the single-service picker. */
  preset?: string[] | null
  onClearPreset?: () => void
  /** Hammam with a women/men schedule: the client must pick one. */
  needsAudience?: boolean
}

export default function BookingWidget({ businessId, services, preset, onClearPreset, needsAudience = false }: Props) {
  const { t, i18n } = useTranslation()
  const [single, setSingle] = useState(services[0]?.id ?? "")
  const [audience, setAudience] = useState<"" | "women" | "men">("")
  const [day, setDay] = useState(0)
  const [slots, setSlots] = useState<string[]>([])
  const [slot, setSlot] = useState("")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [website, setWebsite] = useState("")
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState("")
  const [done, setDone] = useState(false)
  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => new Date(Date.now() + i * 86400_000)), [])
  const serviceIds = useMemo(() => (preset?.length ? preset : single ? [single] : []), [preset, single])
  const chosen = serviceIds.map((id) => services.find((s) => s.id === id)).filter((s): s is Service => !!s)
  const ready = serviceIds.length > 0 && (!needsAudience || audience !== "")

  useEffect(() => {
    if (!ready) { setSlots([]); return }
    let active = true
    setSlot(""); setSlots([])
    api<{ slots: string[] }>(`/api/businesses/${businessId}/slots?${qs({ services: serviceIds.join(","), day: dayKey(days[day]), audience: needsAudience ? audience : undefined })}`)
      .then((r) => { if (active) setSlots(r.slots) }).catch(() => {})
    return () => { active = false }
  }, [businessId, serviceIds, day, days, done, audience, needsAudience, ready])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!slot) { setMsg("اختار ساعة من الساعات المتاحة."); return }
    if (!isValidPhone(phone)) { setMsg("رقم الهاتف ماشي صحيح (مثال: 0612345678)."); return }
    setBusy(true); setMsg("")
    try {
      await api(`/api/businesses/${businessId}/bookings`, { body: { serviceIds, startsAt: slot, name, phone, ...(needsAudience ? { audience } : {}), ...(website ? { website } : {}) } })
      setDone(true); setName(""); setPhone(""); setSlot("")
    } catch (err) { setMsg(errorText(err, "هاد الوقت ما بقاش متاح أو المعلومات ناقصة. جرّب وقت آخر.")) }
    finally { setBusy(false) }
  }

  if (services.length === 0) return null
  const field = "w-full rounded-[var(--radius)] border border-border bg-background p-3"
  return <section id="booking" className="mt-8 rounded-[var(--radius)] border border-border bg-card p-5">
    <h2 className="flex items-center gap-2 font-display text-2xl"><CalendarCheck size={20} className="text-primary" />{t("احجز موعدك")}</h2>
    {done && <p role="status" className="mt-4 flex items-start gap-2 rounded-[var(--radius)] bg-muted p-3 text-sm"><CheckCircle2 size={18} className="mt-0.5 shrink-0 text-primary" />{t("توصل الطلب ديالك. المهني غادي يأكد ليك الموعد.")}</p>}
    <form onSubmit={(e) => void submit(e)} className="mt-4 space-y-3 text-sm">
      {preset?.length ? <div className="rounded-[var(--radius)] border border-primary p-3">
        <p className="font-semibold">{chosen.map((s) => s.name).join(" + ")}</p>
        <p className="text-muted-foreground">{chosen.reduce((n, s) => n + s.durationMinutes, 0)} {t("دقيقة")} · {chosen.reduce((n, s) => n + s.price, 0)} {t("درهماً")}</p>
        {onClearPreset && <button type="button" onClick={onClearPreset} className="mt-1 text-xs text-primary">{t("بدّل الخدمة")}</button>}
      </div> : <select value={single} onChange={(e) => { setSingle(e.target.value); setDone(false) }} className={field}>{services.map((s) => <option key={s.id} value={s.id}>{s.name} — {s.price} {t("درهماً")} · {s.durationMinutes} {t("دقيقة")}</option>)}</select>}
      {needsAudience && <div className="grid grid-cols-2 gap-2">{(["women", "men"] as const).map((a) => <button type="button" key={a} onClick={() => setAudience(a)} className={`rounded-[var(--radius)] border p-3 ${audience === a ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"}`}>{a === "women" ? t("👩 نساء") : t("👨 رجال")}</button>)}</div>}
      <div className="flex gap-2 overflow-x-auto pb-1">{days.map((d, i) => <button type="button" key={i} onClick={() => { setDay(i); setDone(false) }} className={`min-w-16 rounded-[var(--radius)] border p-2 text-center text-xs ${i === day ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"}`}><span className="block">{d.toLocaleDateString(i18n.language || "ar", { weekday: "short", timeZone: TZ })}</span><strong className="text-base">{d.toLocaleDateString("en", { day: "numeric", timeZone: TZ })}</strong></button>)}</div>
      {!ready ? <p className="text-muted-foreground">{t("اختار نساء ولا رجال باش تبان الأوقات.")}</p>
        : slots.length === 0 ? <p className="text-muted-foreground">{t("ما كاين حتى وقت متاح هاد النهار.")}</p>
        : <div className="grid grid-cols-4 gap-2">{slots.map((s) => <button type="button" key={s} onClick={() => setSlot(s)} className={`rounded-[var(--radius)] border p-2 ${slot === s ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary"}`}>{fmtTime(s)}</button>)}</div>}
      <input required minLength={2} maxLength={80} value={name} onChange={(e) => setName(e.target.value)} placeholder={t("اسمك")} autoComplete="name" className={field} />
      <input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="06…" inputMode="tel" autoComplete="tel" className={field} />
      <input tabIndex={-1} autoComplete="off" aria-hidden="true" value={website} onChange={(e) => setWebsite(e.target.value)} className="absolute -left-[9999px] h-0 w-0 opacity-0" />
      <p className="rounded-[var(--radius)] border-s-2 border-primary bg-muted p-3 text-xs leading-5">{t("الدفع كاش فالمحل بعد الخدمة. ما كاين حتى خلاص مسبق.")}</p>
      <button disabled={busy} className="w-full rounded-[var(--radius)] bg-primary px-5 py-3 font-semibold text-primary-foreground disabled:opacity-60">{t("تأكيد الحجز")}</button>
      {msg && <p className="text-destructive">{t(msg)}</p>}
    </form>
  </section>
}
```

- [ ] **Step 6: تحقق من الأنواع**

Run: `npx tsc -p tsconfig.app.json --noEmit && echo ok`
Expected: `ok`

- [ ] **Step 7: Commit**

```bash
git add src/components/profile src/components/BookingWidget.tsx
git commit -m "feat(web): walk-in queue, hammam schedule bar, ritual builder, bring list, multi-service booking

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: تركيب صفحة البروفايل حسب الصنف

**Files:**
- Modify: `src/pages/BusinessProfile.tsx` (استبدال كامل)

- [ ] **Step 1: استبدل `src/pages/BusinessProfile.tsx`**

```tsx
import { useCallback, useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { api } from "@/lib/api"
import { categoryOf, useCatalog } from "@/lib/catalog-api"
import type { PublicBusiness, Service, Work } from "@/lib/business-types"
import BookingWidget from "@/components/BookingWidget"
import ThemeScope from "@/components/profile/ThemeScope"
import ProfileHeader from "@/components/profile/ProfileHeader"
import PriceBoard from "@/components/profile/PriceBoard"
import PortfolioGallery from "@/components/profile/PortfolioGallery"
import WalkinQueue from "@/components/profile/WalkinQueue"
import GenderScheduleBar from "@/components/profile/GenderScheduleBar"
import RitualBuilder from "@/components/profile/RitualBuilder"
import BringList from "@/components/profile/BringList"

type Profile = { business: PublicBusiness; services: Service[]; works: Work[] }

export default function BusinessProfile() {
  const { t } = useTranslation()
  const { id } = useParams()
  const catalog = useCatalog()
  const [data, setData] = useState<Profile | null>(null)
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading")
  const [preset, setPreset] = useState<string[] | null>(null)

  const load = useCallback(async () => {
    try { setData(await api<Profile>(`/api/businesses/${encodeURIComponent(id ?? "")}`)); setState("ready") }
    catch { setState((s) => (s === "ready" ? s : "missing")) }
  }, [id])

  useEffect(() => { setState("loading"); void load() }, [load])
  // Live status changes during the day: refresh every minute while the page is open.
  useEffect(() => { const timer = window.setInterval(() => void load(), 60_000); return () => window.clearInterval(timer) }, [load])
  useEffect(() => { if (data) document.title = `${data.business.name} — ${t("نيولوك")}` }, [data, t])

  if (state === "loading") return <main className="grid min-h-screen place-items-center bg-background text-muted-foreground">{t("كنحملو البروفايل...")}</main>
  if (state === "missing" || !data) return <main className="grid min-h-screen place-items-center bg-background px-5 text-center"><div><h1 className="text-3xl">{t("هاد البروفايل ما كايناش")}</h1><a href="/" className="mt-5 inline-block text-primary">{t("الرجوع للصفحة الرئيسية")}</a></div></main>

  const { business: b, services, works } = data
  const category = categoryOf(catalog, b.category)
  const has = (f: string) => !!category?.features.includes(f)
  const bg = category?.theme.assets.background

  return <ThemeScope theme={category?.theme} className="min-h-screen">
    <div dir="rtl" style={bg ? { backgroundImage: `url(${bg})`, backgroundSize: "240px" } : undefined}>
      <nav className="border-b border-border bg-background/90 backdrop-blur"><div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5"><a href="/" className="font-display text-2xl font-bold">{t("نيولوك")}</a><a href="/#smart-search" className="text-sm text-primary">{t("بحث عن مهني")}</a></div></nav>
      <ProfileHeader business={b} category={category} catalog={catalog} />
      {has("gender_schedule") && <GenderScheduleBar business={b} />}
      <main className="mx-auto grid max-w-5xl gap-12 bg-background/95 px-5 py-12 lg:grid-cols-[1fr_340px]">
        <PortfolioGallery works={works} category={category} />
        <aside>
          <h2 className="font-display text-3xl">{t("الخدمات والأسعار")}</h2>
          <PriceBoard services={services} variant={category?.theme.assets.priceBoard ?? "menu"} />
          {has("walkin_queue") && <WalkinQueue businessId={b.id} closed={b.live?.state === "closed"} />}
          {has("ritual_builder") && <RitualBuilder services={services} ritualSteps={b.extras.ritualSteps ?? []} onChoose={setPreset} />}
          {has("bring_list") && <BringList items={b.extras.bringList ?? []} />}
          <BookingWidget businessId={b.id} services={services} preset={preset} onClearPreset={() => setPreset(null)} needsAudience={has("gender_schedule") && (b.extras.genderSchedule?.length ?? 0) > 0} />
        </aside>
      </main>
    </div>
  </ThemeScope>
}
```

- [ ] **Step 2: تحقق من البناء**

Run: `npm run build 2>&1 | grep -E "error|✓ built"`
Expected: `✓ built`

- [ ] **Step 3: تحقق يدوي**

1. شغّل `npm run dev:api` (مع `server/.env` محلي يشير إلى قاعدة اختبار) ثم `npm run dev`.
2. افتح `http://localhost:5173/b/<id>` لحلاق، وتأكد من:
   - شريط عمود الحلاق
   - الخلفية الداكنة
   - لوح الطباشير
   - "زيدني فالصف"
3. افتح بروفايل حمام، وتأكد من:
   - الزليج
   - شريط النساء/الرجال
   - الطقس
   - "شنو تجيب معاك"
   - زرّا نساء/رجال في الحجز

- [ ] **Step 4: Commit**

```bash
git add src/pages/BusinessProfile.tsx
git commit -m "feat(web): category-themed business profile composed from feature components

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 13: الشارة الحية في البطاقات و"غير اللي فاضيين دابا"

**Files:**
- Modify: `src/components/sections/SmartSearch.tsx`, `src/components/sections/BeautyMarketplace.tsx`

- [ ] **Step 1: `SmartSearch.tsx`**

**أ) الـ imports.** أضف:
```tsx
import LiveBadge from "@/components/profile/LiveBadge"
import type { Live } from "@/lib/business-types"
```

**ب) النوع `Result`.** غيّره إلى:
```tsx
type Result = { id: string; name: string; category: string; city: string; phone: string; service: string; price: number; live: Live | null }
```

**ج) الحالة.** بعد `const [budget, setBudget] = useState("")` أضف:
```tsx
  const [availableNow, setAvailableNow] = useState(false)
```

**د) الطلب.** في `search`، غيّر سطر الطلب الأول إلى:
```tsx
      const r = await api<{ results: Result[] }>(`/api/search?${qs({ city, category, keyword, budget: max, availableNow: availableNow ? 1 : undefined })}`)
```

**هـ) الخانة.** في النموذج، قبل زر البحث أضف:
```tsx
        <label className="flex items-center gap-2 text-sm sm:col-span-2 lg:col-span-4"><input type="checkbox" checked={availableNow} onChange={(e) => setAvailableNow(e.target.checked)} className="h-4 w-4 accent-primary" />{t("غير اللي فاضيين دابا")}</label>
```

**و) البطاقة.** في الدالة `card`، بعد `<p className="text-xs font-semibold text-primary">{t(r.category)}</p>` أضف:
```tsx
<LiveBadge live={r.live} className="mt-2" />
```

- [ ] **Step 2: `BeautyMarketplace.tsx`**

**أ) الـ imports.** أضف:
```tsx
import LiveBadge from "@/components/profile/LiveBadge"
import type { Live } from "@/lib/business-types"
```

**ب) النوع.** أضف إلى `type Business` الحقل:
```tsx
  live: Live | null
```

**ج) البطاقة.** بعد سطر `<p className="text-xs font-semibold text-primary">{t(business.category)}</p>` في البطاقة أضف:
```tsx
<LiveBadge live={business.live} className="mt-2" />
```

- [ ] **Step 3: تحقق من البناء**

Run: `npm run build 2>&1 | grep -E "error|✓ built"`
Expected: `✓ built`

- [ ] **Step 4: Commit**

```bash
git add src/components/sections/SmartSearch.tsx src/components/sections/BeautyMarketplace.tsx
git commit -m "feat(web): live badges on cards and 'available now' search filter

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 14: أدوات المهني (الحالة الحية، الطابور، الإعدادات الإضافية، الوسوم)

**Files:**
- Create: `src/components/pro/LiveControls.tsx`, `src/components/pro/QueuePanel.tsx`, `src/components/pro/ProfileExtrasForm.tsx`
- Modify: `src/pages/ProStudio.tsx`

- [ ] **Step 1: أنشئ `src/components/pro/LiveControls.tsx`**

```tsx
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { api, errorText } from "@/lib/api"
import type { Live } from "@/lib/business-types"
import LiveBadge from "@/components/profile/LiveBadge"

const LABELS: Record<string, string> = {
  free: "🟢 فاضي دابا", busy: "🟡 مشغول", closed: "🔴 مسدود",
  quiet: "🟢 خاوي", moderate: "🟡 متوسط", crowded: "🔴 عامر",
}

export default function LiveControls({ states, initial }: { states: string[]; initial: Live | null }) {
  const { t } = useTranslation()
  const [live, setLive] = useState<Live | null>(initial)
  const [busy, setBusy] = useState("")
  const [msg, setMsg] = useState("")
  const set = async (state: string) => {
    setBusy(state); setMsg("")
    try { setLive((await api<{ live: Live }>("/api/me/live", { method: "PATCH", body: { state } })).live) }
    catch (e) { setMsg(errorText(e)) }
    finally { setBusy("") }
  }
  return <section className="mt-8 border border-border bg-card p-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-2xl">{t("الحالة دابا")}</h2><LiveBadge live={live} /></div>
    <p className="mt-2 text-sm text-muted-foreground">{t("الزبناء كيشوفو هاد الحالة فالبروفايل والبحث. كتختفي بوحدها إلا ما بدلتيهاش 3 ساعات.")}</p>
    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{states.map((s) => <button key={s} disabled={!!busy} onClick={() => void set(s)} className={`min-h-16 border p-4 text-lg font-semibold disabled:opacity-60 ${live?.state === s ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"}`}>{t(LABELS[s] ?? s)}</button>)}</div>
    {msg && <p className="mt-2 text-sm text-destructive">{t(msg)}</p>}
  </section>
}
```

- [ ] **Step 2: أنشئ `src/components/pro/QueuePanel.tsx`**

```tsx
import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { api } from "@/lib/api"

type Entry = { id: string; name: string; phone: string; createdAt: string }
const time = (iso: string) => new Intl.DateTimeFormat("fr-MA", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Casablanca" }).format(new Date(iso))

export default function QueuePanel() {
  const { t } = useTranslation()
  const [entries, setEntries] = useState<Entry[]>([])
  const load = useCallback(async () => setEntries((await api<{ entries: Entry[] }>("/api/me/queue")).entries), [])
  useEffect(() => { void load().catch(() => {}); const id = window.setInterval(() => void load().catch(() => {}), 20_000); return () => window.clearInterval(id) }, [load])
  const act = async (id: string, action: "serve" | "no-show") => { await api(`/api/me/queue/${id}/${action}`, { method: "POST" }).catch(() => {}); void load() }
  const clear = async () => { if (window.confirm(t("تفرغ الصف كامل؟"))) { await api("/api/me/queue/clear", { method: "POST" }).catch(() => {}); void load() } }
  return <section className="mt-8 border border-border bg-card p-6">
    <div className="flex items-center justify-between"><h2 className="text-2xl">{t("الصف")} ({entries.length})</h2>{entries.length > 0 && <button onClick={() => void clear()} className="text-sm text-destructive">{t("فرّغ الصف")}</button>}</div>
    {entries.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">{t("ما كاين حتى واحد فالصف.")}</p>
      : <ol className="mt-4 divide-y divide-border">{entries.map((e, i) => <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
        <span><strong className="me-2 text-primary">{i + 1}</strong>{e.name} <a href={`tel:${e.phone}`} dir="ltr" className="ms-2 text-xs text-muted-foreground">{e.phone}</a> <span className="ms-2 text-xs text-muted-foreground">{time(e.createdAt)}</span></span>
        <span className="flex gap-2"><button onClick={() => void act(e.id, "serve")} className="bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">{t("دخل")}</button><button onClick={() => void act(e.id, "no-show")} className="border border-border px-4 py-2 text-sm">{t("ما جاش")}</button></span>
      </li>)}</ol>}
  </section>
}
```

- [ ] **Step 3: أنشئ `src/components/pro/ProfileExtrasForm.tsx`**

```tsx
import { useState } from "react"
import { ArrowDown, ArrowUp, LocateFixed, Plus, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { api, errorText } from "@/lib/api"
import { labelOf, type CategoryDef, type Catalog } from "@/lib/catalog-api"
import { DAY_NAMES, type Address, type Audience, type BringItem, type Extras, type ScheduleRange, type Service } from "@/lib/business-types"
import { AUDIENCE_LABEL } from "@/components/profile/GenderScheduleBar"

export type ProBusiness = { name: string; category: string; city: string; bio: string; phone: string; published: boolean; address?: Address; amenities?: string[]; extras?: Extras }

export default function ProfileExtrasForm({ business, services, category, catalog, onSaved }: { business: ProBusiness; services: Service[]; category: CategoryDef; catalog: Catalog; onSaved: () => void }) {
  const { t, i18n } = useTranslation()
  const [address, setAddress] = useState<Address>(business.address ?? { line: "", district: "", lat: null, lng: null })
  const [amenities, setAmenities] = useState<string[]>(business.amenities ?? [])
  const [chairs, setChairs] = useState(business.extras?.chairs ?? 1)
  const [schedule, setSchedule] = useState<ScheduleRange[]>(business.extras?.genderSchedule ?? [])
  const [ritual, setRitual] = useState<string[]>(business.extras?.ritualSteps ?? [])
  const [bring, setBring] = useState<BringItem[]>(business.extras?.bringList ?? [])
  const [msg, setMsg] = useState("")
  const isBarber = category.key === "barber", isHammam = category.key === "hammam"
  const field = "border border-border bg-background p-2 text-sm"

  const locate = () => navigator.geolocation?.getCurrentPosition(
    (p) => setAddress((a) => ({ ...a, lat: Number(p.coords.latitude.toFixed(6)), lng: Number(p.coords.longitude.toFixed(6)) })),
    () => setMsg("ما قدرناش نجيبو الموقع. سمح للمتصفح باستعمال الموقع."),
  )
  const move = (i: number, d: -1 | 1) => setRitual((r) => { const n = [...r]; const j = i + d; if (j < 0 || j >= n.length) return r; [n[i], n[j]] = [n[j], n[i]]; return n })

  const save = async () => {
    setMsg("")
    const extras = isBarber ? { chairs } : isHammam ? { genderSchedule: schedule, ritualSteps: ritual, bringList: bring } : {}
    const { name, category: cat, city, bio, phone, published } = business
    try {
      await api("/api/me/business", { method: "PUT", body: { name, category: cat, city, bio, phone, published, address: { line: address.line, district: address.district, lat: address.lat, lng: address.lng }, amenities, extras } })
      setMsg("تحفظات المعلومات."); onSaved()
    } catch (e) { setMsg(errorText(e, (e as { code?: string })?.code === "schedule_outside_hours" ? "جدول النساء/الرجال خاصو يكون داخل أوقات العمل." : "تأكد من المعلومات اللي دخلتي.")) }
  }

  return <section className="mt-8 border border-border bg-card p-6">
    <h2 className="text-2xl">{t("معلومات للزبناء")}</h2>
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <label className="text-sm">{t("العنوان")}<input value={address.line} maxLength={200} onChange={(e) => setAddress({ ...address, line: e.target.value })} className={`${field} mt-1 w-full`} /></label>
      <label className="text-sm">{t("الحي")}<input value={address.district} maxLength={80} onChange={(e) => setAddress({ ...address, district: e.target.value })} className={`${field} mt-1 w-full`} /></label>
    </div>
    <button type="button" onClick={locate} className="mt-2 inline-flex items-center gap-2 text-sm text-primary"><LocateFixed size={16} />{address.lat != null ? t("الموقع محدد ✓ (عاود)") : t("حدد الموقع ديالي (أنا فالمحل)")}</button>

    <h3 className="mt-6 font-semibold">{t("شنو كاين عندك")}</h3>
    <div className="mt-2 flex flex-wrap gap-2">{category.amenities.map((a) => <label key={a} className={`cursor-pointer border px-3 py-1 text-sm ${amenities.includes(a) ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}><input type="checkbox" className="sr-only" checked={amenities.includes(a)} onChange={() => setAmenities((p) => (p.includes(a) ? p.filter((x) => x !== a) : [...p, a]))} />{labelOf(catalog.amenities[a], i18n.language)}</label>)}</div>

    {isBarber && <label className="mt-6 block text-sm">{t("عدد الكراسي")}<input type="number" min={1} max={20} value={chairs} onChange={(e) => setChairs(Math.max(1, Math.min(20, Number(e.target.value) || 1)))} className={`${field} ms-3 w-20`} /></label>}

    {isHammam && <>
      <h3 className="mt-6 font-semibold">{t("أوقات النساء والرجال")}</h3>
      <ul className="mt-2 space-y-2">{schedule.map((s, i) => <li key={i} className="flex flex-wrap items-center gap-2 text-sm">
        <select value={s.weekday} onChange={(e) => setSchedule((p) => p.map((x, j) => (j === i ? { ...x, weekday: Number(e.target.value) } : x)))} className={field}>{DAY_NAMES.map((d, k) => <option key={k} value={k}>{t(d)}</option>)}</select>
        <input type="time" value={s.start} onChange={(e) => setSchedule((p) => p.map((x, j) => (j === i ? { ...x, start: e.target.value } : x)))} className={field} />
        <span>→</span>
        <input type="time" value={s.end} onChange={(e) => setSchedule((p) => p.map((x, j) => (j === i ? { ...x, end: e.target.value } : x)))} className={field} />
        <select value={s.audience} onChange={(e) => setSchedule((p) => p.map((x, j) => (j === i ? { ...x, audience: e.target.value as Audience } : x)))} className={field}>{(Object.keys(AUDIENCE_LABEL) as Audience[]).map((a) => <option key={a} value={a}>{t(AUDIENCE_LABEL[a])}</option>)}</select>
        <button type="button" onClick={() => setSchedule((p) => p.filter((_, j) => j !== i))} aria-label={t("حذف")} className="text-destructive"><X size={16} /></button>
      </li>)}</ul>
      <button type="button" onClick={() => setSchedule((p) => [...p, { weekday: 1, start: "08:00", end: "14:00", audience: "women" }])} className="mt-2 inline-flex items-center gap-1 text-sm text-primary"><Plus size={14} />{t("زيد فترة")}</button>

      <h3 className="mt-6 font-semibold">{t("مراحل الطقس (بالترتيب)")}</h3>
      <ul className="mt-2 space-y-1 text-sm">{services.map((s) => {
        const i = ritual.indexOf(s.id)
        return <li key={s.id} className="flex items-center gap-2">
          <input type="checkbox" checked={i >= 0} onChange={() => setRitual((r) => (r.includes(s.id) ? r.filter((x) => x !== s.id) : [...r, s.id]))} className="accent-primary" />
          <span className="flex-1">{i >= 0 && <strong className="me-1 text-primary">{i + 1}.</strong>}{s.name}</span>
          {i >= 0 && <><button type="button" onClick={() => move(i, -1)} aria-label={t("فوق")}><ArrowUp size={14} /></button><button type="button" onClick={() => move(i, 1)} aria-label={t("تحت")}><ArrowDown size={14} /></button></>}
        </li>
      })}</ul>

      <h3 className="mt-6 font-semibold">{t("شنو يجيب الزبون معاه")}</h3>
      <ul className="mt-2 space-y-2">{bring.map((b, i) => <li key={i} className="flex items-center gap-2 text-sm">
        <input value={b.label} maxLength={40} onChange={(e) => setBring((p) => p.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} className={`${field} flex-1`} />
        <label className="flex items-center gap-1"><input type="checkbox" checked={b.available} onChange={(e) => setBring((p) => p.map((x, j) => (j === i ? { ...x, available: e.target.checked } : x)))} />{t("متوفر عندنا")}</label>
        <button type="button" onClick={() => setBring((p) => p.filter((_, j) => j !== i))} aria-label={t("حذف")} className="text-destructive"><X size={16} /></button>
      </li>)}</ul>
      {bring.length < 15 && <button type="button" onClick={() => setBring((p) => [...p, { label: "", available: false }])} className="mt-2 inline-flex items-center gap-1 text-sm text-primary"><Plus size={14} />{t("زيد حاجة")}</button>}
    </>}

    <button type="button" onClick={() => void save()} className="mt-6 block bg-primary px-5 py-3 font-semibold text-primary-foreground">{t("حفظ")}</button>
    {msg && <p role="status" className="mt-2 text-sm">{t(msg)}</p>}
  </section>
}
```

- [ ] **Step 4: ادمج الأدوات في `src/pages/ProStudio.tsx`**

**أ) الـ imports.** أضف:
```tsx
import { categoryOf, labelOf, useCatalog } from "@/lib/catalog-api"
import type { Live, Address, Extras } from "@/lib/business-types"
import LiveControls from "@/components/pro/LiveControls"
import QueuePanel from "@/components/pro/QueuePanel"
import ProfileExtrasForm from "@/components/pro/ProfileExtrasForm"
```

**ب) الأنواع.** غيّر `type Business` و `type Work` إلى:
```tsx
type Business = { id: string; name: string; category: string; city: string; bio: string; phone: string; published: boolean; hours: Hour[]; address?: Address; amenities?: string[]; extras?: Extras; live?: Live | null }
type Work = { id: string; title: string; caption: string; imageUrl: string; tags: string[] }
```

**ج) الحالة.** بعد `const { user, ready } = useAuth()` أضف:
```tsx
  const catalog = useCatalog()
  const [postTags, setPostTags] = useState<string[]>([])
```

**د) رفع صورة بوسوم.** في `addPortfolio`، بعد السطر `form.append("title", postTitle); form.append("caption", postCaption)` أضف:
```tsx
      form.append("tags", postTags.join(","))
```
وفي نجاح الرفع، بعد `setFile(null)` أضف:
```tsx
setPostTags([])
```

**هـ) تبديل وسوم صورة موجودة.** أضف هذه الدالة قبل `const field = ...`:
```tsx
  const toggleWorkTag = async (w: Work, tag: string) => {
    const tags = w.tags.includes(tag) ? w.tags.filter((x) => x !== tag) : [...w.tags, tag]
    try { const r = await api<{ work: Work }>(`/api/me/portfolio/${w.id}`, { method: "PATCH", body: { tags } }); setPortfolio((p) => p.map((x) => (x.id === w.id ? r.work : x))) }
    catch (e) { setNotice(errorText(e)) }
  }
  const category = business ? categoryOf(catalog, business.category) : null
```

**و) اختيار الوسوم في نموذج الرفع.** قبل زر "نشر العمل" أضف:
```tsx
{(category?.styleTags.length ?? 0) > 0 && <div className="flex flex-wrap gap-2">{category!.styleTags.map((s) => <button type="button" key={s.key} onClick={() => setPostTags((p) => (p.includes(s.key) ? p.filter((x) => x !== s.key) : [...p, s.key]))} className={`border px-3 py-1 text-xs ${postTags.includes(s.key) ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{labelOf(s.labels, "ar")}</button>)}</div>}
```

**ز) الوسوم تحت كل صورة.** في كل بطاقة عمل، بعد الـ `div` الذي فيه العنوان وزر الحذف، أضف:
```tsx
{(category?.styleTags.length ?? 0) > 0 && <div className="flex flex-wrap gap-1 px-2 pb-2">{category!.styleTags.map((s) => <button key={s.key} onClick={() => void toggleWorkTag(item, s.key)} className={`border px-2 py-0.5 text-[10px] ${item.tags.includes(s.key) ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{labelOf(s.labels, "ar")}</button>)}</div>}
```

**ح) الأدوات الجديدة.** مباشرة قبل `{business && <ProBookings ... />}` أضف:
```tsx
        {business && category && category.liveStates.length > 0 && <LiveControls states={category.liveStates} initial={business.live ?? null} />}
        {business && category?.features.includes("walkin_queue") && <QueuePanel />}
        {business && category && catalog && <ProfileExtrasForm business={business} services={services} category={category} catalog={catalog} onSaved={() => void load()} />}
```

- [ ] **Step 5: تحقق من البناء**

Run: `npm run build 2>&1 | grep -E "error|✓ built"`
Expected: `✓ built`

- [ ] **Step 6: تحقق يدوي** (الموقع المحلي مع API محلي)

1. **حساب حلاق:**
   - ضع عدد الكراسي 2 واحفظ.
   - اضغط "فاضي دابا".
   - من نافذة خاصة اضغط "زيدني فالصف".
   - تأكد أن الاسم يظهر في "الصف".
2. **حساب حمام:**
   - أضف فترة نساء داخل أوقات العمل.
   - رتّب مرحلتين في الطقس، وأضف "صابون بلدي ✓ متوفر".
   - احفظ، وتأكد أن البروفايل يعرضها.

- [ ] **Step 7: Commit**

```bash
git add src/components/pro src/pages/ProStudio.tsx
git commit -m "feat(web): pro tools for live status, walk-in queue, address/amenities/extras and photo tags

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 15: الترجمات

**Files:**
- Modify: `src/locales/fr.json`, `src/locales/en.json`, `src/locales/es.json`

- [ ] **Step 1: أضف الترجمات بسكربت مؤقت**

```bash
node --input-type=module -e '
import fs from "node:fs"
const T = {
  "فاضي دابا": ["Libre maintenant", "Free now", "Libre ahora"],
  "{{n}} فالانتظار ≈ {{m}} دقيقة": ["{{n}} en attente ≈ {{m}} min", "{{n}} waiting ≈ {{m}} min", "{{n}} esperando ≈ {{m}} min"],
  "مشغول دابا": ["Occupé", "Busy now", "Ocupado"],
  "خاوي دابا": ["Calme en ce moment", "Quiet now", "Tranquilo ahora"],
  "متوسط دابا": ["Affluence moyenne", "Moderately busy", "Afluencia media"],
  "عامر دابا": ["Très fréquenté", "Crowded now", "Muy concurrido"],
  "مسدود دابا": ["Fermé maintenant", "Closed now", "Cerrado ahora"],
  "مفتوح حتى {{time}}": ["Ouvert jusqu’à {{time}}", "Open until {{time}}", "Abierto hasta las {{time}}"],
  "مسدود · كيحل {{day}} {{time}}": ["Fermé · ouvre {{day}} à {{time}}", "Closed · opens {{day}} {{time}}", "Cerrado · abre {{day}} {{time}}"],
  "أوقات العمل غير محددة": ["Horaires non renseignés", "Opening hours not set", "Horario no indicado"],
  "خذني ليه": ["Itinéraire", "Directions", "Cómo llegar"],
  "عيّط": ["Appeler", "Call", "Llamar"],
  "واتساب": ["WhatsApp", "WhatsApp", "WhatsApp"],
  "الأسعار": ["Tarifs", "Prices", "Precios"],
  "درهم": ["MAD", "MAD", "MAD"],
  "زيدني فالصف": ["Rejoindre la file", "Join the queue", "Unirme a la cola"],
  "نتا فالصف": ["Votre position", "Your place in line", "Tu posición"],
  "نتا اللي جاي! سير للمحل.": ["C’est bientôt vous ! Rendez-vous au salon.", "You’re next! Head to the shop.", "¡Eres el siguiente! Ve al local."],
  "تقريباً {{m}} دقيقة": ["Environ {{m}} min", "About {{m}} min", "Unos {{m}} min"],
  "خرجني من الصف": ["Quitter la file", "Leave the queue", "Salir de la cola"],
  "مرحبا بيك! وصلات نوبتك.": ["Bienvenue ! C’est votre tour.", "Welcome! It’s your turn.", "¡Bienvenido! Es tu turno."],
  "خرجتي من الصف.": ["Vous n’êtes plus dans la file.", "You’re no longer in the queue.", "Ya no estás en la cola."],
  "المحل مسدود دابا. الصف كيتحل غير ملي يكون مفتوح.": ["Le salon est fermé. La file ouvre avec le salon.", "The shop is closed. The queue opens when the shop does.", "El local está cerrado. La cola abre con el local."],
  "ما تحتاجش تتسنى فالمحل: دير سميتك وغادي تشوف النوبة ديالك من هنا.": ["Inutile d’attendre sur place : inscrivez-vous et suivez votre tour ici.", "No need to wait in the shop: add your name and follow your turn here.", "No esperes en el local: apúntate y sigue tu turno aquí."],
  "دابا:": ["Maintenant :", "Now:", "Ahora:"],
  "حتى {{time}}": ["jusqu’à {{time}}", "until {{time}}", "hasta las {{time}}"],
  "من بعد:": ["Ensuite :", "Then:", "Después:"],
  "ما كاين حتى فترة دابا": ["Aucune séance en ce moment", "No session right now", "Ninguna sesión ahora"],
  "جدول الأسبوع": ["Planning de la semaine", "Weekly schedule", "Horario semanal"],
  "👩 نساء": ["👩 Femmes", "👩 Women", "👩 Mujeres"],
  "👨 رجال": ["👨 Hommes", "👨 Men", "👨 Hombres"],
  "👨‍👩‍👧 عائلي": ["👨‍👩‍👧 Familles", "👨‍👩‍👧 Families", "👨‍👩‍👧 Familias"],
  "🔒 حمام خاص": ["🔒 Hammam privatif", "🔒 Private hammam", "🔒 Hammam privado"],
  "صاوب الطقس ديالك": ["Composez votre rituel", "Build your ritual", "Crea tu ritual"],
  "{{n}} مراحل · {{m}} دقيقة · {{p}} درهماً": ["{{n}} étapes · {{m}} min · {{p}} MAD", "{{n}} steps · {{m}} min · {{p}} MAD", "{{n}} pasos · {{m}} min · {{p}} MAD"],
  "اختار الوقت": ["Choisir l’horaire", "Pick a time", "Elegir hora"],
  "شنو تجيب معاك": ["À apporter", "What to bring", "Qué llevar"],
  "متوفر عندنا": ["Disponible sur place", "Available here", "Disponible aquí"],
  "بدّل الخدمة": ["Changer de prestation", "Change service", "Cambiar servicio"],
  "اختار نساء ولا رجال باش تبان الأوقات.": ["Choisissez femmes ou hommes pour voir les horaires.", "Choose women or men to see the times.", "Elige mujeres u hombres para ver los horarios."],
  "غير اللي فاضيين دابا": ["Disponibles maintenant", "Available now only", "Solo disponibles ahora"],
  "الحالة دابا": ["Statut en direct", "Live status", "Estado en directo"],
  "الزبناء كيشوفو هاد الحالة فالبروفايل والبحث. كتختفي بوحدها إلا ما بدلتيهاش 3 ساعات.": ["Visible sur votre profil et dans la recherche. Elle disparaît après 3 h sans mise à jour.", "Shown on your profile and in search. It disappears after 3 hours without an update.", "Visible en tu perfil y en la búsqueda. Desaparece tras 3 horas sin actualizar."],
  "🟢 فاضي دابا": ["🟢 Libre", "🟢 Free", "🟢 Libre"],
  "🟡 مشغول": ["🟡 Occupé", "🟡 Busy", "🟡 Ocupado"],
  "🔴 مسدود": ["🔴 Fermé", "🔴 Closed", "🔴 Cerrado"],
  "🟢 خاوي": ["🟢 Calme", "🟢 Quiet", "🟢 Tranquilo"],
  "🟡 متوسط": ["🟡 Moyen", "🟡 Moderate", "🟡 Medio"],
  "🔴 عامر": ["🔴 Bondé", "🔴 Crowded", "🔴 Lleno"],
  "الصف": ["File d’attente", "Queue", "Cola"],
  "فرّغ الصف": ["Vider la file", "Clear queue", "Vaciar la cola"],
  "تفرغ الصف كامل؟": ["Vider toute la file ?", "Clear the whole queue?", "¿Vaciar toda la cola?"],
  "ما كاين حتى واحد فالصف.": ["Personne dans la file.", "Nobody in the queue.", "Nadie en la cola."],
  "دخل": ["Servi", "Served", "Atendido"],
  "ما جاش": ["Absent", "No-show", "No vino"],
  "معلومات للزبناء": ["Informations pour les clients", "Information for clients", "Información para clientes"],
  "العنوان": ["Adresse", "Address", "Dirección"],
  "الحي": ["Quartier", "Neighbourhood", "Barrio"],
  "الموقع محدد ✓ (عاود)": ["Position enregistrée ✓ (refaire)", "Location saved ✓ (redo)", "Ubicación guardada ✓ (repetir)"],
  "حدد الموقع ديالي (أنا فالمحل)": ["Utiliser ma position (je suis au salon)", "Use my location (I’m at the shop)", "Usar mi ubicación (estoy en el local)"],
  "ما قدرناش نجيبو الموقع. سمح للمتصفح باستعمال الموقع.": ["Position introuvable. Autorisez la localisation dans le navigateur.", "Could not get your location. Allow location access in the browser.", "No se pudo obtener la ubicación. Permite el acceso en el navegador."],
  "شنو كاين عندك": ["Équipements", "Amenities", "Servicios"],
  "عدد الكراسي": ["Nombre de fauteuils", "Number of chairs", "Número de sillones"],
  "أوقات النساء والرجال": ["Horaires femmes / hommes", "Women / men hours", "Horario mujeres / hombres"],
  "زيد فترة": ["Ajouter une plage", "Add a time range", "Añadir franja"],
  "مراحل الطقس (بالترتيب)": ["Étapes du rituel (dans l’ordre)", "Ritual steps (in order)", "Pasos del ritual (en orden)"],
  "فوق": ["Monter", "Move up", "Subir"],
  "تحت": ["Descendre", "Move down", "Bajar"],
  "شنو يجيب الزبون معاه": ["Ce que le client doit apporter", "What clients should bring", "Qué debe traer el cliente"],
  "زيد حاجة": ["Ajouter un élément", "Add an item", "Añadir elemento"],
  "تحفظات المعلومات.": ["Informations enregistrées.", "Information saved.", "Información guardada."],
  "جدول النساء/الرجال خاصو يكون داخل أوقات العمل.": ["Les horaires femmes/hommes doivent être dans les heures d’ouverture.", "Women/men hours must be within opening hours.", "El horario mujeres/hombres debe estar dentro del horario de apertura."],
  "حفظ": ["Enregistrer", "Save", "Guardar"],
}
for (const [i, l] of ["fr", "en", "es"].entries()) {
  const p = `src/locales/${l}.json`
  const j = JSON.parse(fs.readFileSync(p, "utf8"))
  for (const [k, v] of Object.entries(T)) if (!(k in j)) j[k] = v[i]
  fs.writeFileSync(p, JSON.stringify(j, null, 2) + "\n")
}
console.log("ok")'
```

Expected: `ok`

- [ ] **Step 2: تحقق أن الملفات JSON صالحة والبناء ناجح**

Run: `npm run build 2>&1 | grep -E "error|✓ built"`
Expected: `✓ built`

- [ ] **Step 3: Commit**

```bash
git add src/locales
git commit -m "i18n: fr/en/es strings for category profiles

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 16: وثيقة فريق Flutter

**Files:**
- Create: `docs/api/flutter-integration.md`

- [ ] **Step 1: أنشئ `docs/api/flutter-integration.md`**

````markdown
# NewLook API — Flutter integration (category profiles, phase 1)

Base URL: the site domain (e.g. `https://newlook.morosmartcitys.com`). All JSON. Times are `Africa/Casablanca`; weekdays 0 = Sunday … 6 = Saturday; dates `YYYY-MM-DD`; instants ISO-8601 UTC.

## 1. Catalog — `GET /api/catalog`
Cache it. Send `If-None-Match: <etag>`; `304` means keep your copy. `Cache-Control: max-age=300`.

```json
{ "version": "2026-11-10.1",
  "amenities": { "wifi": { "ar": "Wi-Fi", "fr": "Wi-Fi", "en": "Wi-Fi", "es": "Wi-Fi" } },
  "categories": [ { "key": "barber", "value": "حلاقة رجالية", "labels": {…}, "features": ["live_status","walkin_queue","style_tags"],
                    "liveStates": ["free","busy","closed"], "styleTags": [{ "key": "fade", "labels": {…} }],
                    "amenities": ["ac","wifi","kids","card","parking","accessible"],
                    "theme": { "mode": "dark", "colors": { "light": {…}, "dark": {…} },
                               "fonts": { "display": "Reem Kufi", "body": "IBM Plex Sans Arabic", "accent": "Special Elite" },
                               "radius": 4, "assets": { "headerPattern": "/assets/themes/barber/pole.svg", "background": "/assets/themes/barber/wood.svg", "priceBoard": "chalkboard" } } } ],
  "default": { "key": "default", … } }
```

A business's `category` (Arabic value) maps to a catalog entry by `value`; unknown → `default`.

### Theme → `ThemeData`
| Theme key | Flutter |
| --- | --- |
| `colors.<mode>.primary` / `onPrimary` | `ColorScheme.primary` / `onPrimary` |
| `background` | `ColorScheme.surface`, `scaffoldBackgroundColor` |
| `surface` | `ColorScheme.surfaceContainer` (cards) |
| `text` / `muted` | `onSurface` / `onSurfaceVariant` |
| `accent` | `tertiary` (decoration only) |
| `border` | `outlineVariant` |
| `danger` | `error` |
| `success`, `warning` | `ThemeExtension<NewlookStatusColors>` |
| `fonts.display` / `fonts.body` | `GoogleFonts.getFont(name)` for display/headline vs body/label |
| `radius` | `BorderRadius.circular(radius)` in `CardTheme`, `InputDecorationTheme`, buttons |
| `assets.*` | SVG via `flutter_svg` (`headerPattern` repeated horizontally, 12 px high) |
| `assets.priceBoard` | `chalkboard` (dark board, accent font), `menu` (list), `tiles` (2-column grid) |

Default brightness of a profile screen = `theme.mode`.

## 2. Business profile — `GET /api/businesses/:id`
```json
{ "business": {
    "id": "…", "name": "…", "category": "حلاقة رجالية", "categoryKey": "barber", "city": "مراكش", "bio": "…", "phone": "0612345678",
    "address": { "line": "12 زنقة الورد", "district": "جليز", "lat": 31.63, "lng": -8.01 },
    "amenities": ["wifi","ac"],
    "extras": { "chairs": 2 },
    "todayStatus": { "openNow": true, "closesAt": "21:00", "nextOpen": null },
    "live": { "state": "busy", "waiting": 3, "estimatedWaitMinutes": 45, "updatedAt": "…", "stale": false },
    "currentAudience": null },
  "services": [ { "id": "…", "name": "قصة فيد", "price": 60, "durationMinutes": 30 } ],
  "works": [ { "id": "…", "title": "…", "caption": "…", "imageUrl": "/uploads/…", "tags": ["fade"] } ] }
```
- `live.state`: `free|busy|closed` (barber), `quiet|moderate|crowded|closed` (hammam), `unknown` = show nothing. `live` is `null` for categories without the feature.
- Hammam `extras`: `{ "genderSchedule": [{ "weekday": 5, "start": "08:00", "end": "14:00", "audience": "women|men|mixed|private" }], "ritualSteps": ["<serviceId>"], "bringList": [{ "label": "صابون بلدي", "available": true }] }`; `currentAudience`: `{ "now": "women", "until": "14:00", "next": "men" }` or `null`.
- Refresh every 60 s while the screen is visible. Directions: `https://www.google.com/maps/dir/?api=1&destination=lat,lng` (fallback: search by `address.line, district, city`).

Lists (`GET /api/businesses`, `GET /api/search?city=&category=&keyword=&budget=&availableNow=1`) return the same business object (plus `cover`, or `service` + `price` for search).

## 3. Walk-in queue (barber, feature `walkin_queue`)
- Join: `POST /api/businesses/:id/queue` `{ "name": "Ali", "phone": "0612345678" }` → `201 { "id", "token", "position", "estimatedWaitMinutes" }`. **Store `id` + `token` securely** (they are the only proof of the ticket).
- Status: `GET /api/queue/:id?token=…` → `{ "status": "waiting|served|no_show|cancelled", "position", "estimatedWaitMinutes", "businessName" }`. Poll every 30 s while `waiting`; delete the ticket otherwise.
- Cancel: `POST /api/queue/:id/cancel` `{ "token" }`.

## 4. Slots and bookings
- `GET /api/businesses/:id/slots?services=<id1,id2>&day=YYYY-MM-DD[&audience=women|men]` → `{ "slots": ["2026-11-12T09:00:00.000Z", …] }`. `audience` is required for a hammam whose `genderSchedule` is not empty (`400 audience_required` otherwise).
- `POST /api/businesses/:id/bookings` `{ "serviceIds": ["…"], "startsAt": "<a slot, unchanged>", "name", "phone", "audience"? }` → `201 { "id", "status": "pending" }`.

## 5. Pro (signed-in) endpoints used by the app
Session = httpOnly cookie from `POST /api/auth/login` (keep a cookie jar).
- `PATCH /api/me/live` `{ "state": "free" }` → `{ "live": {…} }`
- `GET /api/me/queue` → `{ "entries": [{ "id", "name", "phone", "createdAt" }] }`; `POST /api/me/queue/:id/serve`, `/:id/no-show`, `POST /api/me/queue/clear`
- `PUT /api/me/business` with `address`, `amenities`, `extras` (+ the base fields)
- `PATCH /api/me/portfolio/:id` `{ "tags": ["fade"] }`

## 6. Errors
Body: `{ "error": "<code>" }`.
| HTTP | code | Meaning |
| --- | --- | --- |
| 400 | `invalid_input` | Bad field / not allowed for this category |
| 400 | `invalid_phone` | Phone is not a Moroccan mobile/landline |
| 400 | `schedule_outside_hours` | Women/men range outside opening hours |
| 400 | `audience_required` | Hammam slots need `audience` |
| 400 | `feature_unavailable` | Category has no such feature |
| 401 | `unauthenticated` | Not signed in |
| 404 | `not_found` | Unknown id, unpublished business, or wrong queue token |
| 409 | `slot_unavailable` | Slot taken / wrong audience |
| 409 | `closed_now` / `queue_full` | Queue cannot be joined |
| 429 | `already_in_queue` / `too_many_bookings` | Limits per phone |
| 429 | (none) | Rate limit — retry later |
````

- [ ] **Step 2: Commit**

```bash
git add docs/api/flutter-integration.md
git commit -m "docs: Flutter integration guide for category profiles

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 17: التحقق النهائي والنشر

- [ ] **Step 1: كل اختبارات السيرفر**

Run: `cd server && npm test`
Expected: كل الملفات `pass`، و`# fail 0`.

- [ ] **Step 2: الأنواع والبناء**

Run: `npx tsc -p tsconfig.app.json --noEmit && npm run build 2>&1 | grep -E "error|✓ built"`
Expected: `✓ built` بدون أخطاء.

- [ ] **Step 3: تحقق على البيانات التجريبية في Atlas** (قراءة فقط، API محلي على المنفذ 4996)

```bash
cd server && (PORT=4996 node src/index.js > /tmp/nl-api.log 2>&1 &) && sleep 3 && \
curl -s localhost:4996/api/catalog | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).categories.length))' && \
curl -s localhost:4996/api/businesses | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{for(const b of JSON.parse(d).businesses)console.log(b.categoryKey,b.todayStatus.openNow,b.live?.state)})'; \
kill $(lsof -ti :4996)
```

Expected:
- `7`
- ثم سطر لكل صالون تجريبي. الحلاق والحمام يظهر لهما `unknown` أو `closed`، والباقي `undefined`.

- [ ] **Step 4: ارفع إلى GitHub**

```bash
git push origin main
```

ثم في Coolify: **Redeploy**.
````
