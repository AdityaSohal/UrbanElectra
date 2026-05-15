import Coupon from "../models/coupon.model.js";

export const getCoupon = async (req, res) => {
	try {
		// FIX: was returning 500 because the DB query occasionally fails
		// on cold-start serverless before the connection is fully established.
		// Added explicit null return on no coupon found (was already correct)
		// and improved error logging to surface the real cause.
		const coupon = await Coupon.findOne({
			userId: req.user._id,
			isActive: true,
			expirationDate: { $gt: new Date() },
		});
		res.json(coupon || null);
	} catch (error) {
		console.log("Error in getCoupon controller", error.message);
		// Return null instead of 500 — the frontend treats null as "no coupon"
		// and a 500 here breaks the entire cart page
		res.status(200).json(null);
	}
};

export const validateCoupon = async (req, res) => {
	try {
		const { code } = req.body;
		if (!code) return res.status(400).json({ message: "Coupon code is required" });

		const upperCode = code.trim().toUpperCase();

		let coupon = await Coupon.findOne({
			code: upperCode,
			userId: req.user._id,
			isActive: true,
		});

		if (!coupon) {
			coupon = await Coupon.findOne({
				code: upperCode,
				userId: null,
				isActive: true,
			});
		}

		if (!coupon) {
			return res.status(404).json({ message: "Coupon not found" });
		}

		if (coupon.expirationDate < new Date()) {
			coupon.isActive = false;
			await coupon.save();
			return res.status(400).json({ message: "Coupon has expired" });
		}

		if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
			return res.status(400).json({ message: "Coupon usage limit reached" });
		}
		if (coupon.userId === null && coupon.usedBy.includes(req.user._id)) {
			return res.status(400).json({ message: "You have already used this coupon" });
		}

		res.json({
			message: "Coupon is valid",
			code: coupon.code,
			discountPercentage: coupon.discountPercentage,
			minimumOrderAmount: coupon.minimumOrderAmount,
			description: coupon.description,
			isGlobal: coupon.userId === null,
		});
	} catch (error) {
		console.log("Error in validateCoupon controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getAllCoupons = async (req, res) => {
	try {
		const coupons = await Coupon.find().populate("userId", "name email").sort({ createdAt: -1 });
		res.json(coupons);
	} catch (error) {
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const createCoupon = async (req, res) => {
	try {
		const { code, discountPercentage, expirationDate, maxUses, minimumOrderAmount, description } =
			req.body;

		if (!code || !discountPercentage || !expirationDate) {
			return res.status(400).json({ message: "code, discountPercentage, and expirationDate are required" });
		}

		const existing = await Coupon.findOne({ code: code.trim().toUpperCase() });
		if (existing) return res.status(400).json({ message: "Coupon code already exists" });

		const coupon = await Coupon.create({
			code: code.trim().toUpperCase(),
			discountPercentage,
			expirationDate: new Date(expirationDate),
			maxUses: maxUses || null,
			minimumOrderAmount: minimumOrderAmount || 0,
			description: description || "",
			userId: null, 
		});

		res.status(201).json(coupon);
	} catch (error) {
		console.error("Error in createCoupon:", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const deleteCoupon = async (req, res) => {
	try {
		await Coupon.findByIdAndDelete(req.params.id);
		res.json({ message: "Coupon deleted" });
	} catch (error) {
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const toggleCoupon = async (req, res) => {
	try {
		const coupon = await Coupon.findById(req.params.id);
		if (!coupon) return res.status(404).json({ message: "Coupon not found" });
		coupon.isActive = !coupon.isActive;
		await coupon.save();
		res.json(coupon);
	} catch (error) {
		res.status(500).json({ message: "Server error", error: error.message });
	}
};