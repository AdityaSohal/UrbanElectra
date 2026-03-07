import Coupon from "../models/coupon.model.js";
import Order from "../models/order.model.js";
import { stripe } from "../lib/stripe.js";

export const createCheckoutSession = async (req, res) => {
	try {
		const { products, couponCode, shippingAddress } = req.body; // ✅ NEW: accept shippingAddress

		if (!Array.isArray(products) || products.length === 0) {
			return res.status(400).json({ error: "Invalid or empty products array" });
		}

		let totalAmount = 0;
		let originalTotal = 0;

		const lineItems = products.map((product) => {
			const amount = Math.round(product.price * 100);
			totalAmount += amount * product.quantity;
			originalTotal += amount * product.quantity;
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

		let coupon = null;
		if (couponCode) {
			coupon = await Coupon.findOne({ code: couponCode, userId: req.user._id, isActive: true });
			if (coupon) {
				totalAmount -= Math.round((totalAmount * coupon.discountPercentage) / 100);
			}
		}

		// ✅ NEW: Build shipping address fields for Stripe metadata (max 500 chars per field)
		const shippingMeta = shippingAddress
			? JSON.stringify(shippingAddress).substring(0, 490)
			: "";

		const session = await stripe.checkout.sessions.create({
			payment_method_types: ["card"],
			line_items: lineItems,
			mode: "payment",
			success_url: `${process.env.CLIENT_URL}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${process.env.CLIENT_URL}/purchase-cancel`,
			discounts: coupon
				? [{ coupon: await createStripeCoupon(coupon.discountPercentage) }]
				: [],
			// ✅ NEW: Optionally pre-fill Stripe's address collection (shows address in Stripe dashboard)
			...(shippingAddress && {
				shipping_address_collection: undefined, // we handle it ourselves
			}),
			metadata: {
				userId: req.user._id.toString(),
				couponCode: couponCode || "",
				products: JSON.stringify(
					products.map((p) => ({
						id: p._id,
						quantity: p.quantity,
						price: p.price,
					}))
				),
				shippingAddress: shippingMeta, // ✅ NEW: store in Stripe metadata
			},
		});

		if (originalTotal >= 20000) {
			await createNewCoupon(req.user._id);
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
		const session = await stripe.checkout.sessions.retrieve(sessionId);

		if (session.payment_status === "paid") {
			if (session.metadata.couponCode) {
				await Coupon.findOneAndUpdate(
					{ code: session.metadata.couponCode, userId: session.metadata.userId },
					{ isActive: false }
				);
			}

			const products = JSON.parse(session.metadata.products);

			// ✅ NEW: Parse shipping address back from metadata
			let shippingAddress = null;
			if (session.metadata.shippingAddress) {
				try {
					shippingAddress = JSON.parse(session.metadata.shippingAddress);
				} catch (_) {
					// Malformed — skip gracefully
				}
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
				...(shippingAddress && { shippingAddress }), // ✅ NEW: save address on order
			});

			await newOrder.save();

			res.status(200).json({
				success: true,
				message: "Payment successful, order created, and coupon deactivated if used.",
				orderId: newOrder._id,
			});
		} else {
			res.status(400).json({ message: "Payment not completed", status: session.payment_status });
		}
	} catch (error) {
		console.error("Error processing successful checkout:", error);
		res.status(500).json({ message: "Error processing successful checkout", error: error.message });
	}
};

async function createStripeCoupon(discountPercentage) {
	const coupon = await stripe.coupons.create({
		percent_off: discountPercentage,
		duration: "once",
	});
	return coupon.id;
}

async function createNewCoupon(userId) {
	await Coupon.findOneAndDelete({ userId });
	const newCoupon = new Coupon({
		code: "GIFT" + Math.random().toString(36).substring(2, 8).toUpperCase(),
		discountPercentage: 10,
		expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
		userId: userId,
	});
	await newCoupon.save();
	return newCoupon;
}