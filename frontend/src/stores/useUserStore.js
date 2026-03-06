import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

export const useUserStore = create((set, get) => ({
  user: null,
  loading: false,
  checkingAuth: true,

  signup: async ({ name, email, password, confirmPassword }) => {
    set({ loading: true });

    if (password !== confirmPassword) {
      set({ loading: false });
      return toast.error("Passwords do not match");
    }

    try {
      const res = await axios.post("/auth/signup", { name, email, password });
      set({ user: res.data, loading: false });
      toast.success(`Welcome, ${res.data.name}!`);
    } catch (error) {
      set({ loading: false });
      toast.error(error.response?.data?.message || "Signup failed. Please try again.");
    }
  },

  login: async (email, password) => {
    set({ loading: true });
    try {
      const res = await axios.post("/auth/login", { email, password });
      set({ user: res.data, loading: false });
      toast.success(`Welcome back, ${res.data.name}!`);
    } catch (error) {
      set({ loading: false });
      toast.error(error.response?.data?.message || "Login failed. Please try again.");
    }
  },

  // BUG FIX #3: logout no longer throws — clears user regardless of API response
  // This prevents the axios interceptor from catching a 401 on logout
  // and triggering an infinite refresh → logout → 401 loop
  logout: async () => {
    try {
      await axios.post("/auth/logout");
    } catch (_) {
      // Silently ignore — the server may already have invalidated the token.
      // We clear local state regardless.
    } finally {
      set({ user: null });
    }
  },

  // BUG FIX #1: This must be called in App.jsx useEffect on every mount
  // so the user is restored from the httpOnly cookie on page refresh
  checkAuth: async () => {
    set({ checkingAuth: true });
    try {
      const response = await axios.get("/auth/profile");
      set({ user: response.data, checkingAuth: false });
    } catch (error) {
      // Not logged in — that's fine, just clear auth state
      set({ checkingAuth: false, user: null });
    }
  },

  refreshToken: async () => {
    // Prevent a refresh attempt if we're already checking auth
    if (get().checkingAuth) return;

    set({ checkingAuth: true });
    try {
      const response = await axios.post("/auth/refresh-token");
      set({ checkingAuth: false });
      return response.data;
    } catch (error) {
      set({ user: null, checkingAuth: false });
      throw error;
    }
  },
}));

// ─── Axios Interceptor for Token Refresh ──────────────────────────────────────
// Intercepts 401 responses, attempts a single silent token refresh,
// then retries the original request. If refresh fails, logs out cleanly.

let refreshPromise = null;

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // If a refresh is already in progress, wait for it
        if (refreshPromise) {
          await refreshPromise;
          return axios(originalRequest);
        }

        // Kick off a new refresh
        refreshPromise = useUserStore.getState().refreshToken();
        await refreshPromise;
        refreshPromise = null;

        return axios(originalRequest);
      } catch (refreshError) {
        refreshPromise = null;

        // BUG FIX #3: Call logout() which now always resolves (no throw),
        // so we won't re-trigger this interceptor in an infinite loop
        await useUserStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);