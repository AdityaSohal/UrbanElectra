import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Package, ChevronLeft, ChevronRight } from "lucide-react";
import axios from "../lib/axios";
import ProductCard from "../components/ProductCard";
import SearchBar from "../components/SearchBar";

// ─── Skeleton card ────────────────────────────────────────────────────────────
const ProductSkeleton = () => (
	<div className="rounded-lg border border-gray-700 overflow-hidden animate-pulse">
		<div className="h-60 bg-gray-700" />
		<div className="p-4 space-y-3">
			<div className="h-4 bg-gray-700 rounded w-3/4" />
			<div className="h-4 bg-gray-700 rounded w-1/3" />
			<div className="h-9 bg-gray-700 rounded" />
		</div>
	</div>
);

const SearchPage = () => {
	const [searchParams, setSearchParams] = useSearchParams();
	const [products, setProducts] = useState([]);
	const [total, setTotal]       = useState(0);
	const [totalPages, setTotalPages] = useState(1);
	const [loading, setLoading]   = useState(false);

	const q        = searchParams.get("q") || "";
	const category = searchParams.get("category") || "";
	const minPrice = searchParams.get("minPrice") || "";
	const maxPrice = searchParams.get("maxPrice") || "";
	const sort     = searchParams.get("sort") || "relevance";
	const page     = parseInt(searchParams.get("page") || "1");

	useEffect(() => {
		const fetchResults = async () => {
			setLoading(true);
			try {
				const params = new URLSearchParams();
				if (q)        params.set("q", q);
				if (category) params.set("category", category);
				if (minPrice) params.set("minPrice", minPrice);
				if (maxPrice) params.set("maxPrice", maxPrice);
				if (sort)     params.set("sort", sort);
				params.set("page", page);
				params.set("limit", "12");

				const res = await axios.get(`/products/search?${params.toString()}`);
				setProducts(res.data.products);
				setTotal(res.data.total);
				setTotalPages(res.data.totalPages);
			} catch (err) {
				console.error("Search error:", err.message);
			} finally {
				setLoading(false);
			}
		};

		fetchResults();
		window.scrollTo({ top: 0, behavior: "smooth" });
	}, [q, category, minPrice, maxPrice, sort, page]);

	const goToPage = (newPage) => {
		const params = new URLSearchParams(searchParams);
		params.set("page", newPage);
		setSearchParams(params);
	};

	return (
		<div className="min-h-screen py-12 px-4">
			<div className="max-w-7xl mx-auto">
				{/* Search bar */}
				<div className="mb-8">
					<SearchBar />
				</div>

				{/* Results header */}
				<div className="flex items-center justify-between mb-6">
					<div>
						{q ? (
							<h1 className="text-xl font-bold text-white">
								Results for{" "}
								<span className="text-emerald-400">&ldquo;{q}&rdquo;</span>
							</h1>
						) : (
							<h1 className="text-xl font-bold text-white">All Products</h1>
						)}
						{!loading && (
							<p className="text-sm text-gray-400 mt-0.5">
								{total} product{total !== 1 ? "s" : ""} found
							</p>
						)}
					</div>
				</div>

				{/* Grid */}
				{loading ? (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
						{Array.from({ length: 12 }).map((_, i) => (
							<ProductSkeleton key={i} />
						))}
					</div>
				) : products.length === 0 ? (
					<div className="text-center py-24">
						<Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
						<h2 className="text-xl font-semibold text-gray-300 mb-2">No products found</h2>
						<p className="text-gray-500">Try adjusting your search or filters</p>
					</div>
				) : (
					<motion.div
						className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
					>
						{products.map((product, i) => (
							<motion.div
								key={product._id}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: i * 0.04 }}
							>
								<ProductCard product={product} />
							</motion.div>
						))}
					</motion.div>
				)}

				{/* Pagination */}
				{totalPages > 1 && !loading && (
					<div className="flex items-center justify-center gap-3 mt-10">
						<button
							onClick={() => goToPage(page - 1)}
							disabled={page === 1}
							className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
						>
							<ChevronLeft className="w-5 h-5" />
						</button>

						{Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
							let pageNum;
							if (totalPages <= 7) {
								pageNum = i + 1;
							} else if (page <= 4) {
								pageNum = i + 1;
							} else if (page >= totalPages - 3) {
								pageNum = totalPages - 6 + i;
							} else {
								pageNum = page - 3 + i;
							}
							return (
								<button
									key={pageNum}
									onClick={() => goToPage(pageNum)}
									className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
										pageNum === page
											? "bg-emerald-600 text-white"
											: "bg-gray-700 hover:bg-gray-600 text-gray-300"
									}`}
								>
									{pageNum}
								</button>
							);
						})}

						<button
							onClick={() => goToPage(page + 1)}
							disabled={page === totalPages}
							className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
						>
							<ChevronRight className="w-5 h-5" />
						</button>
					</div>
				)}
			</div>
		</div>
	);
};

export default SearchPage;