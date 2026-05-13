import { redis } from "../lib/redis.js";
import cloudinary from "../lib/cloudinary.js";
import Product from "../models/product.model.js";


async function updateFeaturedProductsCache() {
	try {
		const featuredProducts = await Product.find({ isFeatured: true, isArchived: false }).lean();
		await redis.set("featured_products", JSON.stringify(featuredProducts));
	} catch (error) {
		console.log("Error in update cache function", error);
	}
}

function extractPublicId(url) {
	const urlParts = url.split("/");
	const uploadIndex = urlParts.indexOf("upload");
	if (uploadIndex === -1) return null;
	const afterUpload = urlParts.slice(uploadIndex + 1);
	const publicIdParts = afterUpload[0]?.match(/^v\d+$/) ? afterUpload.slice(1) : afterUpload;
	return publicIdParts.join("/").replace(/\.[^/.]+$/, "");
}

async function destroyCloudinaryImage(url) {
	try {
		const publicId = extractPublicId(url);
		if (publicId) await cloudinary.uploader.destroy(publicId);
	} catch (err) {
		console.log("Cloudinary destroy error:", err.message);
	}
}


export const getAllProducts = async (req, res) => {
	try {
		const products = await Product.find({ isArchived: false });
		res.json({ products });
	} catch (error) {
		console.log("Error in getAllProducts controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getFeaturedProducts = async (req, res) => {
	try {
		let featuredProducts = await redis.get("featured_products");
		if (featuredProducts) {
			return res.json(JSON.parse(featuredProducts));
		}
		featuredProducts = await Product.find({ isFeatured: true, isArchived: false }).lean();
		if (featuredProducts.length === 0) {
			return res.status(404).json({ message: "No featured products found" });
		}
		await redis.set("featured_products", JSON.stringify(featuredProducts));
		res.json(featuredProducts);
	} catch (error) {
		console.log("Error in getFeaturedProducts controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getRecommendedProducts = async (req, res) => {
	try {
		const products = await Product.aggregate([
			{ $match: { isArchived: false } },
			{ $sample: { size: 4 } },
			{
				$project: {
					_id: 1, name: 1, description: 1, image: 1, price: 1, rating: 1, numReviews: 1,
				},
			},
		]);
		res.json(products);
	} catch (error) {
		console.log("Error in getRecommendedProducts controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getProductsByCategory = async (req, res) => {
	const { category } = req.params;
	try {
		const products = await Product.find({ category, isArchived: false });
		res.json({ products });
	} catch (error) {
		console.log("Error in getProductsByCategory controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};


export const searchProducts = async (req, res) => {
	try {
		const { q, category, minPrice, maxPrice, sort = "relevance", page = 1, limit = 12 } = req.query;

		const filter = { isArchived: false };

		if (q && q.trim()) {
			filter.$or = [
				{ name: { $regex: q.trim(), $options: "i" } },
				{ description: { $regex: q.trim(), $options: "i" } },
				{ tags: { $regex: q.trim(), $options: "i" } },
			];
		}

		if (category && category !== "all") filter.category = category;
		if (minPrice || maxPrice) {
			filter.price = {};
			if (minPrice) filter.price.$gte = Number(minPrice);
			if (maxPrice) filter.price.$lte = Number(maxPrice);
		}

		const sortMap = {
			relevance:     { createdAt: -1 },
			price_asc:     { price: 1 },
			price_desc:    { price: -1 },
			rating:        { rating: -1 },
			newest:        { createdAt: -1 },
		};
		const sortOption = sortMap[sort] || sortMap.relevance;

		const skip = (Number(page) - 1) * Number(limit);

		const [products, total] = await Promise.all([
			Product.find(filter).sort(sortOption).skip(skip).limit(Number(limit)).lean(),
			Product.countDocuments(filter),
		]);

		res.json({
			products,
			total,
			page: Number(page),
			totalPages: Math.ceil(total / Number(limit)),
		});
	} catch (error) {
		console.log("Error in searchProducts controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};


export const getProductById = async (req, res) => {
	try {
		const product = await Product.findById(req.params.id).populate("reviews.user", "name profilePic googleProfilePic");
		if (!product || product.isArchived) {
			return res.status(404).json({ message: "Product not found" });
		}
		res.json(product);
	} catch (error) {
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const createProduct = async (req, res) => {
	try {
		const { name, description, price, image, images = [], category, stock = 0, tags = [] } = req.body;

		let primaryImageUrl = "";
		if (image) {
			const cloudinaryResponse = await cloudinary.uploader.upload(image, { folder: "products" });
			primaryImageUrl = cloudinaryResponse.secure_url;
		}

		const uploadedImages = [];
		for (const img of images) {
			if (img) {
				const res = await cloudinary.uploader.upload(img, { folder: "products" });
				uploadedImages.push(res.secure_url);
			}
		}

		const product = await Product.create({
			name,
			description,
			price,
			image: primaryImageUrl,
			images: uploadedImages,
			category,
			stock: Number(stock),
			tags,
		});

		res.status(201).json(product);
	} catch (error) {
		console.log("Error in createProduct controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const updateProduct = async (req, res) => {
	try {
		const { name, description, price, image, category, stock, tags, isFeatured } = req.body;
		const product = await Product.findById(req.params.id);
		if (!product) return res.status(404).json({ message: "Product not found" });

		if (name !== undefined)        product.name = name;
		if (description !== undefined) product.description = description;
		if (price !== undefined)       product.price = Number(price);
		if (category !== undefined)    product.category = category;
		if (stock !== undefined)       product.stock = Number(stock);
		if (tags !== undefined)        product.tags = tags;
		if (isFeatured !== undefined)  product.isFeatured = isFeatured;
		if (image && image.startsWith("data:")) {
			if (product.image) await destroyCloudinaryImage(product.image);
			const uploaded = await cloudinary.uploader.upload(image, { folder: "products" });
			product.image = uploaded.secure_url;
		}

		const updatedProduct = await product.save();
		await updateFeaturedProductsCache();
		res.json(updatedProduct);
	} catch (error) {
		console.log("Error in updateProduct controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const deleteProduct = async (req, res) => {
	try {
		const product = await Product.findById(req.params.id);
		if (!product) return res.status(404).json({ message: "Product not found" });
		if (product.image) await destroyCloudinaryImage(product.image);
		for (const img of product.images || []) {
			await destroyCloudinaryImage(img);
		}

		await Product.findByIdAndDelete(req.params.id);
		res.json({ message: "Product deleted successfully" });
	} catch (error) {
		console.log("Error in deleteProduct controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const toggleFeaturedProduct = async (req, res) => {
	try {
		const product = await Product.findById(req.params.id);
		if (product) {
			product.isFeatured = !product.isFeatured;
			const updatedProduct = await product.save();
			await updateFeaturedProductsCache();
			res.json(updatedProduct);
		} else {
			res.status(404).json({ message: "Product not found" });
		}
	} catch (error) {
		console.log("Error in toggleFeaturedProduct controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};


export const createReview = async (req, res) => {
	try {
		const { rating, comment } = req.body;
		if (!rating || !comment) {
			return res.status(400).json({ message: "Rating and comment are required" });
		}

		const product = await Product.findById(req.params.id);
		if (!product) return res.status(404).json({ message: "Product not found" });
		const alreadyReviewed = product.reviews.find(
			(r) => r.user.toString() === req.user._id.toString()
		);
		if (alreadyReviewed) {
			return res.status(400).json({ message: "You have already reviewed this product" });
		}

		const review = {
			user: req.user._id,
			name: req.user.name,
			rating: Number(rating),
			comment,
		};

		product.reviews.push(review);
		product.numReviews = product.reviews.length;
		product.rating =
			product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length;

		await product.save();

		const populated = await Product.findById(product._id).populate("reviews.user", "name profilePic googleProfilePic");
		res.status(201).json({ message: "Review added", product: populated });
	} catch (error) {
		console.log("Error in createReview controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const deleteReview = async (req, res) => {
	try {
		const product = await Product.findById(req.params.id);
		if (!product) return res.status(404).json({ message: "Product not found" });

		const review = product.reviews.id(req.params.reviewId);
		if (!review) return res.status(404).json({ message: "Review not found" });
		if (review.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
			return res.status(403).json({ message: "Not authorized" });
		}

		product.reviews.pull(req.params.reviewId);
		product.numReviews = product.reviews.length;
		product.rating = product.reviews.length
			? product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length
			: 0;

		await product.save();
		res.json({ message: "Review deleted" });
	} catch (error) {
		res.status(500).json({ message: "Server error", error: error.message });
	}
};


export const getWishlist = async (req, res) => {
	try {
		const user = await req.user.populate("wishlist");
		res.json(user.wishlist);
	} catch (error) {
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const toggleWishlist = async (req, res) => {
	try {
		const user = req.user;
		const { productId } = req.body;

		const index = user.wishlist.indexOf(productId);
		let added;
		if (index === -1) {
			user.wishlist.push(productId);
			added = true;
		} else {
			user.wishlist.splice(index, 1);
			added = false;
		}
		await user.save();
		res.json({ added, wishlist: user.wishlist });
	} catch (error) {
		res.status(500).json({ message: "Server error", error: error.message });
	}
};