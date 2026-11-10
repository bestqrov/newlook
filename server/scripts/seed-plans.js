// Creates default subscription plans if none exist. Prices are editable later in /admin.
import mongoose from "mongoose"
import { config } from "../src/config.js"
import { Plan } from "../src/models.js"

await mongoose.connect(config.mongoUri)
if (await Plan.countDocuments()) {
  console.log("Des forfaits existent déjà, rien à faire.")
} else {
  await Plan.insertMany([
    { code: "monthly", name: "Mensuel", months: 1, price: 99, active: true },
    { code: "quarterly", name: "Trimestriel", months: 3, price: 270, active: true },
    { code: "yearly", name: "Annuel", months: 12, price: 990, active: true },
  ])
  console.log("3 forfaits créés.")
}
await mongoose.disconnect()
