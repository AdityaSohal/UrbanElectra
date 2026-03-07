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

router.get(   "/admin/all",            protectRoute, adminRoute, getAllOrders);
router.get(   "/admin/stats",          protectRoute, adminRoute, getOrderStats);
router.patch( "/admin/:id/status",     protectRoute, adminRoute, updateOrderStatus);
router.patch( "/admin/:id/tracking",   protectRoute, adminRoute, setTrackingInfo);
router.post(  "/admin/:id/refund",     protectRoute, adminRoute, processRefund);

router.get("/my-orders", protectRoute, getMyOrders);

router.get(  "/:id",          protectRoute, getOrderById);
router.post( "/:id/cancel",   protectRoute, cancelOrder);
router.post( "/:id/return",   protectRoute, requestReturn);
router.post( "/:id/exchange", protectRoute, requestExchange);

export default router;

