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
	deleteProfilePic,
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
router.delete("/profile-pic",  protectRoute, deleteProfilePic);
router.post("/forgot-password", forgotPassword);  
router.post("/verify-otp",      verifyOtp);        
router.post("/reset-password",  resetPassword);   

export default router;