import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useCartStore } from "../stores/useCartStore";
import { Tag, X, CheckCircle, Loader } from "lucide-react";

const GiftCouponCard = () => {
	const [userInputCode, setUserInputCode] = useState("");
	const [applying, setApplying] = useState(false);
	const { coupon, isCouponApplied, applyCoupon, getMyCoupon, removeCoupon } = useCartStore();

	useEffect(() => {
		getMyCoupon();
	}, [getMyCoupon]);

	// Bug fix: only pre-fill input if no coupon is currently applied,
	// so we don't overwrite what the user typed / applied.
	useEffect(() => {
		if (coupon && !isCouponApplied) {
			setUserInputCode(coupon.code);
		}
	}, [coupon, isCouponApplied]);

	const handleApplyCoupon = async () => {
		if (!userInputCode.trim()) return;
		setApplying(true);
		await applyCoupon(userInputCode.trim());
		setApplying(false);
	};

	const handleRemoveCoupon = async () => {
		await removeCoupon();
		setUserInputCode("");
	};

	return (
		<motion.div
			className="space-y-4 rounded-lg border border-gray-700 bg-gray-800 p-4 shadow-sm sm:p-6"
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5, delay: 0.2 }}
		>
			<div className="flex items-center gap-2 mb-1">
				<Tag className="w-4 h-4 text-emerald-400" />
				<p className="text-sm font-semibold text-emerald-400">Coupon / Gift Card</p>
			</div>

			{/* Already applied */}
			{isCouponApplied && coupon ? (
				<div className="flex items-center justify-between bg-emerald-900/30 border border-emerald-700/50 rounded-lg px-4 py-3">
					<div className="flex items-center gap-2">
						<CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
						<div>
							<p className="text-sm font-semibold text-emerald-300">{coupon.code}</p>
							<p className="text-xs text-gray-400">{coupon.discountPercentage}% off applied</p>
						</div>
					</div>
					<button
						onClick={handleRemoveCoupon}
						className="text-gray-400 hover:text-red-400 transition-colors p-1"
						title="Remove coupon"
					>
						<X className="w-4 h-4" />
					</button>
				</div>
			) : (
				<div className="space-y-3">
					<div>
						<label htmlFor="voucher" className="mb-1.5 block text-sm font-medium text-gray-300">
							Enter coupon code
						</label>
						<div className="flex gap-2">
							<input
								type="text"
								id="voucher"
								className="flex-1 rounded-lg border border-gray-600 bg-gray-700 p-2.5 text-sm
									text-white placeholder-gray-400 uppercase focus:border-emerald-500
									focus:ring-emerald-500 focus:outline-none tracking-widest"
								placeholder="e.g. SAVE10"
								value={userInputCode}
								onChange={(e) => setUserInputCode(e.target.value.toUpperCase())}
								onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
							/>
							<motion.button
								type="button"
								className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium
									focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 flex items-center gap-1.5 transition-colors"
								whileTap={{ scale: 0.97 }}
								onClick={handleApplyCoupon}
								disabled={applying || !userInputCode.trim()}
							>
								{applying ? <Loader className="w-4 h-4 animate-spin" /> : null}
								Apply
							</motion.button>
						</div>
					</div>
				</div>
			)}

			{/* Show available personal coupon hint (only if not currently applied) */}
			{coupon && !isCouponApplied && (
				<div className="mt-2 flex items-center gap-2 rounded-md bg-yellow-900/20 border border-yellow-700/30 px-3 py-2">
					<Tag className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
					<p className="text-xs text-yellow-300">
						You have a coupon available:{" "}
						<button
							className="font-bold underline hover:text-yellow-200 transition-colors"
							onClick={() => setUserInputCode(coupon.code)}
						>
							{coupon.code}
						</button>{" "}
						— {coupon.discountPercentage}% off
						{coupon.description ? ` (${coupon.description})` : ""}
					</p>
				</div>
			)}
		</motion.div>
	);
};

export default GiftCouponCard;