import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "../lib/axios";
import { useCartStore } from "../stores/useCartStore";
import { useUserStore } from "../stores/useUserStore";
import toast from "react-hot-toast";
import {
	ShoppingCart, Heart, Star, ChevronLeft, ChevronRight,
	Package, Loader, AlertCircle, CheckCircle, Trash2
} from "lucide-react";

// ─── Star Rating Display ──────────────────────────────────────────────────────
const StarDisplay = ({ rating, size = "sm" }) => {
	const sz = size === "lg" ? "w-5 h-5" : "w-4 h-4";
	return (
		<div className="flex items-center gap-0.5">
			{[1, 2, 3, 4, 5].map((s) => (
				<Star
					key={s}
					className={`${sz} ${s <= Math.round(rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-600"}`}
				/>
			))}
		</div>
	);
};

// ─── Image Gallery ────────────────────────────────────────────────────────────
const ImageGallery = ({ images = [], name }) => {
	const [current, setCurrent] = useState(0);
	const allImages = images.filter(Boolean);

	if (allImages.length === 0) return (
		<div className="aspect-square bg-gray-800 rounded-xl flex items-center justify-center">
			<Package className="w-20 h-20 text-gray-600" />
		</div>
	);

	return (
		<div className="space-y-3">
			<div className="relative aspect-square bg-gray-800 rounded-xl overflow-hidden group">
				<AnimatePresence mode="wait">
					<motion.img
						key={current}
						src={allImages[current]}
						alt={`${name} ${current + 1}`}
						className="w-full h-full object-cover"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
					/>
				</AnimatePresence>

				{allImages.length > 1 && (
					<>
						<button
							onClick={() => setCurrent((c) => (c - 1 + allImages.length) % allImages.length)}
							className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
						>
							<ChevronLeft className="w-4 h-4" />
						</button>
						<button
							onClick={() => setCurrent((c) => (c + 1) % allImages.length)}
							className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
						>
							<ChevronRight className="w-4 h-4" />
						</button>
					</>
				)}
			</div>

			{allImages.length > 1 && (
				<div className="flex gap-2 overflow-x-auto pb-1">
					{allImages.map((img, i) => (
						<button
							key={i}
							onClick={() => setCurrent(i)}
							className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
								i === current ? "border-emerald-500" : "border-gray-700 hover:border-gray-500"
							}`}
						>
							<img src={img} alt="" className="w-full h-full object-cover" />
						</button>
					))}
				</div>
			)}
		</div>
	);
};

// ─── Review Form ──────────────────────────────────────────────────────────────
const ReviewForm = ({ productId, onSubmitted }) => {
	const [rating, setRating]   = useState(0);
	const [hovered, setHovered] = useState(0);
	const [comment, setComment] = useState("");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!rating) return toast.error("Please select a rating");
		if (!comment.trim()) return toast.error("Please write a comment");
		setLoading(true);
		try {
			const res = await axios.post(`/products/${productId}/reviews`, { rating, comment });
			toast.success("Review submitted!");
			onSubmitted(res.data.product);
			setRating(0); setComment("");
		} catch (err) {
			toast.error(err.response?.data?.message || "Failed to submit review");
		} finally {
			setLoading(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4 bg-gray-800 rounded-xl p-5 border border-gray-700">
			<h3 className="text-base font-semibold text-white">Write a Review</h3>

			<div>
				<label className="block text-xs text-gray-400 mb-2">Your Rating</label>
				<div className="flex gap-1">
					{[1, 2, 3, 4, 5].map((s) => (
						<button
							key={s}
							type="button"
							onMouseEnter={() => setHovered(s)}
							onMouseLeave={() => setHovered(0)}
							onClick={() => setRating(s)}
						>
							<Star
								className={`w-7 h-7 transition-colors ${
									s <= (hovered || rating)
										? "text-yellow-400 fill-yellow-400"
										: "text-gray-600"
								}`}
							/>
						</button>
					))}
				</div>
			</div>

			<div>
				<label className="block text-xs text-gray-400 mb-1.5">Your Review</label>
				<textarea
					rows={3}
					value={comment}
					onChange={(e) => setComment(e.target.value)}
					placeholder="Share your experience with this product…"
					className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2.5 text-sm
						text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
				/>
			</div>

			<button
				type="submit"
				disabled={loading}
				className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
			>
				{loading && <Loader className="w-4 h-4 animate-spin" />}
				Submit Review
			</button>
		</form>
	);
};

// ─── Page ─────────────────────────────────────────────────────────────────────
const ProductPage = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const { user } = useUserStore();
	const { addToCart } = useCartStore();

	const [product, setProduct]       = useState(null);
	const [loading, setLoading]       = useState(true);
	const [inWishlist, setInWishlist] = useState(false);
	const [wishlistLoading, setWishlistLoading] = useState(false);
	const [addingToCart, setAddingToCart] = useState(false);

	useEffect(() => {
		const fetchProduct = async () => {
			setLoading(true);
			try {
				const res = await axios.get(`/products/${id}`);
				setProduct(res.data);

				// Check wishlist
				if (user) {
					const wishRes = await axios.get("/products/wishlist/me");
					setInWishlist(wishRes.data.some((p) => p._id === id));
				}
			} catch (err) {
				toast.error("Product not found");
				navigate("/");
			} finally {
				setLoading(false);
			}
		};
		fetchProduct();
	}, [id, user]);

	const handleAddToCart = async () => {
		if (!user) { toast.error("Please login to add to cart", { id: "login" }); return; }
		setAddingToCart(true);
		await addToCart(product);
		setAddingToCart(false);
	};

	const handleToggleWishlist = async () => {
		if (!user) { toast.error("Please login to save items", { id: "login" }); return; }
		setWishlistLoading(true);
		try {
			const res = await axios.post("/products/wishlist", { productId: id });
			setInWishlist(res.data.added);
			toast.success(res.data.added ? "Added to wishlist" : "Removed from wishlist");
		} catch {
			toast.error("Failed to update wishlist");
		} finally {
			setWishlistLoading(false);
		}
	};

	const handleDeleteReview = async (reviewId) => {
		try {
			await axios.delete(`/products/${id}/reviews/${reviewId}`);
			const res = await axios.get(`/products/${id}`);
			setProduct(res.data);
			toast.success("Review deleted");
		} catch (err) {
			toast.error(err.response?.data?.message || "Failed to delete review");
		}
	};

	const allImages = product ? [product.image, ...(product.images || [])].filter(Boolean) : [];
	const stockStatus = product
		? product.stock > 10
			? { label: "In Stock", color: "text-emerald-400" }
			: product.stock > 0
			? { label: `Only ${product.stock} left`, color: "text-yellow-400" }
			: { label: "Out of Stock", color: "text-red-400" }
		: null;

	const userHasReviewed = product?.reviews?.some(
		(r) => r.user?._id?.toString() === user?._id?.toString()
	);

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Loader className="w-10 h-10 text-emerald-400 animate-spin" />
			</div>
		);
	}

	if (!product) return null;

	return (
		<div className="min-h-screen py-12 px-4">
			<div className="max-w-6xl mx-auto">
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-14">
					{/* Images */}
					<ImageGallery images={allImages} name={product.name} />

					{/* Info */}
					<div className="space-y-5">
						<div>
							<p className="text-sm text-emerald-400 font-medium capitalize mb-1">{product.category}</p>
							<h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">{product.name}</h1>

							<div className="flex items-center gap-3">
								<StarDisplay rating={product.rating} size="lg" />
								<span className="text-sm text-gray-400">
									{product.rating.toFixed(1)} ({product.numReviews} review{product.numReviews !== 1 ? "s" : ""})
								</span>
							</div>
						</div>

						<p className="text-3xl font-bold text-emerald-400">${product.price.toFixed(2)}</p>

						{/* Stock */}
						{stockStatus && (
							<div className={`flex items-center gap-2 text-sm font-medium ${stockStatus.color}`}>
								{product.stock > 0
									? <CheckCircle className="w-4 h-4" />
									: <AlertCircle className="w-4 h-4" />
								}
								{stockStatus.label}
							</div>
						)}

						<p className="text-gray-300 text-sm leading-relaxed">{product.description}</p>

						{/* Tags */}
						{product.tags?.length > 0 && (
							<div className="flex flex-wrap gap-2">
								{product.tags.map((tag) => (
									<span
										key={tag}
										className="px-2.5 py-1 bg-gray-700 text-gray-300 rounded-full text-xs"
									>
										{tag}
									</span>
								))}
							</div>
						)}

						{/* Actions */}
						<div className="flex gap-3 pt-2">
							<motion.button
								onClick={handleAddToCart}
								disabled={addingToCart || product.stock === 0}
								className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700
									disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-6
									rounded-xl transition-colors"
								whileTap={{ scale: 0.98 }}
							>
								{addingToCart
									? <Loader className="w-5 h-5 animate-spin" />
									: <ShoppingCart className="w-5 h-5" />
								}
								{product.stock === 0 ? "Out of Stock" : "Add to Cart"}
							</motion.button>

							<motion.button
								onClick={handleToggleWishlist}
								disabled={wishlistLoading}
								className={`p-3 rounded-xl border transition-colors ${
									inWishlist
										? "bg-red-500/20 border-red-500/40 text-red-400 hover:bg-red-500/30"
										: "bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500"
								}`}
								whileTap={{ scale: 0.95 }}
								title={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
							>
								<Heart className={`w-5 h-5 ${inWishlist ? "fill-current" : ""}`} />
							</motion.button>
						</div>
					</div>
				</div>

				{/* Reviews section */}
				<div className="space-y-6">
					<h2 className="text-xl font-bold text-white">
						Customer Reviews
						{product.numReviews > 0 && (
							<span className="text-gray-400 font-normal text-base ml-2">
								({product.numReviews})
							</span>
						)}
					</h2>

					{/* Review form */}
					{user && !userHasReviewed && (
						<ReviewForm productId={id} onSubmitted={setProduct} />
					)}
					{user && userHasReviewed && (
						<p className="text-sm text-gray-400 italic">You've already reviewed this product.</p>
					)}
					{!user && (
						<p className="text-sm text-gray-400">
							<button onClick={() => navigate("/login")} className="text-emerald-400 hover:underline">
								Log in
							</button>{" "}
							to leave a review.
						</p>
					)}

					{/* Reviews list */}
					{product.reviews?.length === 0 ? (
						<p className="text-gray-500 text-sm">No reviews yet. Be the first!</p>
					) : (
						<div className="space-y-4">
							{product.reviews.map((review) => (
								<div key={review._id} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
									<div className="flex items-start justify-between gap-3">
										<div className="flex items-center gap-3">
											<div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
												{review.name?.[0]?.toUpperCase()}
											</div>
											<div>
												<p className="text-sm font-semibold text-white">{review.name}</p>
												<StarDisplay rating={review.rating} />
											</div>
										</div>
										<div className="flex items-center gap-2">
											<p className="text-xs text-gray-500">
												{new Date(review.createdAt).toLocaleDateString()}
											</p>
											{(user?._id === review.user?._id || user?.role === "admin") && (
												<button
													onClick={() => handleDeleteReview(review._id)}
													className="text-gray-500 hover:text-red-400 transition-colors"
													title="Delete review"
												>
													<Trash2 className="w-4 h-4" />
												</button>
											)}
										</div>
									</div>
									<p className="text-sm text-gray-300 mt-3 leading-relaxed">{review.comment}</p>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default ProductPage;