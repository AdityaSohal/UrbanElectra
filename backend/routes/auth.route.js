import express from "express";
import {
	login,
	logout,
	signup,
	refreshToken,
	getProfile,
	googleAuth,
	forgotPassword,
	verifyOtp,
	resetPassword,
	updateProfilePic,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/signup",         signup);
router.post("/login",          login);
router.post("/logout",         logout);
router.post("/refresh-token",  refreshToken);
router.get( "/profile",        protectRoute, getProfile);
router.post("/google",         googleAuth);
router.put( "/profile-pic",    protectRoute, updateProfilePic);

// Forgot password flow
router.post("/forgot-password", forgotPassword);  // Step 1 – send OTP
router.post("/verify-otp",      verifyOtp);        // Step 2 – verify OTP
router.post("/reset-password",  resetPassword);    // Step 3 – set new password

export default router;