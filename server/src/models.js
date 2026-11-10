import mongoose from "mongoose"

const { Schema, model, Types } = mongoose
const ObjectId = Schema.Types.ObjectId

// NoSQL-injection defence: every value that reaches a query is validated by zod
// (strings, numbers, enums) or by isObjectId() first, so objects like { $gt: "" }
// sent by a client are rejected before any query runs.
mongoose.set("strictQuery", true)

// Expose `id` instead of `_id`, hide `__v`.
const toJSON = {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => { delete ret._id; return ret },
}
const opts = { timestamps: true, toJSON }

const UserSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
  passwordHash: { type: String, required: true },
  name: { type: String, default: "", maxlength: 80 },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  totpSecret: { type: String, default: null },
  totpPendingSecret: { type: String, default: null },
  totpEnabled: { type: Boolean, default: false },
  failedLogins: { type: Number, default: 0 },
  lockUntil: { type: Date, default: null },
  tokenVersion: { type: Number, default: 0 },
}, opts)

const HourSchema = new Schema({
  weekday: { type: Number, min: 0, max: 6, required: true }, // 0 = Sunday
  start: { type: String, required: true }, // "HH:MM"
  end: { type: String, required: true },
}, { _id: false })

const BusinessSchema = new Schema({
  userId: { type: ObjectId, ref: "User", required: true, unique: true },
  name: { type: String, required: true, maxlength: 100 },
  category: { type: String, required: true },
  city: { type: String, required: true },
  bio: { type: String, default: "", maxlength: 1000 },
  phone: { type: String, default: "" },
  published: { type: Boolean, default: false },
  hours: { type: [HourSchema], default: [] },
}, opts)
BusinessSchema.index({ published: 1, city: 1, category: 1 })

const ServiceSchema = new Schema({
  businessId: { type: ObjectId, ref: "Business", required: true, index: true },
  name: { type: String, required: true, maxlength: 100 },
  price: { type: Number, required: true, min: 0, max: 100000 },
  durationMinutes: { type: Number, required: true, min: 5, max: 600, default: 30 },
}, opts)

const PortfolioSchema = new Schema({
  businessId: { type: ObjectId, ref: "Business", required: true, index: true },
  title: { type: String, required: true, maxlength: 100 },
  caption: { type: String, default: "", maxlength: 300 },
  imageUrl: { type: String, required: true },
  filePath: { type: String, required: true },
  published: { type: Boolean, default: true },
}, opts)

const BookingSchema = new Schema({
  businessId: { type: ObjectId, ref: "Business", required: true },
  serviceId: { type: ObjectId, ref: "Service" },
  serviceName: { type: String, required: true },
  price: { type: Number, required: true },
  startsAt: { type: Date, required: true },
  endsAt: { type: Date, required: true },
  clientName: { type: String, required: true, maxlength: 80 },
  clientPhone: { type: String, required: true },
  status: { type: String, enum: ["pending", "confirmed", "cancelled", "done"], default: "pending" },
}, opts)
BookingSchema.index({ businessId: 1, startsAt: 1 })
BookingSchema.index({ clientPhone: 1, startsAt: 1 })

const OfferSchema = new Schema({
  clientId: { type: ObjectId, ref: "User", required: true, index: true },
  clientName: { type: String, default: "" },
  category: { type: String, required: true },
  city: { type: String, required: true },
  serviceName: { type: String, required: true, maxlength: 120 },
  proposedPrice: { type: Number, required: true, min: 1, max: 100000 },
  preferredDate: { type: Date, default: null },
  status: { type: String, enum: ["open", "accepted", "cancelled"], default: "open" },
  businessId: { type: ObjectId, ref: "Business", default: null },
  appointmentAt: { type: Date, default: null },
  location: { type: String, default: null },
  proMessage: { type: String, default: null },
}, opts)
OfferSchema.index({ status: 1, city: 1, category: 1 })

const PlanSchema = new Schema({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true, maxlength: 80 },
  months: { type: Number, required: true, min: 1, max: 60 },
  price: { type: Number, required: true, min: 0 },
  active: { type: Boolean, default: false },
}, opts)

const SubscriptionSchema = new Schema({
  businessId: { type: ObjectId, ref: "Business", required: true, unique: true },
  userId: { type: ObjectId, ref: "User", required: true },
  planId: { type: ObjectId, ref: "Plan", default: null },
  status: { type: String, enum: ["trial", "active", "expired", "suspended"], default: "trial" },
  startsAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: null },
}, opts)

const PaymentSchema = new Schema({
  businessId: { type: ObjectId, ref: "Business", required: true, index: true },
  userId: { type: ObjectId, ref: "User", required: true },
  planId: { type: ObjectId, ref: "Plan", required: true },
  amount: { type: Number, required: true },
  receiptPath: { type: String, required: true },
  status: { type: String, enum: ["pending", "processing", "approved", "rejected"], default: "pending" },
}, opts)

const SettingSchema = new Schema({
  key: { type: String, required: true, unique: true },
  value: { type: String, default: "" },
}, opts)

const AuditSchema = new Schema({
  actorId: { type: ObjectId, ref: "User" },
  action: { type: String, required: true },
  target: { type: String, default: "" },
  meta: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: { createdAt: true, updatedAt: false }, toJSON })

// Short-lived mutex documents (per-business booking lock).
const LockSchema = new Schema({
  _id: { type: String },
  expiresAt: { type: Date, required: true },
}, { versionKey: false })
LockSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export const User = model("User", UserSchema)
export const Business = model("Business", BusinessSchema)
export const Service = model("Service", ServiceSchema)
export const Portfolio = model("Portfolio", PortfolioSchema)
export const Booking = model("Booking", BookingSchema)
export const Offer = model("Offer", OfferSchema)
export const Plan = model("Plan", PlanSchema)
export const Subscription = model("Subscription", SubscriptionSchema)
export const Payment = model("Payment", PaymentSchema)
export const Setting = model("Setting", SettingSchema)
export const Audit = model("Audit", AuditSchema)
export const Lock = model("Lock", LockSchema)

export const isObjectId = (v) => typeof v === "string" && Types.ObjectId.isValid(v) && String(new Types.ObjectId(v)) === v
