import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Heart, ShoppingCart, Trash2, Loader, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import axios from "../lib/axios";
import { useCartStore } from "../stores/useCartStore";
import toast from "react-hot-toast";

const WishlistPage = () => {
	const [items, setItems]   = useState([]);
	const [loading, setLoading] = useState(true);
	const { addToCart } = useCartStore();

	useEffect(() => {
		axios.get("/products/wishlist/me")
			.then((r) => setItems(r.data))
			.catch(() => toast.error("Failed to load wishlist"))
			.finally(() => setLoading(false));
	}, []);

	const handleRemove = async (productId) => {
		try {
			await axios.post("/products/wishlist", { productId });
			setItems((prev) => prev.filter((p) => p._id !== productId));
			toast.success("Removed from wishlist");
		} catch {
			toast.error("Failed to remove item");
		}
	};

	const handleAddToCart = async (product) => {
		await addToCart(product);
	};

	return (
		<div className="min-h-screen py-12 px-4">
			<div className="max-w-5xl mx-auto">
				<div className="flex items-center gap-3 mb-8">
					<Heart className="w-7 h-7 text-red-400 fill-current" />
					<h1 className="text-3xl font-bold text-white">My Wishlist</h1>
				</div>

				{loading ? (
					<div className="flex justify-center py-24">
						<Loader className="w-8 h-8 text-emerald-400 animate-spin" />
					</div>
				) : items.length === 0 ? (
					<div className="text-center py-24">
						<Heart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
						<h2 className="text-xl font-semibold text-gray-300 mb-2">Your wishlist is empty</h2>
						<p className="text-gray-500 mb-6">Save items you love for later</p>
						<Link
							to="/"
							className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
						>
							Browse Products <ArrowRight className="w-4 h-4" />
						</Link>
					</div>
				) : (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
						{items.map((product, i) => (
							<motion.div
								key={product._id}
								initial={{ opacity: 0, y: 16 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: i * 0.05 }}
								className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden hover:border-gray-600 transition-colors group"
							>
								<Link to={`/product/${product._id}`} className="block">
									<div className="aspect-video overflow-hidden bg-gray-900">
										<img
											src={product.image}
											alt={product.name}
											className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
										/>
									</div>
								</Link>
								<div className="p-4">
									<Link to={`/product/${product._id}`}>
										<h3 className="text-white font-semibold mb-1 hover:text-emerald-400 transition-colors line-clamp-2">
											{product.name}
										</h3>
									</Link>
									<p className="text-emerald-400 font-bold text-lg mb-3">${product.price.toFixed(2)}</p>
									<div className="flex gap-2">
										<button
											onClick={() => handleAddToCart(product)}
											className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium py-2 rounded-lg transition-colors"
										>
											<ShoppingCart className="w-4 h-4" />
											Add to Cart
										</button>
										<button
											onClick={() => handleRemove(product._id)}
											className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 transition-colors"
											title="Remove from wishlist"
										>
											<Trash2 className="w-4 h-4" />
										</button>
									</div>
								</div>
							</motion.div>
						))}
					</div>
				)}
			</div>
		</div>
	);
};

export default WishlistPage;