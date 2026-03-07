import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "../lib/axios";
import toast from "react-hot-toast";
import {
	Package, ChevronDown, ChevronUp, Truck, MapPin,
	XCircle, RotateCcw, RefreshCw, Clock, CheckCircle,
	Loader, ShoppingBag, ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";

const STATUS_CONFIG = {
	pending:            { label: "Pending",            color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40" },
	confirmed:          { label: "Confirmed",          color: "bg-blue-500/20 text-blue-300 border-blue-500/40" },
	processing:         { label: "Processing",         color: "bg-purple-500/20 text-purple-300 border-purple-500/40" },
	shipped:            { label: "Shipped",            color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40" },
	delivered:          { label: "Delivered",          color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" },
	cancelled:          { label: "Cancelled",          color: "bg-red-500/20 text-red-300 border-red-500/40" },
	return_requested:   { label: "Return Requested",   color: "bg-orange-500/20 text-orange-300 border-orange-500/40" },
	returned:           { label: "Returned",           color: "bg-orange-500/20 text-orange-300 border-orange-500/40" },
	exchange_requested: { label: "Exchange Requested", color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40" },
	exchanged:          { label: "Exchanged",          color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40" },
	refunded:           { label: "Refunded",           color: "bg-gray-500/20 text-gray-300 border-gray-500/40" },
};

const StatusBadge = ({ status }) => {
	const cfg = STATUS_CONFIG[status] || { label: status, color: "bg-gray-500/20 text-gray-300 border-gray-500/40" };
	return (
		<span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.color}`}>
			{cfg.label}
		</span>
	);
};

const ActionModal = ({ isOpen, onClose, onConfirm, title, description, loading }) => {
	const [reason, setReason] = useState("");

	useEffect(() => {
		if (!isOpen) setReason("");
	}, [isOpen]);

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<div className="absolute inset-0 bg-black/70" onClick={onClose} />
			<div className="relative bg-gray-800 rounded-xl border border-gray-700 p-6 w-full max-w-md shadow-2xl z-10">
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
						onClick={() => onConfirm(reason)}
						disabled={loading}
						className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
					>
						{loading && <Loader className="w-4 h-4 animate-spin" />}
						Confirm
					</button>
				</div>
			</div>
		</div>
	);
};

const OrderCard = ({ order, onOrderUpdate }) => {
	const [expanded, setExpanded] = useState(false);
	const [modal, setModal]       = useState(null);
	const [loading, setLoading]   = useState(false);

	const canCancel   = ["pending", "confirmed"].includes(order.status);
	const canReturn   = order.status === "delivered";
	const canExchange = order.status === "delivered";

	const handleAction = async (reason) => {
		setLoading(true);
		try {
			let res;
			if (modal === "cancel")   res = await axios.post(`/orders/${order._id}/cancel`,   { reason });
			if (modal === "return")   res = await axios.post(`/orders/${order._id}/return`,   { reason });
			if (modal === "exchange") res = await axios.post(`/orders/${order._id}/exchange`, { reason });

			toast.success(res.data.message);
			onOrderUpdate(res.data.order);
			setModal(null);
		} catch (error) {
			toast.error(error.response?.data?.message || "Something went wrong");
		} finally {
			setLoading(false);
		}
	};

	const modalConfig = {
		cancel:   { title: "Cancel Order",        description: "Are you sure you want to cancel this order? This cannot be undone." },
		return:   { title: "Request a Return",     description: "Describe why you want to return this item. Our team will review within 2-3 business days." },
		exchange: { title: "Request an Exchange",  description: "Describe what you'd like to exchange and why. We'll contact you with options." },
	};

	const orderDate = new Date(order.createdAt).toLocaleDateString("en-US", {
		year: "numeric", month: "short", day: "numeric",
	});

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

			<div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden hover:border-gray-600 transition-colors">
				<div
					className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5 cursor-pointer select-none"
					onClick={() => setExpanded((v) => !v)}
				>
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center flex-shrink-0">
							<Package className="w-5 h-5 text-emerald-400" />
						</div>
						<div>
							<p className="text-xs text-gray-500">Order</p>
							<p className="text-sm font-mono font-semibold text-white">
								#{order._id.slice(-8).toUpperCase()}
							</p>
						</div>
					</div>

					<div className="hidden sm:block">
						<p className="text-xs text-gray-500">Placed</p>
						<p className="text-sm text-gray-300">{orderDate}</p>
					</div>

					<div>
						<p className="text-xs text-gray-500">Items</p>
						<p className="text-sm text-gray-300">
							{order.products.length} item{order.products.length !== 1 ? "s" : ""}
						</p>
					</div>

					<div>
						<p className="text-xs text-gray-500">Total</p>
						<p className="text-sm font-bold text-emerald-400">
							${order.totalAmount.toFixed(2)}
						</p>
					</div>

					<div className="flex items-center gap-2">
						<StatusBadge status={order.status} />
						{expanded
							? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
							: <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
						}
					</div>
				</div>

				{expanded && (
					<div className="border-t border-gray-700 p-4 sm:p-5 space-y-5">

						<div>
							<p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
								Items Ordered
							</p>
							<div className="space-y-3">
								{order.products.map((item, i) => {
									const product = item.product;
									return (
										<div key={i} className="flex items-center gap-3">
											{product?.image ? (
												<img
													src={product.image}
													alt={product.name}
													className="w-14 h-14 rounded-lg object-cover bg-gray-700 flex-shrink-0"
												/>
											) : (
												<div className="w-14 h-14 rounded-lg bg-gray-700 flex-shrink-0 flex items-center justify-center">
													<Package className="w-6 h-6 text-gray-500" />
												</div>
											)}
											<div className="flex-1 min-w-0">
												<p className="text-sm font-medium text-white truncate">
													{product?.name || "Product unavailable"}
												</p>
												<p className="text-xs text-gray-400">
													Qty: {item.quantity} &times; ${item.price.toFixed(2)}
												</p>
											</div>
											<p className="text-sm font-semibold text-emerald-400 flex-shrink-0">
												${(item.quantity * item.price).toFixed(2)}
											</p>
										</div>
									);
								})}
							</div>
						</div>

						{order.trackingNumber && (
							<div className="bg-gray-700/50 rounded-lg p-3">
								<div className="flex items-center gap-2 mb-1">
									<Truck className="w-4 h-4 text-emerald-400" />
									<p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
										Tracking
									</p>
								</div>
								<p className="text-sm text-white font-mono">
									{order.trackingCarrier && `${order.trackingCarrier} — `}
									{order.trackingNumber}
								</p>
								{order.estimatedDelivery && (
									<p className="text-xs text-gray-400 mt-1">
										Estimated delivery:{" "}
										{new Date(order.estimatedDelivery).toLocaleDateString()}
									</p>
								)}
							</div>
						)}

						{order.shippingAddress?.addressLine1 && (
							<div className="bg-gray-700/50 rounded-lg p-3">
								<div className="flex items-center gap-2 mb-1">
									<MapPin className="w-4 h-4 text-emerald-400" />
									<p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
										Shipping To
									</p>
								</div>
								<p className="text-sm text-white">{order.shippingAddress.fullName}</p>
								<p className="text-xs text-gray-400">
									{order.shippingAddress.addressLine1}
									{order.shippingAddress.addressLine2 && `, ${order.shippingAddress.addressLine2}`},
									{" "}{order.shippingAddress.city}
									{order.shippingAddress.state && `, ${order.shippingAddress.state}`}{" "}
									{order.shippingAddress.postalCode}, {order.shippingAddress.country}
								</p>
								{order.shippingAddress.phone && (
									<p className="text-xs text-gray-400 mt-0.5">{order.shippingAddress.phone}</p>
								)}
							</div>
						)}

						{order.statusHistory?.length > 0 && (
							<div>
								<p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
									Order Timeline
								</p>
								<div className="space-y-2.5">
									{[...order.statusHistory].reverse().map((h, i) => (
										<div key={i} className="flex items-start gap-3">
											<div
												className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
													i === 0 ? "bg-emerald-400" : "bg-gray-600"
												}`}
											/>
											<div>
												<p className="text-xs font-semibold text-white capitalize">
													{h.status.replace(/_/g, " ")}
												</p>
												{h.note && (
													<p className="text-xs text-gray-400">{h.note}</p>
												)}
												<p className="text-xs text-gray-500">
													{new Date(h.changedAt).toLocaleString()}
												</p>
											</div>
										</div>
									))}
								</div>
							</div>
						)}

						{order.cancelReason && (
							<p className="text-xs text-gray-400 italic border-l-2 border-red-500/40 pl-3">
								Cancellation reason: {order.cancelReason}
							</p>
						)}
						{order.returnReason && (
							<p className="text-xs text-gray-400 italic border-l-2 border-orange-500/40 pl-3">
								Return reason: {order.returnReason}
							</p>
						)}
						{order.exchangeReason && (
							<p className="text-xs text-gray-400 italic border-l-2 border-cyan-500/40 pl-3">
								Exchange reason: {order.exchangeReason}
							</p>
						)}
						{order.status === "refunded" && order.refundAmount > 0 && (
							<p className="text-xs text-gray-400 italic border-l-2 border-gray-500/40 pl-3">
								Refund of ${order.refundAmount.toFixed(2)} has been processed back to your payment method.
							</p>
						)}

						{(canCancel || canReturn || canExchange) && (
							<div className="flex flex-wrap gap-2 pt-1 border-t border-gray-700">
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
						)}
					</div>
				)}
			</div>
		</>
	);
};

