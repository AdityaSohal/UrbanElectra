import mongoose from "mongoose";

const shippingAddressSchema = new mongoose.Schema(
	{
		fullName:     { type: String, default: "" },
		addressLine1: { type: String, default: "" },
		addressLine2: { type: String, default: "" },
		city:         { type: String, default: "" },
		state:        { type: String, default: "" },
		postalCode:   { type: String, default: "" },
		country:      { type: String, default: "" },
		phone:        { type: String, default: "" },
	},
	{ _id: false }
);

const statusHistorySchema = new mongoose.Schema(
	{
		status:    { type: String, required: true },
		changedAt: { type: Date,   default: Date.now },
		note:      { type: String, default: "" },
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
				quantity: { type: Number, required: true, min: 1 },
				price:    { type: Number, required: true, min: 0 },
			},
		],
		totalAmount:     { type: Number, required: true, min: 0 },
		stripeSessionId: { type: String, unique: true },
		shippingAddress: { type: shippingAddressSchema, default: null },
		status: {
			type: String,
			enum: [
				"pending",
				"confirmed",
				"processing",
				"shipped",
				"delivered",
				"cancelled",
				"return_requested",
				"returned",
				"exchange_requested",
				"exchanged",
				"refunded",
			],
			default: "pending",
		},
		statusHistory: { type: [statusHistorySchema], default: [] },
		trackingNumber:    { type: String, default: "" },
		trackingCarrier:   { type: String, default: "" },
		estimatedDelivery: { type: Date,   default: null },
		cancelReason:   { type: String, default: "" },
		returnReason:   { type: String, default: "" },
		exchangeReason: { type: String, default: "" },
		stripeRefundId: { type: String, default: "" },
		refundAmount:   { type: Number, default: 0 },
		refundedAt:     { type: Date,   default: null },
	},
	{ timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);
export default Order;

