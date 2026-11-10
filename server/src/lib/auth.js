import jwt from "jsonwebtoken"
import { config } from "../config.js"
import { User } from "../models.js"
import { HttpError, ah } from "./common.js"

const SESSION_COOKIE = "nl_session"
const MFA_COOKIE = "nl_mfa"

const cookieOpts = (maxAgeMs) => ({
  httpOnly: true,
  secure: config.isProd || config.cookieSameSite === "none",
  sameSite: config.cookieSameSite,
  path: "/",
  maxAge: maxAgeMs,
})

export function setSession(res, user, { mfa = false } = {}) {
  const admin = user.role === "admin"
  const ttl = admin ? 12 * 3600 : 30 * 24 * 3600 // admin sessions are short
  const token = jwt.sign({ sub: String(user._id), tv: user.tokenVersion, mfa }, config.jwtSecret, { expiresIn: ttl, algorithm: "HS256" })
  res.cookie(SESSION_COOKIE, token, cookieOpts(ttl * 1000))
  res.clearCookie(MFA_COOKIE, { path: "/" })
}

export function clearSession(res) {
  res.clearCookie(SESSION_COOKIE, { path: "/" })
  res.clearCookie(MFA_COOKIE, { path: "/" })
}

/** Half-logged-in state: password OK, waiting for the TOTP code (5 min). */
export function setMfaPending(res, user) {
  const token = jwt.sign({ sub: String(user._id), stage: "mfa", tv: user.tokenVersion }, config.jwtSecret, { expiresIn: 300, algorithm: "HS256" })
  res.cookie(MFA_COOKIE, token, cookieOpts(300_000))
}

export async function readMfaPending(req) {
  const raw = req.cookies?.[MFA_COOKIE]
  if (!raw) return null
  try {
    const p = jwt.verify(raw, config.jwtSecret, { algorithms: ["HS256"] })
    if (p.stage !== "mfa") return null
    const u = await User.findById(p.sub)
    return u && u.tokenVersion === p.tv ? u : null
  } catch { return null }
}

/** Attaches req.user (or null) from the session cookie. Never throws. */
export const loadUser = ah(async (req, _res, next) => {
  req.user = null
  const raw = req.cookies?.[SESSION_COOKIE]
  if (raw) {
    try {
      const p = jwt.verify(raw, config.jwtSecret, { algorithms: ["HS256"] })
      const u = await User.findById(p.sub)
      if (u && u.tokenVersion === p.tv) { req.user = u; req.session = { mfa: !!p.mfa } }
    } catch { /* invalid / expired token → anonymous */ }
  }
  next()
})

export function requireAuth(req, _res, next) {
  if (!req.user) return next(new HttpError(401, "unauthenticated"))
  next()
}

/** Admin role AND a session that passed the TOTP step. */
export function requireAdmin(req, _res, next) {
  if (!req.user) return next(new HttpError(401, "unauthenticated"))
  if (req.user.role !== "admin" || !req.session?.mfa) return next(new HttpError(403, "forbidden"))
  next()
}

export const publicUser = (u) => u && ({ id: String(u._id), email: u.email, name: u.name, role: u.role })
