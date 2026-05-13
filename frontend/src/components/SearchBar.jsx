import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORIES = ["all", "phones", "laptops", "tablets", "headphones", "cameras", "tvs", "accessories"];
const SORT_OPTIONS = [
	{ value: "relevance",  label: "Most Relevant" },
	{ value: "newest",     label: "Newest First" },
	{ value: "price_asc",  label: "Price: Low to High" },
	{ value: "price_desc", label: "Price: High to Low" },
	{ value: "rating",     label: "Top Rated" },
];

const SearchBar = ({ compact = false }) => {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const inputRef = useRef(null);

	const [query, setQuery]       = useState(searchParams.get("q") || "");
	const [showFilters, setShowFilters] = useState(false);
	const [category, setCategory] = useState(searchParams.get("category") || "all");
	const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
	const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
	const [sort, setSort]         = useState(searchParams.get("sort") || "relevance");

	const buildQuery = useCallback((q = query) => {
		const params = new URLSearchParams();
		if (q.trim())        params.set("q", q.trim());
		if (category !== "all") params.set("category", category);
		if (minPrice)        params.set("minPrice", minPrice);
		if (maxPrice)        params.set("maxPrice", maxPrice);
		if (sort !== "relevance") params.set("sort", sort);
		return params.toString();
	}, [query, category, minPrice, maxPrice, sort]);

	const handleSearch = (e) => {
		e?.preventDefault();
		const qs = buildQuery();
		navigate(`/search${qs ? "?" + qs : ""}`);
	};

	const clearAll = () => {
		setQuery(""); setCategory("all"); setMinPrice(""); setMaxPrice(""); setSort("relevance");
	};

	const hasActiveFilters = category !== "all" || minPrice || maxPrice || sort !== "relevance";

	if (compact) {
		return (
			<form onSubmit={handleSearch} className="flex items-center gap-2">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
					<input
						type="text"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder="Search products…"
						className="w-full bg-gray-800 border border-gray-700 rounded-full pl-9 pr-4 py-2
							text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2
							focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
					/>
					{query && (
						<button
							type="button"
							onClick={() => setQuery("")}
							className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
						>
							<X className="w-3.5 h-3.5" />
						</button>
					)}
				</div>
				<button
					type="submit"
					className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-full font-medium transition-colors"
				>
					Search
				</button>
			</form>
		);
	}

	return (
		<div className="w-full max-w-3xl mx-auto">
			<form onSubmit={handleSearch}>
				<div className="flex items-center gap-2">
					<div className="relative flex-1">
						<Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
						<input
							ref={inputRef}
							type="text"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder="Search for phones, laptops, headphones…"
							className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-12 pr-4 py-3.5
								text-white placeholder-gray-500 focus:outline-none focus:ring-2
								focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-sm"
						/>
						{query && (
							<button
								type="button"
								onClick={() => setQuery("")}
								className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
							>
								<X className="w-4 h-4" />
							</button>
						)}
					</div>

					<button
						type="button"
						onClick={() => setShowFilters((v) => !v)}
						className={`flex items-center gap-1.5 px-4 py-3.5 rounded-xl border text-sm font-medium transition-colors ${
							showFilters || hasActiveFilters
								? "bg-emerald-600 border-emerald-600 text-white"
								: "bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600"
						}`}
					>
						<SlidersHorizontal className="w-4 h-4" />
						Filters
						{hasActiveFilters && (
							<span className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0" />
						)}
					</button>

					<button
						type="submit"
						className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-colors"
					>
						Search
					</button>
				</div>

				<AnimatePresence>
					{showFilters && (
						<motion.div
							initial={{ opacity: 0, height: 0 }}
							animate={{ opacity: 1, height: "auto" }}
							exit={{ opacity: 0, height: 0 }}
							className="overflow-hidden"
						>
							<div className="mt-3 bg-gray-800 border border-gray-700 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
								{/* Category */}
								<div className="col-span-2 sm:col-span-1">
									<label className="block text-xs text-gray-400 mb-1.5 font-medium">Category</label>
									<div className="relative">
										<select
											value={category}
											onChange={(e) => setCategory(e.target.value)}
											className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm
												text-white appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500 capitalize"
										>
											{CATEGORIES.map((c) => (
												<option key={c} value={c} className="capitalize">{c === "all" ? "All Categories" : c}</option>
											))}
										</select>
										<ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
									</div>
								</div>

								{/* Price range */}
								<div>
									<label className="block text-xs text-gray-400 mb-1.5 font-medium">Min Price ($)</label>
									<input
										type="number"
										min="0"
										value={minPrice}
										onChange={(e) => setMinPrice(e.target.value)}
										placeholder="0"
										className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm
											text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
									/>
								</div>
								<div>
									<label className="block text-xs text-gray-400 mb-1.5 font-medium">Max Price ($)</label>
									<input
										type="number"
										min="0"
										value={maxPrice}
										onChange={(e) => setMaxPrice(e.target.value)}
										placeholder="9999"
										className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm
											text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
									/>
								</div>

								{/* Sort */}
								<div>
									<label className="block text-xs text-gray-400 mb-1.5 font-medium">Sort By</label>
									<div className="relative">
										<select
											value={sort}
											onChange={(e) => setSort(e.target.value)}
											className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm
												text-white appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
										>
											{SORT_OPTIONS.map((o) => (
												<option key={o.value} value={o.value}>{o.label}</option>
											))}
										</select>
										<ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
									</div>
								</div>

								{/* Clear */}
								<div className="col-span-2 sm:col-span-4 flex justify-end">
									<button
										type="button"
										onClick={clearAll}
										className="text-xs text-gray-400 hover:text-emerald-400 transition-colors underline"
									>
										Clear all filters
									</button>
								</div>
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</form>
		</div>
	);
};

export default SearchBar;