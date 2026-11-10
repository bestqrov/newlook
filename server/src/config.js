import "dotenv/config"
import path from "node:path"

function required(name) {
  const v = process.env[name]
  if (!v) throw new Error(`Missing required env var ${name} (see server/.env.example)`)
  return v
}

const jwtSecret = required("JWT_SECRET")
if (jwtSecret.length < 32) throw new Error("JWT_SECRET must be at least 32 characters")

const isProd = process.env.NODE_ENV === "production"

export const config = {
  isProd,
  port: Number(process.env.PORT || 4000),
  mongoUri: required("MONGODB_URI"),
  jwtSecret,
  clientOrigins: (process.env.CLIENT_ORIGINS || "http://localhost:5173").split(",").map((s) => s.trim()).filter(Boolean),
  trustProxy: process.env.TRUST_PROXY === "1",
  cookieSameSite: process.env.COOKIE_SAMESITE === "none" ? "none" : "lax",
  trialDays: Number(process.env.TRIAL_DAYS ?? 30),
  uploadDir: path.resolve(process.env.UPLOAD_DIR || "./uploads"),
  serveClientDir: process.env.SERVE_CLIENT_DIR ? path.resolve(process.env.SERVE_CLIENT_DIR) : "",
  timezone: "Africa/Casablanca",
}