const OrdersPage = () => {
	const [orders, setOrders]   = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError]     = useState(null);

	useEffect(() => {
		const fetchOrders = async () => {
			try {
				setLoading(true);
				setError(null);
				const res = await axios.get("/orders/my-orders");
				setOrders(res.data);
			} catch (err) {
				console.error("Failed to fetch orders:", err);
				setError(err.response?.data?.message || "Failed to load your orders. Please try again.");
				toast.error("Could not load orders");
			} finally {
				setLoading(false);
			}
		};
		fetchOrders();
	}, []);

	const handleOrderUpdate = (updatedOrder) => {
		setOrders((prev) =>
			prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o))
		);
	};

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

				{loading && (
					<div className="flex justify-center py-24">
						<Loader className="w-8 h-8 text-emerald-400 animate-spin" />
					</div>
				)}

				{!loading && error && (
					<div className="text-center py-16 bg-gray-800 rounded-xl border border-red-500/30 px-6">
						<XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
						<p className="text-red-400 font-medium mb-2">Something went wrong</p>
						<p className="text-gray-400 text-sm mb-5">{error}</p>
						<button
							onClick={() => window.location.reload()}
							className="px-5 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
						>
							Try Again
						</button>
					</div>
				)}

				{!loading && !error && orders.length === 0 && (
					<motion.div
						className="text-center py-24"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
					>
						<ShoppingBag className="w-16 h-16 text-gray-600 mx-auto mb-4" />
						<h2 className="text-xl font-semibold text-gray-300 mb-2">No orders yet</h2>
						<p className="text-gray-500 mb-6">
							When you place an order, it will appear here.
						</p>
						<Link
							to="/"
							className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
						>
							Start Shopping <ArrowRight className="w-4 h-4" />
						</Link>
					</motion.div>
				)}

				{!loading && !error && orders.length > 0 && (
					<div className="space-y-4">
						<p className="text-sm text-gray-500">
							{orders.length} order{orders.length !== 1 ? "s" : ""} found
						</p>
						{orders.map((order, i) => (
							<motion.div
								key={order._id}
								initial={{ opacity: 0, y: 16 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: i * 0.04 }}
							>
								<OrderCard order={order} onOrderUpdate={handleOrderUpdate} />
							</motion.div>
						))}
					</div>
				)}
			</div>
		</div>
	);
};

export default OrdersPage;

