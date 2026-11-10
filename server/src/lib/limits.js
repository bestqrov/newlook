import rateLimit from "express-rate-limit"

/** Rate limiter shared by all routes. Disabled when RATE_LIMIT_OFF=1 (tests only). */
export const limiter = (windowMs, limit) => rateLimit({
  windowMs, limit, standardHeaders: "draft-7", legacyHeaders: false,
  skip: () => process.env.RATE_LIMIT_OFF === "1",
})
