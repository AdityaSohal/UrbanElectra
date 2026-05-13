import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
	{
		code: {
			type: String,
			required: true,
			unique: true,
			uppercase: true,
			trim: true,
		},
		discountPercentage: {
			type: Number,
			required: true,
			min: 0,
			max: 100,
		},
		expirationDate: {
			type: Date,
			required: true,
		},
		isActive: {
			type: Boolean,
			default: true,
		},
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			default: null,
		},
		maxUses: {
			type: Number,
			default: null,
		},
		usedCount: {
			type: Number,
			default: 0,
		},
		usedBy: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
		],
		minimumOrderAmount: {
			type: Number,
			default: 0,
		},
		description: {
			type: String,
			default: "",
		},
	},
	{
		timestamps: true,
	}
);

couponSchema.index({ userId: 1, isActive: 1 });
couponSchema.index({ code: 1 });

const Coupon = mongoose.model("Coupon", couponSchema);

export default Coupon;