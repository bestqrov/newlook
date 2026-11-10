// Imports the data exported from the old Chantan/Supabase site (scripts/legacy-data.json):
//  - subscription plans with their real prices
//  - the demo businesses with their services, photos and opening hours
// Safe to run several times (it updates instead of duplicating).
// Usage (Coolify → container Terminal):  npm run import-legacy
import fs from "node:fs"
import crypto from "node:crypto"
import bcrypt from "bcryptjs"
import mongoose from "mongoose"
import { config } from "../src/config.js"
import { Business, Plan, Portfolio, Service, Subscription, User } from "../src/models.js"

const data = JSON.parse(fs.readFileSync(new URL("./legacy-data.json", import.meta.url), "utf8"))
await mongoose.connect(config.mongoUri)

// ─── Plans ──────────────────────────────────────────────────────────
for (const p of data.plans) {
  await Plan.updateOne({ code: p.code }, { $set: { name: p.name, months: p.months, price: p.price, active: p.active } }, { upsert: true })
}
// Default plans from `seed-plans` that the old site did not have → hidden (not deleted).
const seedOnly = ["monthly", "quarterly", "yearly"].filter((c) => !data.plans.some((p) => p.code === c))
const hidden = await Plan.updateMany({ code: { $in: seedOnly }, active: true }, { $set: { active: false } })
console.log(`Forfaits : ${data.plans.length} importés${hidden.modifiedCount ? `, ${hidden.modifiedCount} ancien(s) masqué(s)` : ""}.`)

// ─── Demo businesses ────────────────────────────────────────────────
for (const [i, b] of data.businesses.entries()) {
  // Each business needs an owner account. Demo owners get an e-mail on a
  // non-routable domain and a random password nobody knows (cannot log in).
  const email = `demo-${b.legacyId.slice(-12)}@newlook.invalid`
  let owner = await User.findOne({ email })
  if (!owner) owner = await User.create({ email, name: b.name, passwordHash: await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 12) })

  const biz = await Business.findOneAndUpdate(
    { userId: owner._id },
    { $set: { name: b.name, category: b.category, city: b.city, bio: b.bio, phone: b.phone, published: b.published, hours: b.hours } },
    { upsert: true, new: true, runValidators: true },
  )
  await Service.deleteMany({ businessId: biz._id })
  if (b.services.length) await Service.insertMany(b.services.map((s) => ({ ...s, businessId: biz._id })))
  await Portfolio.deleteMany({ businessId: biz._id, filePath: "" })
  if (b.works.length) await Portfolio.insertMany(b.works.map((w) => ({ ...w, businessId: biz._id, filePath: "" })))
  // Visible without expiry until the admin hides or deletes it in /admin.
  await Subscription.updateOne(
    { businessId: biz._id },
    { $set: { userId: owner._id, status: "active", planId: null, expiresAt: null }, $setOnInsert: { startsAt: new Date() } },
    { upsert: true },
  )
  console.log(`${i + 1}. ${b.name} — ${b.services.length} service(s), ${b.works.length} photo(s), ${b.hours.length} créneau(x) horaires`)
}

console.log("\nImport terminé. Les activités de démonstration se gèrent (masquer / supprimer) depuis /admin.")
console.log("Pensez à saisir les coordonnées bancaires dans /admin → Paiements.")
await mongoose.disconnect()
