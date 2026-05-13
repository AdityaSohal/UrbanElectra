import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
	{
		code: {
			type: String,
			required: true,
			unique: true,      // this already creates an index
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

// FIX: removed duplicate couponSchema.index({ code: 1 }) — the `unique: true`
// on the field definition already creates this index. Declaring it again with
// schema.index() triggers the Mongoose duplicate-index warning.
couponSchema.index({ userId: 1, isActive: 1 });

const Coupon = mongoose.model("Coupon", couponSchema);

export default Coupon;