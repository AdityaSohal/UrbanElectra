import { useEffect } from "react";
import CategoryItem from "../components/CategoryItem";
import { useProductStore } from "../stores/useProductStore";
import FeaturedProducts from "../components/FeaturedProducts";

const categories = [
    { href: "/phones", name: "Phones", imageUrl: "/phones.jpg" },
    { href: "/laptops", name: "Laptops", imageUrl: "/laptops.jpg" },
    { href: "/tablets", name: "Tablets", imageUrl: "/tablets.jpg" },
    { href: "/headphones", name: "Headphones", imageUrl: "/headphones.jpg" },
    { href: "/cameras", name: "Cameras", imageUrl: "/cameras.jpg" },
    { href: "/tvs", name: "TVs", imageUrl: "/tvs.jpg" },
    { href: "/accessories", name: "Accessories", imageUrl: "/accessories.jpg" },
];


const HomePage = () => {
	const { fetchFeaturedProducts, products, isLoading } = useProductStore();

	useEffect(() => {
		fetchFeaturedProducts();
	}, [fetchFeaturedProducts]);

	return (
		<div className='relative min-h-screen text-white overflow-hidden'>
			<div className='relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16'>
				<h1 className='text-center text-5xl sm:text-6xl font-bold text-emerald-400 mb-4'>
					Explore Our Electronics
				</h1>
				<p className='text-center text-xl text-gray-300 mb-12'>
					Discover the latest in cutting-edge technology
				</p>

				<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
					{categories.map((category) => (
						<CategoryItem category={category} key={category.name} />
					))}
				</div>

				{!isLoading && products.length > 0 && <FeaturedProducts featuredProducts={products} />}
			</div>
		</div>
	);
};
export default HomePage;