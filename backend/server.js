import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoSanitize from "express-mongo-sanitize";

import authRoutes from "./routes/auth.route.js";
import productRoutes from "./routes/product.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import couponRoutes from "./routes/coupon.routes.js";
import paymentRoutes from "./routes/payment.route.js";
import analyticsRoutes from "./routes/analytical.route.js";
import orderRoutes from "./routes/order.routes.js";

import { connectDB } from "./lib/db.js";
import { authLimiter, otpLimiter, apiLimiter } from "./middleware/rateLimiter.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// FIX: Vercel sits behind a proxy and sends X-Forwarded-For headers.
// Without trust proxy, express-rate-limit throws ERR_ERL_UNEXPECTED_X_FORWARDED_FOR
// on every request and rate limiting doesn't work correctly.
app.set("trust proxy", 1);

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

app.use(
  mongoSanitize({
    sanitizeQuery: false,
  })
);

app.use("/api", apiLimiter);

app.use("/api/auth/login",           authLimiter);
app.use("/api/auth/signup",          authLimiter);
app.use("/api/auth/forgot-password", otpLimiter);
app.use("/api/auth/verify-otp",      otpLimiter);
app.use("/api/auth/reset-password",  otpLimiter);

app.use("/api/auth",      authRoutes);
app.use("/api/products",  productRoutes);
app.use("/api/cart",      cartRoutes);
app.use("/api/coupons",   couponRoutes);
app.use("/api/payments",  paymentRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/orders",    orderRoutes);

app.get("/health", (req, res) => res.send("Server is healthy"));

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
});

// Connect to DB at module level so Vercel serverless picks it up
connectDB().catch((err) => {
  console.error("DB connection failed:", err.message);
});

// Only start HTTP server locally
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;