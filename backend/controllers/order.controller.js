import Order from "../models/order.model.js";
import { stripe } from "../lib/stripe.js";

// ─────────────────────────────────────────────────────────────
//  CUSTOMER CONTROLLERS
// ─────────────────────────────────────────────────────────────

// GET /api/orders/my-orders
export const getMyOrders = async (req, res) => {
	try {
		const orders = await Order.find({ user: req.user._id })
			.populate({
				path: "products.product",
				select: "name image price",
				// If the product was deleted, populate returns null — that's fine
			})
			.sort({ createdAt: -1 })
			.lean(); // plain JS objects — faster and safer for JSON serialization

		res.json(orders);
	} catch (error) {
		console.error("Error in getMyOrders:", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// GET /api/orders/:id
export const getOrderById = async (req, res) => {
	try {
		const order = await Order.findById(req.params.id)
			.populate({
				path: "products.product",
				select: "name image price description category",
			})
			.lean();

		if (!order) return res.status(404).json({ message: "Order not found" });

		// Customers can only view their own orders; admins can view any
		if (
			req.user.role !== "admin" &&
			order.user.toString() !== req.user._id.toString()
		) {
			return res.status(403).json({ message: "Not authorized" });
		}

		res.json(order);
	} catch (error) {
		console.error("Error in getOrderById:", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// POST /api/orders/:id/cancel
export const cancelOrder = async (req, res) => {
	try {
		const { reason } = req.body;
		const order = await Order.findById(req.params.id);

		if (!order) return res.status(404).json({ message: "Order not found" });
		if (order.user.toString() !== req.user._id.toString())
			return res.status(403).json({ message: "Not authorized" });

		if (!["pending", "confirmed"].includes(order.status)) {
			return res.status(400).json({
				message: `Cannot cancel an order with status "${order.status}". Only pending or confirmed orders can be cancelled.`,
			});
		}

		order.status = "cancelled";
		order.cancelReason = reason || "Cancelled by customer";
		order.statusHistory.push({
			status: "cancelled",
			note: reason || "Cancelled by customer",
		});

		await order.save();

		// Return populated order so frontend can update directly
		const populated = await Order.findById(order._id)
			.populate({ path: "products.product", select: "name image price" })
			.lean();

		res.json({ message: "Order cancelled successfully", order: populated });
	} catch (error) {
		console.error("Error in cancelOrder:", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// POST /api/orders/:id/return
export const requestReturn = async (req, res) => {
	try {
		const { reason } = req.body;
		const order = await Order.findById(req.params.id);

		if (!order) return res.status(404).json({ message: "Order not found" });
		if (order.user.toString() !== req.user._id.toString())
			return res.status(403).json({ message: "Not authorized" });

		if (order.status !== "delivered") {
			return res.status(400).json({
				message: "Returns can only be requested for delivered orders.",
			});
		}

		// 30-day return window
		const deliveredEntry = [...order.statusHistory]
			.reverse()
			.find((h) => h.status === "delivered");

		if (deliveredEntry) {
			const daysSinceDelivery =
				(Date.now() - new Date(deliveredEntry.changedAt).getTime()) / (1000 * 60 * 60 * 24);
			if (daysSinceDelivery > 30) {
				return res.status(400).json({
					message: "Return window has expired (30 days from delivery).",
				});
			}
		}

		order.status = "return_requested";
		order.returnReason = reason || "";
		order.statusHistory.push({
			status: "return_requested",
			note: reason || "Return requested by customer",
		});

		await order.save();

		const populated = await Order.findById(order._id)
			.populate({ path: "products.product", select: "name image price" })
			.lean();

		res.json({ message: "Return request submitted successfully", order: populated });
	} catch (error) {
		console.error("Error in requestReturn:", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// POST /api/orders/:id/exchange
export const requestExchange = async (req, res) => {
	try {
		const { reason } = req.body;
		const order = await Order.findById(req.params.id);

		if (!order) return res.status(404).json({ message: "Order not found" });
		if (order.user.toString() !== req.user._id.toString())
			return res.status(403).json({ message: "Not authorized" });

		if (order.status !== "delivered") {
			return res.status(400).json({
				message: "Exchanges can only be requested for delivered orders.",
			});
		}

		order.status = "exchange_requested";
		order.exchangeReason = reason || "";
		order.statusHistory.push({
			status: "exchange_requested",
			note: reason || "Exchange requested by customer",
		});

		await order.save();

		const populated = await Order.findById(order._id)
			.populate({ path: "products.product", select: "name image price" })
			.lean();

		res.json({ message: "Exchange request submitted successfully", order: populated });
	} catch (error) {
		console.error("Error in requestExchange:", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// ─────────────────────────────────────────────────────────────
//  ADMIN CONTROLLERS
// ─────────────────────────────────────────────────────────────

// GET /api/orders/admin/all
export const getAllOrders = async (req, res) => {
	try {
		const page  = parseInt(req.query.page)  || 1;
		const limit = parseInt(req.query.limit) || 20;
		const skip  = (page - 1) * limit;
		const { status, search } = req.query;

		const filter = {};
		if (status && status !== "all") filter.status = status;

		if (search) {
			const User = (await import("../models/user.model.js")).default;
			const users = await User.find({
				$or: [
					{ email: { $regex: search, $options: "i" } },
					{ name:  { $regex: search, $options: "i" } },
				],
			}).select("_id");
			filter.user = { $in: users.map((u) => u._id) };
		}

		const [orders, total] = await Promise.all([
			Order.find(filter)
				.populate("user", "name email")
				.populate("products.product", "name image price")
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(limit)
				.lean(),
			Order.countDocuments(filter),
		]);

		res.json({ orders, total, page, totalPages: Math.ceil(total / limit) });
	} catch (error) {
		console.error("Error in getAllOrders:", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// GET /api/orders/admin/stats
export const getOrderStats = async (req, res) => {
	try {
		const stats = await Order.aggregate([
			{
				$group: {
					_id:     "$status",
					count:   { $sum: 1 },
					revenue: { $sum: "$totalAmount" },
				},
			},
		]);

		const formatted = {};
		stats.forEach((s) => {
			formatted[s._id] = { count: s.count, revenue: s.revenue };
		});

		res.json(formatted);
	} catch (error) {
		console.error("Error in getOrderStats:", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// PATCH /api/orders/admin/:id/status
export const updateOrderStatus = async (req, res) => {
	try {
		const { status, note } = req.body;

		const validStatuses = [
			"pending", "confirmed", "processing", "shipped",
			"delivered", "cancelled", "return_requested",
			"returned", "exchange_requested", "exchanged", "refunded",
		];
		if (!validStatuses.includes(status)) {
			return res.status(400).json({ message: "Invalid status value" });
		}

		const order = await Order.findById(req.params.id);
		if (!order) return res.status(404).json({ message: "Order not found" });

		order.status = status;
		order.statusHistory.push({
			status,
			note: note || `Status updated to ${status} by admin`,
		});

		await order.save();

		const populated = await Order.findById(order._id)
			.populate("user", "name email")
			.populate("products.product", "name image price")
			.lean();

		res.json({ message: "Order status updated", order: populated });
	} catch (error) {
		console.error("Error in updateOrderStatus:", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// PATCH /api/orders/admin/:id/tracking
export const setTrackingInfo = async (req, res) => {
	try {
		const { trackingNumber, trackingCarrier, estimatedDelivery } = req.body;
		const order = await Order.findById(req.params.id);
		if (!order) return res.status(404).json({ message: "Order not found" });

		if (trackingNumber)    order.trackingNumber  = trackingNumber;
		if (trackingCarrier)   order.trackingCarrier = trackingCarrier;
		if (estimatedDelivery) order.estimatedDelivery = new Date(estimatedDelivery);

		// Auto-advance to shipped when tracking is first added
		if (trackingNumber && ["confirmed", "processing"].includes(order.status)) {
			order.status = "shipped";
			order.statusHistory.push({
				status: "shipped",
				note: `Tracking added: ${trackingCarrier || ""} ${trackingNumber}`.trim(),
			});
		}

		await order.save();
		res.json({ message: "Tracking info updated", order });
	} catch (error) {
		console.error("Error in setTrackingInfo:", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// POST /api/orders/admin/:id/refund
export const processRefund = async (req, res) => {
	try {
		const { amount } = req.body;
		const order = await Order.findById(req.params.id);
		if (!order) return res.status(404).json({ message: "Order not found" });

		if (!order.stripeSessionId) {
			return res.status(400).json({ message: "No Stripe session found for this order" });
		}

		const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId);
		if (!session.payment_intent) {
			return res.status(400).json({ message: "No payment intent found on this session" });
		}

		const refundAmountCents = amount ? Math.round(amount * 100) : undefined;

		const refund = await stripe.refunds.create({
			payment_intent: session.payment_intent,
			...(refundAmountCents && { amount: refundAmountCents }),
		});

		order.stripeRefundId = refund.id;
		order.refundAmount   = refund.amount / 100;
		order.refundedAt     = new Date();
		order.status         = "refunded";
		order.statusHistory.push({
			status: "refunded",
			note: `Refund of $${order.refundAmount} processed. Stripe refund ID: ${refund.id}`,
		});

		await order.save();
		res.json({ message: "Refund processed successfully", refund, order });
	} catch (error) {
		console.error("Error in processRefund:", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};