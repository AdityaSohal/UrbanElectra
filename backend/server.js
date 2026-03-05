import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.route.js";
import productRoutes from "./routes/product.routes.js";
import cartRoutes from "./routes/cart.routes.js";         
import couponRoutes from "./routes/coupon.routes.js";     
import paymentRoutes from "./routes/payment.route.js";    
import analyticsRoutes from "./routes/analytical.route.js"; 
import { connectDB } from "./lib/db.js";
import cookieParser from "cookie-parser";

dotenv.config({quiet:true}); 

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);         
app.use("/api/coupons", couponRoutes);    
app.use("/api/payments", paymentRoutes);  
app.use("/api/analytics", analyticsRoutes); 

app.get("/health", (req, res) => {
	res.send("Server is healthy");
});

app.listen(PORT, () => {
	console.log(`Server is running on: http://localhost:${PORT}`);
	connectDB();
});