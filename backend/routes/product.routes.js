import express from "express";
import {
	createProduct,
	updateProduct,
	deleteProduct,
	getAllProducts,
	getFeaturedProducts,
	getProductsByCategory,
	getRecommendedProducts,
	toggleFeaturedProduct,
	searchProducts,
	getProductById,
	createReview,
	deleteReview,
	getWishlist,
	toggleWishlist,
} from "../controllers/product.controller.js";
import { adminRoute, protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// ── Static routes FIRST (must come before /:id wildcard) ─────────────────────
router.get("/featured",           getFeaturedProducts);
router.get("/recommendations",    getRecommendedProducts);
router.get("/search",             searchProducts);
router.get("/wishlist/me",        protectRoute, getWishlist);   // FIX: was being swallowed by /:id
router.post("/wishlist",          protectRoute, toggleWishlist);
router.get("/category/:category", getProductsByCategory);

// ── Admin-only CRUD ───────────────────────────────────────────────────────────
router.get(   "/", protectRoute, adminRoute, getAllProducts);
router.post(  "/", protectRoute, adminRoute, createProduct);

// ── Parameterised routes LAST ─────────────────────────────────────────────────
router.get(    "/:id",    getProductById);
router.put(    "/:id",    protectRoute, adminRoute, updateProduct);
router.patch(  "/:id",    protectRoute, adminRoute, toggleFeaturedProduct);
router.delete( "/:id",    protectRoute, adminRoute, deleteProduct);

router.post(   "/:id/reviews",           protectRoute, createReview);
router.delete( "/:id/reviews/:reviewId", protectRoute, deleteReview);

export default router;