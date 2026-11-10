// Create (or reset) a super-admin with mandatory TOTP 2FA.
// Usage: npm run create-admin -- admin@example.com
// The password is asked interactively and never stored in shell history.
import readline from "node:readline/promises"
import { stdin, stdout } from "node:process"
import bcrypt from "bcryptjs"
import mongoose from "mongoose"
import { authenticator } from "otplib"
import QRCode from "qrcode"
import { config } from "../src/config.js"
import { User } from "../src/models.js"

const email = (process.argv[2] || "").trim().toLowerCase()
if (!/^\S+@\S+\.\S+$/.test(email)) { console.error("Usage: npm run create-admin -- admin@example.com"); process.exit(1) }

const rl = readline.createInterface({ input: stdin, output: stdout })
const password = await rl.question("Mot de passe admin (12 caractères min) : ")
rl.close()
if (password.length < 12) { console.error("Mot de passe trop court."); process.exit(1) }

await mongoose.connect(config.mongoUri)
const secret = authenticator.generateSecret()
await User.findOneAndUpdate(
  { email },
  {
    $set: { passwordHash: await bcrypt.hash(password, 12), role: "admin", totpSecret: secret, totpEnabled: true, totpPendingSecret: null, failedLogins: 0, lockUntil: null },
    $inc: { tokenVersion: 1 },
    $setOnInsert: { name: "Admin" },
  },
  { upsert: true },
)
const uri = authenticator.keyuri(email, "NewLook Admin", secret)
console.log("\nScannez ce QR code avec Google Authenticator / Authy / 1Password :\n")
console.log(await QRCode.toString(uri, { type: "terminal", small: true }))
console.log(`Ou saisissez la clé manuellement : ${secret}\n`)
console.log("Admin prêt. Les anciennes sessions de ce compte sont révoquées.")
await mongoose.disconnect()
