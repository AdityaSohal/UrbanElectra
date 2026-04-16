import { redis } from "../lib/redis.js";
import User from "../models/user.model.js";
import Otp from "../models/otp.model.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { sendOtpEmail } from "../lib/mailer.js";
import cloudinary from "../lib/cloudinary.js";

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

const formatUser = (user) => ({
	_id: user._id,
	name: user.name,
	email: user.email,
	role: user.role,
	profilePic: user.profilePic || "",
	googleProfilePic: user.googleProfilePic || "",
});

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
		res.status(201).json(formatUser(user));
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
			res.json(formatUser(user));
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
		res.json(formatUser(req.user));
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
		const { email, name, picture } = ticket.getPayload();

		let user = await User.findOne({ email });
		if (!user) {
			user = await User.create({
				name,
				email,
				password: Math.random().toString(36).slice(-16) + "Aa1!",
				googleProfilePic: picture || "",
			});
		} else if (picture && !user.googleProfilePic) {
			user.googleProfilePic = picture;
			await user.save();
		}

		const { accessToken, refreshToken } = generateTokens(user._id);
		await storeRefreshToken(user._id, refreshToken);
		setCookies(res, accessToken, refreshToken);

		res.json(formatUser(user));
	} catch (error) {
		console.log("Error in googleAuth:", error.message);
		res.status(401).json({ message: "Invalid Google credential" });
	}
};

// ─── Update Profile Picture ───────────────────────────────────────────────────

export const updateProfilePic = async (req, res) => {
	try {
		const { image } = req.body;
		if (!image) {
			return res.status(400).json({ message: "Image is required" });
		}

		const user = await User.findById(req.user._id);
		if (!user) return res.status(404).json({ message: "User not found" });

		// Delete old custom profile pic from Cloudinary if it exists
		if (user.profilePic) {
			try {
				const urlParts = user.profilePic.split("/");
				const uploadIndex = urlParts.indexOf("upload");
				if (uploadIndex !== -1) {
					const afterUpload = urlParts.slice(uploadIndex + 1);
					const publicIdParts = afterUpload[0]?.match(/^v\d+$/)
						? afterUpload.slice(1)
						: afterUpload;
					const publicId = publicIdParts.join("/").replace(/\.[^/.]+$/, "");
					await cloudinary.uploader.destroy(publicId);
				}
			} catch (err) {
				console.log("Error deleting old profile pic from Cloudinary:", err.message);
			}
		}

		const cloudinaryResponse = await cloudinary.uploader.upload(image, {
			folder: "profile_pics",
			transformation: [{ width: 200, height: 200, crop: "fill", gravity: "face" }],
		});

		user.profilePic = cloudinaryResponse.secure_url;
		await user.save();

		res.json(formatUser(user));
	} catch (error) {
		console.error("Error in updateProfilePic:", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// ─── Delete Profile Picture ───────────────────────────────────────────────────
// Removes the custom uploaded pic from Cloudinary and clears it from the user.
// After deletion: if the user has a googleProfilePic it will show that,
// otherwise the frontend falls back to initials.

export const deleteProfilePic = async (req, res) => {
	try {
		const user = await User.findById(req.user._id);
		if (!user) return res.status(404).json({ message: "User not found" });

		if (!user.profilePic) {
			return res.status(400).json({ message: "No custom profile picture to remove" });
		}

		// Delete from Cloudinary
		try {
			const urlParts = user.profilePic.split("/");
			const uploadIndex = urlParts.indexOf("upload");
			if (uploadIndex !== -1) {
				const afterUpload = urlParts.slice(uploadIndex + 1);
				const publicIdParts = afterUpload[0]?.match(/^v\d+$/)
					? afterUpload.slice(1)
					: afterUpload;
				const publicId = publicIdParts.join("/").replace(/\.[^/.]+$/, "");
				await cloudinary.uploader.destroy(publicId);
			}
		} catch (err) {
			console.log("Error deleting profile pic from Cloudinary:", err.message);
			// Still clear it from DB even if Cloudinary deletion fails
		}

		user.profilePic = "";
		await user.save();

		res.json(formatUser(user));
	} catch (error) {
		console.error("Error in deleteProfilePic:", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// ─── Forgot Password – Step 1: send OTP ───────────────────────────────────────

export const forgotPassword = async (req, res) => {
	try {
		const { email } = req.body;
		if (!email) return res.status(400).json({ message: "Email is required" });

		const user = await User.findOne({ email: email.toLowerCase().trim() });
		if (!user) {
			return res.status(200).json({
				message: "If that email is registered, an OTP has been sent.",
			});
		}

		await Otp.deleteMany({ email: email.toLowerCase().trim() });

		const otp = Math.floor(100000 + Math.random() * 900000).toString();

		const salt = await bcrypt.genSalt(10);
		const hashedOtp = await bcrypt.hash(otp, salt);

		await Otp.create({
			email: email.toLowerCase().trim(),
			otp: hashedOtp,
			expiresAt: new Date(Date.now() + 10 * 60 * 1000),
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

		const isMatch = await bcrypt.compare(otp, record.otp);
		if (!isMatch) {
			return res.status(400).json({ message: "Invalid OTP." });
		}

		const user = await User.findOne({ email: email.toLowerCase().trim() });
		if (!user) return res.status(404).json({ message: "User not found." });

		user.password = newPassword;
		await user.save();

		await Otp.deleteOne({ _id: record._id });

		await redis.del(`refresh_token:${user._id}`);

		res.status(200).json({ message: "Password reset successfully. Please log in." });
	} catch (error) {
		console.error("Error in resetPassword:", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};