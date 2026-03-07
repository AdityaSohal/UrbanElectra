import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOrderStore } from "../stores/useOrderStore";
import {
	Search, Filter, ChevronLeft, ChevronRight, Package,
	Truck, RefreshCw, DollarSign, X, Loader, ChevronDown,
	ChevronUp, MapPin, Clock, CheckCircle, XCircle,
	RotateCcw, AlertCircle, Eye,
} from "lucide-react";

const STATUS_CONFIG = {
	pending: { label: "Pending", color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" },
	confirmed: { label: "Confirmed", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
	processing: { label: "Processing", color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
	shipped: { label: "Shipped", color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30" },
	delivered: { label: "Delivered", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
	cancelled: { label: "Cancelled", color: "bg-red-500/20 text-red-300 border-red-500/30" },
	return_requested: { label: "Return Requested", color: "bg-orange-500/20 text-orange-300 border-orange-500/30" },
	returned: { label: "Returned", color: "bg-orange-500/20 text-orange-300 border-orange-500/30" },
	exchange_requested: { label: "Exchange Requested", color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" },
	exchanged: { label: "Exchanged", color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" },
	refunded: { label: "Refunded", color: "bg-gray-400/20 text-gray-300 border-gray-400/30" },
};

const ALL_STATUSES = Object.keys(STATUS_CONFIG);

const StatusBadge = ({ status }) => {
	const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
	return (
		<span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>
			{cfg.label}
		</span>
	);
};

const StatCard = ({ label, value, sub, color }) => (
	<div className={`rounded-lg p-4 border ${color} bg-gray-800`}>
		<p className="text-xs text-gray-400 mb-1">{label}</p>
		<p className="text-2xl font-bold text-white">{value}</p>
		{sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
	</div>
);

const TrackingModal = ({ order, onClose, onSave }) => {
	const [form, setForm] = useState({
		trackingNumber: order.trackingNumber || "",
		trackingCarrier: order.trackingCarrier || "",
		estimatedDelivery: order.estimatedDelivery
			? new Date(order.estimatedDelivery).toISOString().split("T")[0]
			: "",
	});
	const { loading } = useOrderStore();

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<div className="absolute inset-0 bg-black/70" onClick={onClose} />
			<motion.div
				className="relative bg-gray-800 rounded-xl border border-gray-700 p-6 w-full max-w-md shadow-2xl"
				initial={{ opacity: 0, scale: 0.95 }}
				animate={{ opacity: 1, scale: 1 }}
			>
				<div className="flex items-center justify-between mb-5">
					<h3 className="text-lg font-semibold text-white flex items-center gap-2">
						<Truck className="w-5 h-5 text-emerald-400" /> Set Tracking Info
					</h3>
					<button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
				</div>
				<div className="space-y-3">
					<div>
						<label className="block text-xs text-gray-400 mb-1">Carrier</label>
						<input
							className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
							placeholder="FedEx, UPS, USPS, DHL..."
							value={form.trackingCarrier}
							onChange={(e) => setForm({ ...form, trackingCarrier: e.target.value })}
						/>
					</div>
					<div>
						<label className="block text-xs text-gray-400 mb-1">Tracking Number</label>
						<input
							className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
							placeholder="1Z999AA10123456784"
							value={form.trackingNumber}
							onChange={(e) => setForm({ ...form, trackingNumber: e.target.value })}
						/>
					</div>
					<div>
						<label className="block text-xs text-gray-400 mb-1">Estimated Delivery</label>
						<input
							type="date"
							className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
							value={form.estimatedDelivery}
							onChange={(e) => setForm({ ...form, estimatedDelivery: e.target.value })}
						/>
					</div>
				</div>
				<div className="flex gap-3 mt-5">
					<button onClick={onClose} className="flex-1 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-medium transition-colors">
						Cancel
					</button>
					<button
						onClick={() => onSave(form.trackingNumber, form.trackingCarrier, form.estimatedDelivery)}
						disabled={loading}
						className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
					>
						{loading && <Loader className="w-4 h-4 animate-spin" />}
						Save Tracking
					</button>
				</div>
			</motion.div>
		</div>
	);
};

const RefundModal = ({ order, onClose, onConfirm }) => {
	const [amount, setAmount] = useState("");
	const { loading } = useOrderStore();

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<div className="absolute inset-0 bg-black/70" onClick={onClose} />
			<motion.div
				className="relative bg-gray-800 rounded-xl border border-gray-700 p-6 w-full max-w-md shadow-2xl"
				initial={{ opacity: 0, scale: 0.95 }}
				animate={{ opacity: 1, scale: 1 }}
			>
				<div className="flex items-center justify-between mb-5">
					<h3 className="text-lg font-semibold text-white flex items-center gap-2">
						<DollarSign className="w-5 h-5 text-emerald-400" /> Process Refund
					</h3>
					<button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
				</div>
				<p className="text-sm text-gray-400 mb-4">
					Order total: <span className="text-white font-semibold">${order.totalAmount.toFixed(2)}</span>.
					Leave amount empty for a full refund.
				</p>
				<div>
					<label className="block text-xs text-gray-400 mb-1">Refund Amount (USD)</label>
					<input
						type="number"
						step="0.01"
						className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
						placeholder={`Leave empty for full refund ($${order.totalAmount.toFixed(2)})`}
						value={amount}
						onChange={(e) => setAmount(e.target.value)}
					/>
				</div>
				<div className="flex gap-3 mt-5">
					<button onClick={onClose} className="flex-1 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-medium transition-colors">
						Cancel
					</button>
					<button
						onClick={() => onConfirm(amount ? parseFloat(amount) : undefined)}
						disabled={loading}
						className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
					>
						{loading && <Loader className="w-4 h-4 animate-spin" />}
						Confirm Refund
					</button>
				</div>
			</motion.div>
		</div>
	);
};

const OrderDetailDrawer = ({ order, onClose }) => {
	if (!order) return null;
	return (
		<div className="fixed inset-0 z-40 flex">
			<div className="absolute inset-0 bg-black/50" onClick={onClose} />
			<motion.div
				className="relative ml-auto w-full max-w-lg bg-gray-900 border-l border-gray-700 h-full overflow-y-auto p-6"
				initial={{ x: "100%" }}
				animate={{ x: 0 }}
				exit={{ x: "100%" }}
				transition={{ type: "tween", duration: 0.25 }}
			>
				<div className="flex items-center justify-between mb-6">
					<h2 className="text-lg font-semibold text-white">
						Order #{order._id.slice(-8).toUpperCase()}
					</h2>
					<button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
				</div>

				<div className="mb-5">
					<p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Customer</p>
					<p className="text-sm text-white">{order.user?.name}</p>
					<p className="text-xs text-gray-400">{order.user?.email}</p>
				</div>

				<div className="mb-5">
					<p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Items</p>
					<div className="space-y-3">
						{order.products.map((item, i) => (
							<div key={i} className="flex items-center gap-3">
								<img src={item.product?.image} className="w-12 h-12 rounded-lg object-cover bg-gray-700" />
								<div className="flex-1">
									<p className="text-sm text-white">{item.product?.name}</p>
									<p className="text-xs text-gray-400">Qty: {item.quantity} × ${item.price.toFixed(2)}</p>
								</div>
								<p className="text-sm text-emerald-400">${(item.quantity * item.price).toFixed(2)}</p>
							</div>
						))}
					</div>
					<div className="border-t border-gray-700 mt-3 pt-3 flex justify-between">
						<span className="text-sm font-semibold text-gray-300">Total</span>
						<span className="text-sm font-bold text-emerald-400">${order.totalAmount.toFixed(2)}</span>
					</div>
				</div>

				{order.shippingAddress && (
					<div className="mb-5">
						<p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Ship To</p>
						<p className="text-sm text-white">{order.shippingAddress.fullName}</p>
						<p className="text-xs text-gray-400">
							{order.shippingAddress.addressLine1}{order.shippingAddress.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ""},{" "}
							{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}, {order.shippingAddress.country}
						</p>
						{order.shippingAddress.phone && <p className="text-xs text-gray-400">{order.shippingAddress.phone}</p>}
					</div>
				)}

				{order.trackingNumber && (
					<div className="mb-5 bg-gray-800 rounded-lg p-3">
						<p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Tracking</p>
						<p className="text-sm text-white font-mono">{order.trackingCarrier} — {order.trackingNumber}</p>
						{order.estimatedDelivery && (
							<p className="text-xs text-gray-400 mt-1">Est. delivery: {new Date(order.estimatedDelivery).toLocaleDateString()}</p>
						)}
					</div>
				)}

				{order.statusHistory?.length > 0 && (
					<div>
						<p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Timeline</p>
						<div className="space-y-2">
							{[...order.statusHistory].reverse().map((h, i) => (
								<div key={i} className="flex items-start gap-3">
									<div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${i === 0 ? "bg-emerald-400" : "bg-gray-600"}`} />
									<div>
										<p className="text-xs font-medium text-white capitalize">{h.status.replace(/_/g, " ")}</p>
										{h.note && <p className="text-xs text-gray-400">{h.note}</p>}
										<p className="text-xs text-gray-500">{new Date(h.changedAt).toLocaleString()}</p>
									</div>
								</div>
							))}
						</div>
					</div>
				)}
			</motion.div>
		</div>
	);
};

const OrdersTab = () => {
	const {
		adminOrders, adminTotal, adminTotalPages, adminPage,
		orderStats, loading,
		fetchAllOrders, fetchOrderStats,
		updateOrderStatus, setTrackingInfo, processRefund,
	} = useOrderStore();

	const [statusFilter, setStatusFilter] = useState("all");
	const [search, setSearch] = useState("");
	const [searchInput, setSearchInput] = useState("");
	const [trackingModal, setTrackingModal] = useState(null);
	const [refundModal, setRefundModal] = useState(null);
	const [detailOrder, setDetailOrder] = useState(null);
	const [expandedRow, setExpandedRow] = useState(null);

	useEffect(() => {
		fetchOrderStats();
	}, [fetchOrderStats]);

	useEffect(() => {
		fetchAllOrders({ status: statusFilter, search, page: 1, limit: 20 });
	}, [statusFilter, search]);

	const handlePageChange = (newPage) => {
		fetchAllOrders({ status: statusFilter, search, page: newPage, limit: 20 });
	};

	const handleSearch = (e) => {
		e.preventDefault();
		setSearch(searchInput);
	};

	const totalOrders = Object.values(orderStats).reduce((s, v) => s + (v.count || 0), 0);
	const pendingCount = (orderStats.pending?.count || 0) + (orderStats.confirmed?.count || 0) + (orderStats.processing?.count || 0);
	const returnCount = (orderStats.return_requested?.count || 0) + (orderStats.exchange_requested?.count || 0);
	const totalRevenue = Object.values(orderStats).reduce((s, v) => s + (v.revenue || 0), 0);

	return (
		<>
			{trackingModal && (
				<TrackingModal
					order={trackingModal}
					onClose={() => setTrackingModal(null)}
					onSave={async (tn, tc, ed) => {
						const ok = await setTrackingInfo(trackingModal._id, tn, tc, ed);
						if (ok) setTrackingModal(null);
					}}
				/>
			)}

			{refundModal && (
				<RefundModal
					order={refundModal}
					onClose={() => setRefundModal(null)}
					onConfirm={async (amount) => {
						const ok = await processRefund(refundModal._id, amount);
						if (ok) setRefundModal(null);
					}}
				/>
			)}

			<AnimatePresence>
				{detailOrder && (
					<OrderDetailDrawer order={detailOrder} onClose={() => setDetailOrder(null)} />
				)}
			</AnimatePresence>

			<div className="max-w-7xl mx-auto px-4">
				<div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
					<StatCard label="Total Orders" value={totalOrders} color="border-gray-700" />
					<StatCard label="Active Orders" value={pendingCount} sub="pending + processing" color="border-yellow-700/40" />
					<StatCard label="Returns / Exchanges" value={returnCount} sub="awaiting review" color="border-orange-700/40" />
					<StatCard label="Total Revenue" value={`$${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} color="border-emerald-700/40" />
				</div>

				<div className="flex flex-wrap items-center gap-3 mb-5">
					<form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 min-w-[200px]">
						<div className="relative flex-1">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
							<input
								className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
								placeholder="Search by customer name or email..."
								value={searchInput}
								onChange={(e) => setSearchInput(e.target.value)}
							/>
						</div>
						<button type="submit" className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg transition-colors">
							Search
						</button>
						{search && (
							<button type="button" onClick={() => { setSearch(""); setSearchInput(""); }} className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-lg transition-colors">
								<X className="w-4 h-4" />
							</button>
						)}
					</form>

					<div className="flex flex-wrap gap-1.5">
						<button
							onClick={() => setStatusFilter("all")}
							className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFilter === "all" ? "bg-emerald-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
						>
							All ({totalOrders})
						</button>
						{["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "return_requested", "exchange_requested", "refunded"].map((s) => (
							<button
								key={s}
								onClick={() => setStatusFilter(s)}
								className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFilter === s ? "bg-emerald-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
							>
								{STATUS_CONFIG[s]?.label} {orderStats[s] ? `(${orderStats[s].count})` : ""}
							</button>
						))}
					</div>
				</div>

				<div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
					{loading && adminOrders.length === 0 ? (
						<div className="flex justify-center py-16">
							<Loader className="w-8 h-8 text-emerald-400 animate-spin" />
						</div>
					) : adminOrders.length === 0 ? (
						<div className="text-center py-16 text-gray-400">
							<Package className="w-10 h-10 mx-auto mb-3 opacity-40" />
							<p>No orders found</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="min-w-full divide-y divide-gray-700">
								<thead className="bg-gray-750">
									<tr>
										{["Order", "Customer", "Date", "Total", "Status", "Actions"].map((h) => (
											<th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
												{h}
											</th>
										))}
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-700">
									{adminOrders.map((order) => (
										<>
											<tr
												key={order._id}
												className="hover:bg-gray-700/50 transition-colors cursor-pointer"
												onClick={() => setExpandedRow(expandedRow === order._id ? null : order._id)}
											>
												<td className="px-4 py-3">
													<div className="flex items-center gap-2">
														<div className="flex -space-x-2">
															{order.products.slice(0, 3).map((item, i) => (
																<img key={i} src={item.product?.image} className="w-8 h-8 rounded-full object-cover border-2 border-gray-800" />
															))}
														</div>
														<div>
															<p className="text-xs font-mono text-white">#{order._id.slice(-8).toUpperCase()}</p>
															<p className="text-xs text-gray-400">{order.products.length} item{order.products.length !== 1 ? "s" : ""}</p>
														</div>
													</div>
												</td>
												<td className="px-4 py-3">
													<p className="text-sm text-white">{order.user?.name}</p>
													<p className="text-xs text-gray-400">{order.user?.email}</p>
												</td>
												<td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
													{new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
												</td>
												<td className="px-4 py-3">
													<span className="text-sm font-semibold text-emerald-400">${order.totalAmount.toFixed(2)}</span>
												</td>
												<td className="px-4 py-3">
													<StatusBadge status={order.status} />
												</td>
												<td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
													<div className="flex items-center gap-1.5 flex-wrap">
														<select
															className="bg-gray-700 border border-gray-600 text-gray-300 text-xs rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500"
															value={order.status}
															onChange={(e) => updateOrderStatus(order._id, e.target.value)}
														>
															{ALL_STATUSES.map((s) => (
																<option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
															))}
														</select>

														<button
															onClick={() => setTrackingModal(order)}
															className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 transition-colors"
															title="Set Tracking"
														>
															<Truck className="w-3.5 h-3.5" />
														</button>

														<button
															onClick={() => setRefundModal(order)}
															className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 transition-colors"
															title="Process Refund"
														>
															<DollarSign className="w-3.5 h-3.5" />
														</button>

														<button
															onClick={() => setDetailOrder(order)}
															className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 transition-colors"
															title="View Details"
														>
															<Eye className="w-3.5 h-3.5" />
														</button>
													</div>
												</td>
											</tr>

											{expandedRow === order._id && (
												<tr key={`${order._id}-expand`} className="bg-gray-700/30">
													<td colSpan={6} className="px-4 py-3">
														<div className="flex flex-wrap gap-6 text-xs text-gray-400">
															{order.shippingAddress && (
																<div>
																	<span className="text-gray-500 uppercase tracking-wider">Ship To: </span>
																	<span className="text-gray-300">
																		{order.shippingAddress.fullName}, {order.shippingAddress.city}, {order.shippingAddress.country}
																	</span>
																</div>
															)}
															{order.trackingNumber && (
																<div>
																	<span className="text-gray-500 uppercase tracking-wider">Tracking: </span>
																	<span className="text-gray-300 font-mono">{order.trackingCarrier} {order.trackingNumber}</span>
																</div>
															)}
															{order.cancelReason && (
																<div>
																	<span className="text-gray-500 uppercase tracking-wider">Cancel reason: </span>
																	<span className="text-gray-300">{order.cancelReason}</span>
																</div>
															)}
															{order.returnReason && (
																<div>
																	<span className="text-gray-500 uppercase tracking-wider">Return reason: </span>
																	<span className="text-gray-300">{order.returnReason}</span>
																</div>
															)}
															{order.exchangeReason && (
																<div>
																	<span className="text-gray-500 uppercase tracking-wider">Exchange reason: </span>
																	<span className="text-gray-300">{order.exchangeReason}</span>
																</div>
															)}
															{order.stripeRefundId && (
																<div>
																	<span className="text-gray-500 uppercase tracking-wider">Refunded: </span>
																	<span className="text-emerald-400">${order.refundAmount?.toFixed(2)}</span>
																</div>
															)}
														</div>
													</td>
												</tr>
											)}
										</>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>

				{adminTotalPages > 1 && (
					<div className="flex items-center justify-between mt-4">
						<p className="text-sm text-gray-400">
							Showing {adminOrders.length} of {adminTotal} orders
						</p>
						<div className="flex items-center gap-2">
							<button
								onClick={() => handlePageChange(adminPage - 1)}
								disabled={adminPage === 1}
								className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
							>
								<ChevronLeft className="w-4 h-4" />
							</button>
							<span className="text-sm text-gray-300">Page {adminPage} of {adminTotalPages}</span>
							<button
								onClick={() => handlePageChange(adminPage + 1)}
								disabled={adminPage === adminTotalPages}
								className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
							>
								<ChevronRight className="w-4 h-4" />
							</button>
						</div>
					</div>
				)}
			</div>
		</>
	);
};

export default OrdersTab;

