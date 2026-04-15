import { redis } from "../lib/redis.js";
import User from "../models/user.model.js";
import Otp from "../models/otp.model.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { sendOtpEmail } from "../lib/mailer.js";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const generateTokens = (userId) => {
	const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
		expiresIn: "15m",
	});
	const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
		expiresIn: "7d",
	});
	return { accessToken, refreshToken };
};

const storeRefreshToken = async (userId, refreshToken) => {
	try {
		await redis.set(`refresh_token:${userId}`, refreshToken, "EX", 7 * 24 * 60 * 60);
	} catch (err) {
		console.error("Redis storeRefreshToken failed:", err.message);
	}
};

const setCookies = (res, accessToken, refreshToken) => {
	res.cookie("accessToken", accessToken, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "strict",
		maxAge: 15 * 60 * 1000,
	});
	res.cookie("refreshToken", refreshToken, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "strict",
		maxAge: 7 * 24 * 60 * 60 * 1000,
	});
};

// ─── Auth controllers ─────────────────────────────────────────────────────────

export const signup = async (req, res, next) => {
	const { email, password, name } = req.body;
	try {
		const userExists = await User.findOne({ email });
		if (userExists) {
			return res.status(400).json({ message: "User already exists" });
		}
		const user = await User.create({ name, email, password });
		const { accessToken, refreshToken } = generateTokens(user._id);
		await storeRefreshToken(user._id, refreshToken);
		setCookies(res, accessToken, refreshToken);
		res.status(201).json({
			_id: user._id,
			name: user.name,
			email: user.email,
			role: user.role,
		});
	} catch (error) {
		console.log("Error in signup controller", error.message, error.stack);
		next(error);
	}
};

export const login = async (req, res) => {
	try {
		const { email, password } = req.body;
		const user = await User.findOne({ email });
		if (user && (await user.comparePassword(password))) {
			const { accessToken, refreshToken } = generateTokens(user._id);
			await storeRefreshToken(user._id, refreshToken);
			setCookies(res, accessToken, refreshToken);
			res.json({
				_id: user._id,
				name: user.name,
				email: user.email,
				role: user.role,
			});
		} else {
			res.status(400).json({ message: "Invalid email or password" });
		}
	} catch (error) {
		console.log("Error in login controller", error.message);
		res.status(500).json({ message: error.message });
	}
};

