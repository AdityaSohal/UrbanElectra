import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";

// Statuses that should NOT count toward revenue or sales figures
const EXCLUDED_STATUSES = ["cancelled", "refunded", "returned"];

export const getAnalyticsData = async () => {
	const totalUsers    = await User.countDocuments();
	const totalProducts = await Product.countDocuments();

	const salesData = await Order.aggregate([
		{
			// Only count orders that are active / completed
			$match: {
				status: { $nin: EXCLUDED_STATUSES },
			},
		},
		{
			$group: {
				_id: null,
				totalSales:   { $sum: 1 },
				totalRevenue: { $sum: "$totalAmount" },
			},
		},
	]);

	const { totalSales, totalRevenue } = salesData[0] || {
		totalSales: 0,
		totalRevenue: 0,
	};

	// Also return a breakdown by status so the frontend can show richer data
	const statusBreakdown = await Order.aggregate([
		{
			$group: {
				_id:     "$status",
				count:   { $sum: 1 },
				revenue: { $sum: "$totalAmount" },
			},
		},
	]);

	const byStatus = {};
	statusBreakdown.forEach((s) => {
		byStatus[s._id] = { count: s.count, revenue: s.revenue };
	});

	// Refunded amount — useful to show separately on the dashboard
	const refundedData = await Order.aggregate([
		{ $match: { status: "refunded" } },
		{
			$group: {
				_id:            null,
				refundedOrders: { $sum: 1 },
				refundedAmount: { $sum: "$refundAmount" },
			},
		},
	]);

	const { refundedOrders, refundedAmount } = refundedData[0] || {
		refundedOrders: 0,
		refundedAmount: 0,
	};

	return {
		users:          totalUsers,
		products:       totalProducts,
		totalSales,               // excludes cancelled / refunded / returned
		totalRevenue,             // excludes cancelled / refunded / returned
		refundedOrders,           // count of refunded orders
		refundedAmount,           // total $ refunded
		byStatus,                 // full breakdown per status
	};
};

export const getDailySalesData = async (startDate, endDate) => {
	try {
		const dailySalesData = await Order.aggregate([
			{
				$match: {
					createdAt: {
						$gte: startDate,
						$lte: endDate,
					},
					// Exclude cancelled / refunded / returned from daily chart too
					status: { $nin: EXCLUDED_STATUSES },
				},
			},
			{
				$group: {
					_id:     { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
					sales:   { $sum: 1 },
					revenue: { $sum: "$totalAmount" },
				},
			},
			{ $sort: { _id: 1 } },
		]);

		const dateArray = getDatesInRange(startDate, endDate);

		return dateArray.map((date) => {
			const foundData = dailySalesData.find((item) => item._id === date);
			return {
				date,
				sales:   foundData?.sales   || 0,
				revenue: foundData?.revenue || 0,
			};
		});
	} catch (error) {
		throw error;
	}
};

function getDatesInRange(startDate, endDate) {
	const dates = [];
	let currentDate = new Date(startDate);
	while (currentDate <= endDate) {
		dates.push(currentDate.toISOString().split("T")[0]);
		currentDate.setDate(currentDate.getDate() + 1);
	}
	return dates;
}