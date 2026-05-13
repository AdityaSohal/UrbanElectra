import Coupon from "../models/coupon.model.js";
import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import { stripe } from "../lib/stripe.js";
import { sendOrderConfirmationEmail } from "../lib/mailer.js";

export const createCheckoutSession = async (req, res) => {
	try {
		const { products, couponCode, shippingAddress } = req.body;

		if (!Array.isArray(products) || products.length === 0) {
			return res.status(400).json({ error: "Invalid or empty products array" });
		}

		let totalAmount = 0;

		const lineItems = products.map((product) => {
			const amount = Math.round(product.price * 100); 
			totalAmount += amount * product.quantity;
			return {
				price_data: {
					currency: "usd",
					product_data: {
						name: product.name,
						images: [product.image],
					},
					unit_amount: amount,
				},
				quantity: product.quantity || 1,
			};
		});

		const originalTotalCents = totalAmount; 
		let coupon = null;
		if (couponCode) {
			const upperCode = couponCode.trim().toUpperCase();

			coupon = await Coupon.findOne({
				code: upperCode,
				userId: req.user._id,
				isActive: true,
				expirationDate: { $gt: new Date() },
			});

			if (!coupon) {
				coupon = await Coupon.findOne({
					code: upperCode,
					userId: null,
					isActive: true,
					expirationDate: { $gt: new Date() },
				});
			}

			if (coupon) {
				if (coupon.minimumOrderAmount > 0) {
					const orderTotalUSD = totalAmount / 100;
					if (orderTotalUSD < coupon.minimumOrderAmount) {
						return res.status(400).json({
							message: `This coupon requires a minimum order of $${coupon.minimumOrderAmount}`,
						});
					}
				}
				totalAmount -= Math.round((totalAmount * coupon.discountPercentage) / 100);
			}
		}

		let shippingMeta = "";
		if (shippingAddress && typeof shippingAddress === "object") {
			try {
				shippingMeta = JSON.stringify(shippingAddress).substring(0, 490);
			} catch (_) {
				shippingMeta = "";
			}
		}

		const session = await stripe.checkout.sessions.create({
			payment_method_types: ["card"],
			line_items: lineItems,
			mode: "payment",
			success_url: `${process.env.CLIENT_URL}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${process.env.CLIENT_URL}/purchase-cancel`,
			discounts: coupon
				? [{ coupon: await createStripeCoupon(coupon.discountPercentage) }]
				: [],
			metadata: {
				userId: req.user._id.toString(),
				couponCode: couponCode || "",
				couponId: coupon ? coupon._id.toString() : "",
				products: JSON.stringify(
					products.map((p) => ({
						id: p._id,
						quantity: p.quantity,
						price: p.price,
					}))
				),
				shippingAddress: shippingMeta,
			},
		});

		if (originalTotalCents / 100 >= 200) {
			await createNewGiftCoupon(req.user._id);
		}

		res.status(200).json({
			id: session.id,
			url: session.url,
			totalAmount: totalAmount / 100,
		});
	} catch (error) {
		console.error("Error processing checkout:", error);
		res.status(500).json({ message: "Error processing checkout", error: error.message });
	}
};

export const checkoutSuccess = async (req, res) => {
	try {
		const { sessionId } = req.body;

		if (!sessionId) return res.status(400).json({ message: "sessionId is required" });

		const session = await stripe.checkout.sessions.retrieve(sessionId);

		if (session.payment_status !== "paid") {
			return res.status(400).json({
				message: "Payment not completed",
				status: session.payment_status,
			});
		}

		// Idempotency: don't double-create
		const existingOrder = await Order.findOne({ stripeSessionId: sessionId });
		if (existingOrder) {
			return res.status(200).json({
				success: true,
				message: "Order already processed",
				orderId: existingOrder._id,
			});
		}

		// ── Deactivate personal coupon OR mark global coupon as used ──────────
		if (session.metadata.couponCode && session.metadata.couponId) {
			const usedCoupon = await Coupon.findById(session.metadata.couponId);
			if (usedCoupon) {
				if (usedCoupon.userId !== null) {
					// Personal: deactivate
					usedCoupon.isActive = false;
				} else {
					// Global: track usage
					usedCoupon.usedCount += 1;
					if (!usedCoupon.usedBy.includes(session.metadata.userId)) {
						usedCoupon.usedBy.push(session.metadata.userId);
					}
					// Auto-deactivate if max uses reached
					if (usedCoupon.maxUses !== null && usedCoupon.usedCount >= usedCoupon.maxUses) {
						usedCoupon.isActive = false;
					}
				}
				await usedCoupon.save();
			}
		}

		let products = [];
		try {
			products = JSON.parse(session.metadata.products);
		} catch (_) {
			return res.status(400).json({ message: "Failed to parse order products from session" });
		}

		let shippingAddress = null;
		if (session.metadata.shippingAddress) {
			try {
				const parsed = JSON.parse(session.metadata.shippingAddress);
				if (parsed && typeof parsed === "object" && parsed.addressLine1) {
					shippingAddress = parsed;
				}
			} catch (_) {}
		}

		const newOrder = new Order({
			user: session.metadata.userId,
			products: products.map((product) => ({
				product: product.id,
				quantity: product.quantity,
				price: product.price,
			})),
			totalAmount: session.amount_total / 100,
			stripeSessionId: sessionId,
			shippingAddress,
			status: "pending",
			statusHistory: [{ status: "pending", note: "Order placed successfully" }],
		});

		await newOrder.save();

		for (const item of products) {
			await Product.findByIdAndUpdate(item.id, {
				$inc: { stock: -item.quantity },
			});
		}

		try {
			const populatedOrder = await Order.findById(newOrder._id)
				.populate("user", "name email")
				.populate("products.product", "name image price");

			if (populatedOrder?.user?.email) {
				await sendOrderConfirmationEmail(populatedOrder.user.email, populatedOrder);
			}
		} catch (emailErr) {
			console.error("Order confirmation email failed:", emailErr.message);
		}

		res.status(200).json({
			success: true,
			message: "Payment successful, order created.",
			orderId: newOrder._id,
		});
	} catch (error) {
		console.error("Error processing successful checkout:", error);
		res.status(500).json({
			message: "Error processing successful checkout",
			error: error.message,
		});
	}
};


async function createStripeCoupon(discountPercentage) {
	const coupon = await stripe.coupons.create({
		percent_off: discountPercentage,
		duration: "once",
	});
	return coupon.id;
}

async function createNewGiftCoupon(userId) {
	await Coupon.findOneAndDelete({ userId, userId: { $ne: null } });

	const newCoupon = new Coupon({
		code: "GIFT" + Math.random().toString(36).substring(2, 8).toUpperCase(),
		discountPercentage: 10,
		expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
		userId: userId,
		description: "Loyalty reward – 10% off your next order",
	});
	await newCoupon.save();
	return newCoupon;
}