import express from "express";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";
import {
	getCoupon,
	validateCoupon,
	getAllCoupons,
	createCoupon,
	deleteCoupon,
	toggleCoupon,
} from "../controllers/coupon.controller.js";

const router = express.Router();
router.get("/",          protectRoute, getCoupon);
router.post("/validate", protectRoute, validateCoupon);
router.get("/admin/all",          protectRoute, adminRoute, getAllCoupons);
router.post("/admin/create",      protectRoute, adminRoute, createCoupon);
router.delete("/admin/:id",       protectRoute, adminRoute, deleteCoupon);
router.patch("/admin/:id/toggle", protectRoute, adminRoute, toggleCoupon);

export default router;