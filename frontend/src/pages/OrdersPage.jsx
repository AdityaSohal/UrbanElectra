import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOrderStore } from "../stores/useOrderStore";
import {
	Package, ChevronDown, ChevronUp, Truck, MapPin,
	XCircle, RotateCcw, RefreshCw, Clock, CheckCircle,
	AlertCircle, Loader, ShoppingBag, ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";

// ─── Status config ────────────────────────────────────────────
const STATUS_CONFIG = {
	pending:           { label: "Pending",           color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",  icon: Clock },
	confirmed:         { label: "Confirmed",         color: "bg-blue-500/20 text-blue-300 border-blue-500/30",        icon: CheckCircle },
	processing:        { label: "Processing",        color: "bg-purple-500/20 text-purple-300 border-purple-500/30",  icon: Package },
	shipped:           { label: "Shipped",           color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",  icon: Truck },
	delivered:         { label: "Delivered",         color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", icon: CheckCircle },
	cancelled:         { label: "Cancelled",         color: "bg-red-500/20 text-red-300 border-red-500/30",           icon: XCircle },
	return_requested:  { label: "Return Requested",  color: "bg-orange-500/20 text-orange-300 border-orange-500/30",  icon: RotateCcw },
	returned:          { label: "Returned",          color: "bg-orange-500/20 text-orange-300 border-orange-500/30",  icon: RotateCcw },
	exchange_requested:{ label: "Exchange Requested",color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",        icon: RefreshCw },
	exchanged:         { label: "Exchanged",         color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",        icon: RefreshCw },
	refunded:          { label: "Refunded",          color: "bg-gray-500/20 text-gray-300 border-gray-500/30",        icon: CheckCircle },
};

const StatusBadge = ({ status }) => {
	const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
	const Icon = cfg.icon;
	return (
		<span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.color}`}>
			<Icon className="w-3 h-3" />
			{cfg.label}
		</span>
	);
};

// ─── Action Modal ─────────────────────────────────────────────
const ActionModal = ({ isOpen, onClose, onConfirm, title, description, loading }) => {
	const [reason, setReason] = useState("");
	if (!isOpen) return null;
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<div className="absolute inset-0 bg-black/70" onClick={onClose} />
			<motion.div
				className="relative bg-gray-800 rounded-xl border border-gray-700 p-6 w-full max-w-md shadow-2xl"
				initial={{ opacity: 0, scale: 0.95 }}
				animate={{ opacity: 1, scale: 1 }}
			>
				<h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
				<p className="text-sm text-gray-400 mb-4">{description}</p>
				<textarea
					className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
					rows={3}
					placeholder="Tell us the reason (optional)..."
					value={reason}
					onChange={(e) => setReason(e.target.value)}
				/>
				<div className="flex gap-3 mt-4">
					<button
						onClick={onClose}
						className="flex-1 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-medium transition-colors"
					>
						Go Back
					</button>
					<button
						onClick={() => { onConfirm(reason); setReason(""); }}
						disabled={loading}
						className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
					>
						{loading && <Loader className="w-4 h-4 animate-spin" />}
						Confirm
					</button>
				</div>
			</motion.div>
		</div>
	);
};

// ─── Order Card ───────────────────────────────────────────────
const OrderCard = ({ order }) => {
	const [expanded, setExpanded] = useState(false);
	const [modal, setModal] = useState(null); // "cancel" | "return" | "exchange"
	const { cancelOrder, requestReturn, requestExchange, loading } = useOrderStore();

	const canCancel = ["pending", "confirmed"].includes(order.status);
	const canReturn = order.status === "delivered";
	const canExchange = order.status === "delivered";

	const handleAction = async (reason) => {
		let success = false;
		if (modal === "cancel") success = await cancelOrder(order._id, reason);
		if (modal === "return") success = await requestReturn(order._id, reason);
		if (modal === "exchange") success = await requestExchange(order._id, reason);
		if (success) setModal(null);
	};

	const modalConfig = {
		cancel: {
			title: "Cancel Order",
			description: "Are you sure you want to cancel this order? This action cannot be undone.",
		},
		return: {
			title: "Request a Return",
			description: "Please describe the reason for your return. Our team will review your request within 2-3 business days.",
		},
		exchange: {
			title: "Request an Exchange",
			description: "Please describe what you'd like to exchange and why. Our team will contact you with available options.",
		},
	};

	return (
		<>
			<ActionModal
				isOpen={!!modal}
				onClose={() => setModal(null)}
				onConfirm={handleAction}
				title={modal ? modalConfig[modal].title : ""}
				description={modal ? modalConfig[modal].description : ""}
				loading={loading}
			/>

			<motion.div
				className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden hover:border-gray-600 transition-colors duration-200"
				initial={{ opacity: 0, y: 16 }}
				animate={{ opacity: 1, y: 0 }}
			>
				{/* Header row */}
				<div
					className="flex flex-wrap items-center justify-between gap-3 p-4 cursor-pointer"
					onClick={() => setExpanded((v) => !v)}
				>
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center flex-shrink-0">
							<Package className="w-5 h-5 text-emerald-400" />
						</div>
						<div>
							<p className="text-xs text-gray-400">Order ID</p>
							<p className="text-sm font-mono text-white">#{order._id.slice(-8).toUpperCase()}</p>
						</div>
					</div>

					<div className="hidden sm:block">
						<p className="text-xs text-gray-400">Date</p>
						<p className="text-sm text-white">
							{new Date(order.createdAt).toLocaleDateString("en-US", {
								year: "numeric", month: "short", day: "numeric",
							})}
						</p>
					</div>

					<div>
						<p className="text-xs text-gray-400">Items</p>
						<p className="text-sm text-white">{order.products.length} item{order.products.length !== 1 ? "s" : ""}</p>
					</div>

					<div>
						<p className="text-xs text-gray-400">Total</p>
						<p className="text-sm font-semibold text-emerald-400">${order.totalAmount.toFixed(2)}</p>
					</div>

					<div className="flex items-center gap-2">
						<StatusBadge status={order.status} />
						{expanded ? (
							<ChevronUp className="w-4 h-4 text-gray-400" />
						) : (
							<ChevronDown className="w-4 h-4 text-gray-400" />
						)}
					</div>
				</div>

				{/* Expanded detail */}
				<AnimatePresence>
					{expanded && (
						<motion.div
							initial={{ height: 0, opacity: 0 }}
							animate={{ height: "auto", opacity: 1 }}
							exit={{ height: 0, opacity: 0 }}
							transition={{ duration: 0.25 }}
							className="overflow-hidden"
						>
							<div className="border-t border-gray-700 p-4 space-y-5">
								{/* Products */}
								<div>
									<p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Items Ordered</p>
									<div className="space-y-3">
										{order.products.map((item, i) => (
											<div key={i} className="flex items-center gap-3">
												<img
													src={item.product?.image}
													alt={item.product?.name}
													className="w-14 h-14 rounded-lg object-cover bg-gray-700 flex-shrink-0"
												/>
												<div className="flex-1 min-w-0">
													<p className="text-sm font-medium text-white truncate">
														{item.product?.name || "Product unavailable"}
													</p>
													<p className="text-xs text-gray-400">
														Qty: {item.quantity} × ${item.price.toFixed(2)}
													</p>
												</div>
												<p className="text-sm font-semibold text-emerald-400 flex-shrink-0">
													${(item.quantity * item.price).toFixed(2)}
												</p>
											</div>
										))}
									</div>
								</div>

								{/* Tracking */}
								{order.trackingNumber && (
									<div className="bg-gray-700/50 rounded-lg p-3">
										<div className="flex items-center gap-2 mb-1">
											<Truck className="w-4 h-4 text-emerald-400" />
											<p className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Tracking</p>
										</div>
										<p className="text-sm text-white font-mono">{order.trackingCarrier} — {order.trackingNumber}</p>
										{order.estimatedDelivery && (
											<p className="text-xs text-gray-400 mt-1">
												Est. delivery: {new Date(order.estimatedDelivery).toLocaleDateString()}
											</p>
										)}
									</div>
								)}

								{/* Shipping address */}
								{order.shippingAddress && (
									<div className="bg-gray-700/50 rounded-lg p-3">
										<div className="flex items-center gap-2 mb-1">
											<MapPin className="w-4 h-4 text-emerald-400" />
											<p className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Ship To</p>
										</div>
										<p className="text-sm text-white">{order.shippingAddress.fullName}</p>
										<p className="text-xs text-gray-400">
											{order.shippingAddress.addressLine1}
											{order.shippingAddress.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ""},
											{" "}{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode},
											{" "}{order.shippingAddress.country}
										</p>
									</div>
								)}

								{/* Status Timeline */}
								{order.statusHistory?.length > 0 && (
									<div>
										<p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Order Timeline</p>
										<div className="space-y-2">
											{[...order.statusHistory].reverse().map((h, i) => (
												<div key={i} className="flex items-start gap-3">
													<div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${i === 0 ? "bg-emerald-400" : "bg-gray-600"}`} />
													<div>
														<p className="text-xs font-medium text-white capitalize">{h.status.replace(/_/g, " ")}</p>
														{h.note && <p className="text-xs text-gray-400">{h.note}</p>}
														<p className="text-xs text-gray-500">
															{new Date(h.changedAt).toLocaleString()}
														</p>
													</div>
												</div>
											))}
										</div>
									</div>
								)}

								{/* Action buttons */}
								<div className="flex flex-wrap gap-2 pt-1">
									{canCancel && (
										<button
											onClick={() => setModal("cancel")}
											className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-medium transition-colors"
										>
											<XCircle className="w-3.5 h-3.5" />
											Cancel Order
										</button>
									)}
									{canReturn && (
										<button
											onClick={() => setModal("return")}
											className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-medium transition-colors"
										>
											<RotateCcw className="w-3.5 h-3.5" />
											Return Item
										</button>
									)}
									{canExchange && (
										<button
											onClick={() => setModal("exchange")}
											className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-xs font-medium transition-colors"
										>
											<RefreshCw className="w-3.5 h-3.5" />
											Exchange Item
										</button>
									)}
								</div>

								{/* Cancellation/return reasons */}
								{order.cancelReason && (
									<p className="text-xs text-gray-400 italic">Cancellation reason: {order.cancelReason}</p>
								)}
								{order.returnReason && (
									<p className="text-xs text-gray-400 italic">Return reason: {order.returnReason}</p>
								)}
								{order.exchangeReason && (
									<p className="text-xs text-gray-400 italic">Exchange reason: {order.exchangeReason}</p>
								)}
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</motion.div>
		</>
	);
};

