import { Router } from "express"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { authenticator } from "otplib"
import rateLimit from "express-rate-limit"
import { User } from "../models.js"
import { HttpError, ah, parse } from "../lib/common.js"
import { clearSession, publicUser, readMfaPending, setMfaPending, setSession } from "../lib/auth.js"

const r = Router()
authenticator.options = { window: 1 }

const authLimiter = rateLimit({ windowMs: 15 * 60_000, limit: 20, standardHeaders: "draft-7", legacyHeaders: false })
const MAX_FAILS = 5
const LOCK_MS = 15 * 60_000
// Used to keep timing equal when the e-mail does not exist.
const DUMMY_HASH = bcrypt.hashSync("dummy-password-for-timing", 12)

const credentials = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8).max(128),
})

r.post("/register", authLimiter, ah(async (req, res) => {
  const body = parse(credentials.extend({ name: z.string().trim().max(80).optional().default("") }), req.body)
  if (await User.exists({ email: body.email })) throw new HttpError(409, "email_taken")
  const user = await User.create({ email: body.email, name: body.name, passwordHash: await bcrypt.hash(body.password, 12) })
  setSession(res, user)
  res.status(201).json({ user: publicUser(user) })
}))

r.post("/login", authLimiter, ah(async (req, res) => {
  const { email, password } = parse(credentials, req.body)
  const user = await User.findOne({ email })
  if (user?.lockUntil && user.lockUntil > new Date()) throw new HttpError(429, "account_locked")
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH)
  if (!user || !ok) {
    if (user) {
      const fails = user.failedLogins + 1
      await User.updateOne({ _id: user._id }, fails >= MAX_FAILS ? { failedLogins: 0, lockUntil: new Date(Date.now() + LOCK_MS) } : { failedLogins: fails })
    }
    throw new HttpError(401, "invalid_credentials")
  }
  await User.updateOne({ _id: user._id }, { failedLogins: 0, lockUntil: null })

  if (user.role === "admin") {
    // 2FA is enrolled offline by `npm run create-admin`, never over the web,
    // so a leaked admin password alone can never register a new authenticator.
    if (!user.totpEnabled) throw new HttpError(403, "mfa_not_configured")
    setMfaPending(res, user)
    return res.json({ mfa: "required" })
  }
  setSession(res, user)
  res.json({ user: publicUser(user) })
}))

r.post("/mfa/verify", authLimiter, ah(async (req, res) => {
  const { code } = parse(z.object({ code: z.string().trim().regex(/^\d{6}$/) }), req.body)
  const user = await readMfaPending(req)
  if (!user) throw new HttpError(401, "mfa_expired")
  if (!user.totpEnabled || !user.totpSecret || !authenticator.check(code, user.totpSecret)) throw new HttpError(401, "invalid_code")
  setSession(res, user, { mfa: true })
  res.json({ user: publicUser(user) })
}))

r.post("/logout", (_req, res) => { clearSession(res); res.json({ ok: true }) })

/** Logs out every device of this user. */
r.post("/logout-all", ah(async (req, res) => {
  if (req.user) await User.updateOne({ _id: req.user._id }, { $inc: { tokenVersion: 1 } })
  clearSession(res)
  res.json({ ok: true })
}))

r.get("/me", (req, res) => res.json({ user: publicUser(req.user), mfa: !!req.session?.mfa }))

export default r
