import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, 
	max: 20,
	message: { message: "Too many requests from this IP. Please try again in 15 minutes." },
	standardHeaders: true,
	legacyHeaders: false,
});

export const otpLimiter = rateLimit({
	windowMs: 10 * 60 * 1000, 
	max: 5,
	message: { message: "Too many OTP requests. Please wait 10 minutes before trying again." },
	standardHeaders: true,
	legacyHeaders: false,
});

export const apiLimiter = rateLimit({
	windowMs: 60 * 1000, 
	max: 120,
	message: { message: "Too many requests. Please slow down." },
	standardHeaders: true,
	legacyHeaders: false,
});