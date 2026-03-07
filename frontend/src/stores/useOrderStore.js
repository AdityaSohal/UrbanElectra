import { create } from "zustand";
import axios from "../lib/axios";
import toast from "react-hot-toast";

export const useOrderStore = create((set, get) => ({
	orders: [],
	currentOrder: null,
	loading: false,
	adminOrders: [],
	adminTotal: 0,
	adminTotalPages: 1,
	adminPage: 1,
	orderStats: {},

	// ─── Customer ────────────────────────────────────────────────
	fetchMyOrders: async () => {
		set({ loading: true });
		try {
			const res = await axios.get("/orders/my-orders");
			set({ orders: res.data, loading: false });
		} catch (error) {
			set({ loading: false });
			toast.error(error.response?.data?.message || "Failed to fetch orders");
		}
	},

	fetchOrderById: async (id) => {
		set({ loading: true });
		try {
			const res = await axios.get(`/orders/${id}`);
			set({ currentOrder: res.data, loading: false });
		} catch (error) {
			set({ loading: false });
			toast.error(error.response?.data?.message || "Failed to fetch order");
		}
	},

	cancelOrder: async (id, reason) => {
		set({ loading: true });
		try {
			const res = await axios.post(`/orders/${id}/cancel`, { reason });
			set((state) => ({
				loading: false,
				orders: state.orders.map((o) => (o._id === id ? res.data.order : o)),
				currentOrder:
					state.currentOrder?._id === id ? res.data.order : state.currentOrder,
			}));
			toast.success("Order cancelled successfully");
			return true;
		} catch (error) {
			set({ loading: false });
			toast.error(error.response?.data?.message || "Failed to cancel order");
			return false;
		}
	},

	requestReturn: async (id, reason) => {
		set({ loading: true });
		try {
			const res = await axios.post(`/orders/${id}/return`, { reason });
			set((state) => ({
				loading: false,
				orders: state.orders.map((o) => (o._id === id ? res.data.order : o)),
				currentOrder:
					state.currentOrder?._id === id ? res.data.order : state.currentOrder,
			}));
			toast.success("Return request submitted");
			return true;
		} catch (error) {
			set({ loading: false });
			toast.error(error.response?.data?.message || "Failed to submit return");
			return false;
		}
	},

	requestExchange: async (id, reason) => {
		set({ loading: true });
		try {
			const res = await axios.post(`/orders/${id}/exchange`, { reason });
			set((state) => ({
				loading: false,
				orders: state.orders.map((o) => (o._id === id ? res.data.order : o)),
				currentOrder:
					state.currentOrder?._id === id ? res.data.order : state.currentOrder,
			}));
			toast.success("Exchange request submitted");
			return true;
		} catch (error) {
			set({ loading: false });
			toast.error(error.response?.data?.message || "Failed to submit exchange");
			return false;
		}
	},

	// ─── Admin ───────────────────────────────────────────────────
	fetchAllOrders: async (filters = {}) => {
		set({ loading: true });
		try {
			const params = new URLSearchParams(
				// Remove empty values so they don't pollute query string
				Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== "" && v !== undefined))
			).toString();
			const res = await axios.get(`/orders/admin/all${params ? `?${params}` : ""}`);
			set({
				adminOrders: res.data.orders,
				adminTotal: res.data.total,
				adminTotalPages: res.data.totalPages,
				adminPage: res.data.page,
				loading: false,
			});
		} catch (error) {
			set({ loading: false });
			toast.error(error.response?.data?.message || "Failed to fetch orders");
		}
	},

	fetchOrderStats: async () => {
		try {
			const res = await axios.get("/orders/admin/stats");
			set({ orderStats: res.data });
		} catch (error) {
			console.error("Failed to fetch order stats:", error.message);
		}
	},

	updateOrderStatus: async (id, status, note = "") => {
		try {
			const res = await axios.patch(`/orders/admin/${id}/status`, { status, note });
			set((state) => ({
				adminOrders: state.adminOrders.map((o) =>
					o._id === id ? res.data.order : o
				),
				currentOrder:
					state.currentOrder?._id === id ? res.data.order : state.currentOrder,
			}));
			toast.success("Status updated");
			return true;
		} catch (error) {
			toast.error(error.response?.data?.message || "Failed to update status");
			return false;
		}
	},

	setTrackingInfo: async (id, trackingNumber, trackingCarrier, estimatedDelivery) => {
		try {
			const res = await axios.patch(`/orders/admin/${id}/tracking`, {
				trackingNumber,
				trackingCarrier,
				estimatedDelivery,
			});
			set((state) => ({
				adminOrders: state.adminOrders.map((o) =>
					o._id === id ? res.data.order : o
				),
			}));
			toast.success("Tracking info updated");
			return true;
		} catch (error) {
			toast.error(error.response?.data?.message || "Failed to update tracking");
			return false;
		}
	},

	processRefund: async (id, amount) => {
		try {
			const res = await axios.post(`/orders/admin/${id}/refund`, { amount });
			set((state) => ({
				adminOrders: state.adminOrders.map((o) =>
					o._id === id ? res.data.order : o
				),
			}));
			toast.success(`Refund of $${res.data.refund.amount / 100} processed`);
			return true;
		} catch (error) {
			toast.error(error.response?.data?.message || "Failed to process refund");
			return false;
		}
	},
}));