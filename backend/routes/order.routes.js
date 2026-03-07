import express from "express";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";
import {
	getMyOrders,
	getOrderById,
	cancelOrder,
	requestReturn,
	requestExchange,
	getAllOrders,
	getOrderStats,
	updateOrderStatus,
	setTrackingInfo,
	processRefund,
} from "../controllers/order.controller.js";

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
//  ⚠️  ROUTE ORDER MATTERS IN EXPRESS
//  Any route with a literal string segment (/my-orders, /admin/all, etc.)
//  MUST be declared before any wildcard route (/:id).
//  If /:id appears first, Express matches "my-orders" and "admin" as IDs.
// ─────────────────────────────────────────────────────────────────────────────

// 1️⃣  Admin routes — all use /admin/* prefix, always before /:id
router.get(   "/admin/all",            protectRoute, adminRoute, getAllOrders);
router.get(   "/admin/stats",          protectRoute, adminRoute, getOrderStats);
router.patch( "/admin/:id/status",     protectRoute, adminRoute, updateOrderStatus);
router.patch( "/admin/:id/tracking",   protectRoute, adminRoute, setTrackingInfo);
router.post(  "/admin/:id/refund",     protectRoute, adminRoute, processRefund);

// 2️⃣  Customer named route — /my-orders must be before /:id
router.get("/my-orders", protectRoute, getMyOrders);

// 3️⃣  Customer wildcard routes — always declared LAST
router.get(  "/:id",          protectRoute, getOrderById);
router.post( "/:id/cancel",   protectRoute, cancelOrder);
router.post( "/:id/return",   protectRoute, requestReturn);
router.post( "/:id/exchange", protectRoute, requestExchange);

export default router;