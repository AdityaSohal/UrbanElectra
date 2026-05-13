import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Home, Search, ArrowLeft } from "lucide-react";

const NotFoundPage = () => {
	return (
		<div className="min-h-screen flex items-center justify-center px-4">
			<motion.div
				className="text-center"
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.6 }}
			>
				{/* Glowing 404 */}
				<div className="relative mb-8">
					<h1 className="text-[10rem] font-black text-gray-800 leading-none select-none">
						404
					</h1>
					<div className="absolute inset-0 flex items-center justify-center">
						<h1 className="text-[10rem] font-black text-transparent bg-clip-text bg-gradient-to-b from-emerald-400 to-teal-600 leading-none select-none opacity-60">
							404
						</h1>
					</div>
				</div>

				<h2 className="text-2xl font-bold text-white mb-3">Page Not Found</h2>
				<p className="text-gray-400 mb-10 max-w-md mx-auto">
					Looks like this page wandered off into the digital void. Let's get you back on track.
				</p>

				<div className="flex flex-col sm:flex-row items-center justify-center gap-4">
					<Link
						to="/"
						className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
					>
						<Home className="w-5 h-5" />
						Go Home
					</Link>
					<Link
						to="/search"
						className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-gray-300 px-6 py-3 rounded-xl font-medium transition-colors"
					>
						<Search className="w-5 h-5" />
						Search Products
					</Link>
					<button
						onClick={() => window.history.back()}
						className="flex items-center gap-2 text-gray-400 hover:text-emerald-400 px-6 py-3 rounded-xl font-medium transition-colors"
					>
						<ArrowLeft className="w-5 h-5" />
						Go Back
					</button>
				</div>
			</motion.div>
		</div>
	);
};

export default NotFoundPage;