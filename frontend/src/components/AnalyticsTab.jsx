import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import axios from "../lib/axios";
import { Users, Package, ShoppingCart, DollarSign, RotateCcw, TrendingDown } from "lucide-react";
import {
	LineChart, Line, XAxis, YAxis, CartesianGrid,
	Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const AnalyticsTab = () => {
	const [analyticsData, setAnalyticsData] = useState({
		users:          0,
		products:       0,
		totalSales:     0,
		totalRevenue:   0,
		refundedOrders: 0,
		refundedAmount: 0,
	});
	const [isLoading, setIsLoading]     = useState(true);
	const [dailySalesData, setDailySalesData] = useState([]);

	useEffect(() => {
		const fetchAnalyticsData = async () => {
			try {
				const response = await axios.get("/analytics");
				setAnalyticsData(response.data.analyticsData);
				setDailySalesData(response.data.dailySalesData);
			} catch (error) {
				console.error("Error fetching analytics data:", error);
			} finally {
				setIsLoading(false);
			}
		};
		fetchAnalyticsData();
	}, []);

	if (isLoading) {
		return (
			<div className="flex justify-center py-16">
				<div className="w-10 h-10 rounded-full border-4 border-emerald-900 relative">
					<div className="w-10 h-10 rounded-full border-4 border-emerald-400 border-t-transparent animate-spin absolute top-0 left-0" />
				</div>
			</div>
		);
	}

	return (
		<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
				<AnalyticsCard
					title="Total Users"
					value={analyticsData.users.toLocaleString()}
					icon={Users}
					color="from-emerald-500 to-teal-700"
					className="xl:col-span-1"
				/>
				<AnalyticsCard
					title="Total Products"
					value={analyticsData.products.toLocaleString()}
					icon={Package}
					color="from-emerald-500 to-green-700"
					className="xl:col-span-1"
				/>
				<AnalyticsCard
					title="Completed Sales"
					value={analyticsData.totalSales.toLocaleString()}
					icon={ShoppingCart}
					color="from-emerald-500 to-cyan-700"
					sub="Excludes cancelled & refunded"
					className="xl:col-span-1"
				/>
				<AnalyticsCard
					title="Net Revenue"
					value={`$${analyticsData.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
					icon={DollarSign}
					color="from-emerald-500 to-lime-700"
					sub="Excludes cancelled & refunded"
					className="xl:col-span-1"
				/>
				<AnalyticsCard
					title="Refunded Orders"
					value={analyticsData.refundedOrders.toLocaleString()}
					icon={RotateCcw}
					color="from-red-600 to-rose-800"
					sub="Total refund count"
					className="xl:col-span-1"
				/>
				<AnalyticsCard
					title="Refunded Amount"
					value={`$${analyticsData.refundedAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
					icon={TrendingDown}
					color="from-red-600 to-orange-800"
					sub="Total $ returned to customers"
					className="xl:col-span-1"
				/>
			</div>

			<motion.div
				className="bg-gray-800/60 rounded-lg p-6 shadow-lg"
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.25 }}
			>
				<p className="text-sm text-gray-400 mb-4">
					Daily chart excludes cancelled, refunded, and returned orders.
				</p>
				<ResponsiveContainer width="100%" height={400}>
					<LineChart data={dailySalesData}>
						<CartesianGrid strokeDasharray="3 3" />
						<XAxis dataKey="date" stroke="#D1D5DB" />
						<YAxis yAxisId="left"  stroke="#D1D5DB" />
						<YAxis yAxisId="right" orientation="right" stroke="#D1D5DB" />
						<Tooltip />
						<Legend />
						<Line
							yAxisId="left"
							type="monotone"
							dataKey="sales"
							stroke="#10B981"
							activeDot={{ r: 8 }}
							name="Sales"
						/>
						<Line
							yAxisId="right"
							type="monotone"
							dataKey="revenue"
							stroke="#3B82F6"
							activeDot={{ r: 8 }}
							name="Revenue ($)"
						/>
					</LineChart>
				</ResponsiveContainer>
			</motion.div>
		</div>
	);
};

export default AnalyticsTab;

const AnalyticsCard = ({ title, value, icon: Icon, color, sub, className = "" }) => (
	<motion.div
		className={`bg-gray-800 rounded-lg p-6 shadow-lg overflow-hidden relative ${className}`}
		initial={{ opacity: 0, y: 20 }}
		animate={{ opacity: 1, y: 0 }}
		transition={{ duration: 0.5 }}
	>
		<div className="flex justify-between items-start">
			<div className="z-10">
				<p className="text-emerald-300 text-sm mb-1 font-semibold">{title}</p>
				<h3 className="text-white text-2xl font-bold">{value}</h3>
				{sub && <p className="text-gray-500 text-xs mt-1">{sub}</p>}
			</div>
		</div>
		<div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-30`} />
		<div className="absolute -bottom-4 -right-4 text-emerald-800 opacity-50">
			<Icon className="h-32 w-32" />
		</div>
	</motion.div>
);

