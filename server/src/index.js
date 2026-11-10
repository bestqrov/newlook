import fs from "node:fs"
import path from "node:path"
import express from "express"
import helmet from "helmet"
import cors from "cors"
import cookieParser from "cookie-parser"
import rateLimit from "express-rate-limit"
import mongoose from "mongoose"
import multer from "multer"
import { config } from "./config.js"
import { HttpError } from "./lib/common.js"
import { loadUser } from "./lib/auth.js"
import { PUBLIC_DIR } from "./lib/uploads.js"
import authRoutes from "./routes/auth.js"
import publicRoutes from "./routes/public.js"
import proRoutes from "./routes/pro.js"
import offerRoutes from "./routes/offers.js"
import adminRoutes from "./routes/admin.js"

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

app.use(rateLimit({ windowMs: 15 * 60_000, limit: 600, standardHeaders: "draft-7", legacyHeaders: false }))
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
  // Hashed build files never change → cache 1 year; index.html always fresh.
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

await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 15_000 })
fs.mkdirSync(PUBLIC_DIR, { recursive: true })
const server = app.listen(config.port, () => console.log(`NewLook API on :${config.port}`))

// Graceful stop (Coolify sends SIGTERM on redeploy).
for (const sig of ["SIGTERM", "SIGINT"]) {
  process.on(sig, () => {
    server.close(() => mongoose.disconnect().finally(() => process.exit(0)))
    setTimeout(() => process.exit(1), 10_000).unref()
  })
}