// ─── Main Page ────────────────────────────────────────────────
const OrdersPage = () => {
	const { orders, fetchMyOrders, loading } = useOrderStore();

	useEffect(() => {
		fetchMyOrders();
	}, [fetchMyOrders]);

	return (
		<div className="min-h-screen py-12 px-4">
			<div className="max-w-3xl mx-auto">
				<motion.div
					initial={{ opacity: 0, y: -16 }}
					animate={{ opacity: 1, y: 0 }}
					className="mb-8"
				>
					<div className="flex items-center gap-3 mb-1">
						<ShoppingBag className="w-7 h-7 text-emerald-400" />
						<h1 className="text-3xl font-bold text-white">My Orders</h1>
					</div>
					<p className="text-gray-400 text-sm ml-10">
						Track, manage, and review all your purchases
					</p>
				</motion.div>

				{loading && orders.length === 0 ? (
					<div className="flex justify-center py-24">
						<Loader className="w-8 h-8 text-emerald-400 animate-spin" />
					</div>
				) : orders.length === 0 ? (
					<motion.div
						className="text-center py-24"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
					>
						<ShoppingBag className="w-16 h-16 text-gray-600 mx-auto mb-4" />
						<h2 className="text-xl font-semibold text-gray-300 mb-2">No orders yet</h2>
						<p className="text-gray-500 mb-6">When you place an order, it will appear here.</p>
						<Link
							to="/"
							className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
						>
							Start Shopping <ArrowRight className="w-4 h-4" />
						</Link>
					</motion.div>
				) : (
					<div className="space-y-4">
						{orders.map((order, i) => (
							<motion.div
								key={order._id}
								initial={{ opacity: 0, y: 16 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: i * 0.05 }}
							>
								<OrderCard order={order} />
							</motion.div>
						))}
					</div>
				)}
			</div>
		</div>
	);
};

export default OrdersPage;