export const logout = async (req, res) => {
	try {
		const refreshToken = req.cookies.refreshToken;
		if (refreshToken) {
			try {
				const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
				await redis.del(`refresh_token:${decoded.userId}`);
			} catch (_) {}
		}
		res.clearCookie("accessToken");
		res.clearCookie("refreshToken");
		res.json({ message: "Logged out successfully" });
	} catch (error) {
		console.log("Error in logout controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const refreshToken = async (req, res) => {
	try {
		const refreshToken = req.cookies.refreshToken;
		if (!refreshToken) {
			return res.status(401).json({ message: "No refresh token provided" });
		}
		const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
		const storedToken = await redis.get(`refresh_token:${decoded.userId}`);
		if (storedToken !== refreshToken) {
			return res.status(401).json({ message: "Invalid refresh token" });
		}
		const accessToken = jwt.sign(
			{ userId: decoded.userId },
			process.env.ACCESS_TOKEN_SECRET,
			{ expiresIn: "15m" }
		);
		res.cookie("accessToken", accessToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
			maxAge: 15 * 60 * 1000,
		});
		res.json({ message: "Token refreshed successfully" });
	} catch (error) {
		console.log("Error in refreshToken controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getProfile = async (req, res) => {
	try {
		res.json(req.user);
	} catch (error) {
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const googleAuth = async (req, res) => {
	const { credential } = req.body;
	try {
		const ticket = await googleClient.verifyIdToken({
			idToken: credential,
			audience: process.env.GOOGLE_CLIENT_ID,
		});
		const { email, name } = ticket.getPayload();

		let user = await User.findOne({ email });
		if (!user) {
			user = await User.create({
				name,
				email,
				password: Math.random().toString(36).slice(-16) + "Aa1!",
			});
		}

		const { accessToken, refreshToken } = generateTokens(user._id);
		await storeRefreshToken(user._id, refreshToken);
		setCookies(res, accessToken, refreshToken);

		res.json({
			_id: user._id,
			name: user.name,
			email: user.email,
			role: user.role,
		});
	} catch (error) {
		console.log("Error in googleAuth:", error.message);
		res.status(401).json({ message: "Invalid Google credential" });
	}
};

// ─── Forgot Password – Step 1: send OTP ───────────────────────────────────────

export const forgotPassword = async (req, res) => {
	try {
		const { email } = req.body;
		if (!email) return res.status(400).json({ message: "Email is required" });

		const user = await User.findOne({ email: email.toLowerCase().trim() });
		// Always respond the same way to prevent email enumeration
		if (!user) {
			return res.status(200).json({
				message: "If that email is registered, an OTP has been sent.",
			});
		}

		// Delete any existing OTPs for this email
		await Otp.deleteMany({ email: email.toLowerCase().trim() });

		// Generate a 6-digit OTP
		const otp = Math.floor(100000 + Math.random() * 900000).toString();

		// Store hashed OTP in DB (expires in 10 minutes)
		const salt = await bcrypt.genSalt(10);
		const hashedOtp = await bcrypt.hash(otp, salt);

		await Otp.create({
			email: email.toLowerCase().trim(),
			otp: hashedOtp,
			expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min
		});

		await sendOtpEmail(email, otp);

		res.status(200).json({ message: "If that email is registered, an OTP has been sent." });
	} catch (error) {
		console.error("Error in forgotPassword:", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// ─── Forgot Password – Step 2: verify OTP ────────────────────────────────────

export const verifyOtp = async (req, res) => {
	try {
		const { email, otp } = req.body;
		if (!email || !otp)
			return res.status(400).json({ message: "Email and OTP are required" });

		const record = await Otp.findOne({ email: email.toLowerCase().trim() });
		if (!record) {
			return res.status(400).json({ message: "OTP not found or has expired. Please request a new one." });
		}

		if (record.expiresAt < new Date()) {
			await Otp.deleteOne({ _id: record._id });
			return res.status(400).json({ message: "OTP has expired. Please request a new one." });
		}

		const isMatch = await bcrypt.compare(otp, record.otp);
		if (!isMatch) {
			return res.status(400).json({ message: "Invalid OTP. Please try again." });
		}

		// Mark OTP as verified so the reset step can proceed
		record.verified = true;
		await record.save();

		res.status(200).json({ message: "OTP verified successfully." });
	} catch (error) {
		console.error("Error in verifyOtp:", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// ─── Forgot Password – Step 3: reset password ────────────────────────────────

export const resetPassword = async (req, res) => {
	try {
		const { email, otp, newPassword } = req.body;
		if (!email || !otp || !newPassword)
			return res.status(400).json({ message: "Email, OTP, and new password are required" });

		if (newPassword.length < 6)
			return res.status(400).json({ message: "Password must be at least 6 characters" });

		const record = await Otp.findOne({ email: email.toLowerCase().trim() });
		if (!record || !record.verified) {
			return res.status(400).json({ message: "Please verify your OTP first." });
		}

		if (record.expiresAt < new Date()) {
			await Otp.deleteOne({ _id: record._id });
			return res.status(400).json({ message: "Session expired. Please start over." });
		}

		// Double-check OTP one more time for security
		const isMatch = await bcrypt.compare(otp, record.otp);
		if (!isMatch) {
			return res.status(400).json({ message: "Invalid OTP." });
		}

		const user = await User.findOne({ email: email.toLowerCase().trim() });
		if (!user) return res.status(404).json({ message: "User not found." });

		user.password = newPassword; // pre-save hook will hash it
		await user.save();

		// Clean up OTP record
		await Otp.deleteOne({ _id: record._id });

		// Invalidate all existing sessions
		await redis.del(`refresh_token:${user._id}`);

		res.status(200).json({ message: "Password reset successfully. Please log in." });
	} catch (error) {
		console.error("Error in resetPassword:", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};