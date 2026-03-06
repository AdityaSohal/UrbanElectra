import axios from "axios";

// ✅ Fix #5: import.meta.mode → import.meta.env.MODE (correct Vite API)
const axiosInstance = axios.create({
	baseURL: import.meta.env.MODE === "development" ? "http://localhost:5000/api" : "/api",
	withCredentials: true, // required so cookies are sent with every request
});

export default axiosInstance;