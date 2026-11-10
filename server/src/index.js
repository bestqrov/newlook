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
