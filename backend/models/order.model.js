import mongoose from "mongoose";

const shippingAddressSchema = new mongoose.Schema(
	{
		fullName: { type: String, required: true },
		addressLine1: { type: String, required: true },
		addressLine2: { type: String, default: "" },
		city: { type: String, required: true },
		state: { type: String, default: "" },
		postalCode: { type: String, required: true },
		country: { type: String, required: true },
		phone: { type: String, default: "" },
	},
	{ _id: false }
);

const orderSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		products: [
			{
				product: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "Product",
					required: true,
				},
				quantity: {
					type: Number,
					required: true,
					min: 1,
				},
				price: {
					type: Number,
					required: true,
					min: 0,
				},
			},
		],
		totalAmount: {
			type: Number,
			required: true,
			min: 0,
		},
		stripeSessionId: {
			type: String,
			unique: true,
		},
		// ✅ NEW: shipping address embedded in order
		shippingAddress: {
			type: shippingAddressSchema,
			required: false, // optional for backward compat with existing orders
		},
	},
	{ timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;