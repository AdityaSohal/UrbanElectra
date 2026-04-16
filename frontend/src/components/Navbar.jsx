import { ShoppingCart, UserPlus, LogIn, LogOut, Lock, Package, Camera, Trash2, Loader } from "lucide-react";
import { Link } from "react-router-dom";
import { useUserStore } from "../stores/useUserStore";
import { useCartStore } from "../stores/useCartStore";
import { useRef, useState } from "react";

// ─── Avatar Component ─────────────────────────────────────────────────────────
const UserAvatar = ({ user, size = "md" }) => {
	const sizeClasses = {
		sm: "w-7 h-7 text-xs",
		md: "w-9 h-9 text-sm",
		lg: "w-16 h-16 text-xl",
	};

	const picUrl = user.profilePic || user.googleProfilePic || "";
	const initials = user.name
		? user.name.trim().split(/\s+/).slice(0, 2).map((w) => w[0].toUpperCase()).join("")
		: user.email?.[0]?.toUpperCase() || "?";

	if (picUrl) {
		return (
			<img
				src={picUrl}
				alt={user.name}
				className={`${sizeClasses[size]} rounded-full object-cover ring-2 ring-emerald-500/60`}
			/>
		);
	}

	return (
		<div
			className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center font-bold text-white ring-2 ring-emerald-500/60 select-none`}
		>
			{initials}
		</div>
	);
};

// ─── Profile Dropdown ─────────────────────────────────────────────────────────
const ProfileDropdown = ({ user, onClose }) => {
	const { logout, updateProfilePic, deleteProfilePic, loading } = useUserStore();
	const fileInputRef = useRef(null);
	const [uploading, setUploading] = useState(false);
	const [deleting, setDeleting] = useState(false);

	const handleImageChange = async (e) => {
		const file = e.target.files[0];
		if (!file) return;

		if (file.size > 5 * 1024 * 1024) {
			import("react-hot-toast").then(({ default: toast }) =>
				toast.error("Image must be under 5MB")
			);
			return;
		}

		setUploading(true);
		const reader = new FileReader();
		reader.onloadend = async () => {
			const success = await updateProfilePic(reader.result);
			setUploading(false);
			// reset input so same file can be re-selected
			if (fileInputRef.current) fileInputRef.current.value = "";
		};
		reader.readAsDataURL(file);
	};

	const handleDeletePic = async () => {
		setDeleting(true);
		await deleteProfilePic();
		setDeleting(false);
	};

	const handleLogout = async () => {
		onClose();
		await logout();
	};

	const picUrl = user.profilePic || user.googleProfilePic || "";
	const initials = user.name
		? user.name.trim().split(/\s+/).slice(0, 2).map((w) => w[0].toUpperCase()).join("")
		: user.email?.[0]?.toUpperCase() || "?";

	// User has a custom uploaded pic (not just googleProfilePic)
	const hasCustomPic = !!user.profilePic;
	// Has any pic at all
	const hasPic = !!picUrl;

	return (
		<div className="absolute right-0 top-full mt-2 w-72 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden">
			{/* Header */}
			<div className="p-4 bg-gradient-to-br from-emerald-900/40 to-teal-900/20 border-b border-gray-700">
				<div className="flex items-center gap-3">
					{/* Large avatar with upload overlay */}
					<div className="relative group flex-shrink-0">
						{hasPic ? (
							<img
								src={picUrl}
								alt={user.name}
								className="w-14 h-14 rounded-full object-cover ring-2 ring-emerald-500/60"
							/>
						) : (
							<div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center font-bold text-white text-xl ring-2 ring-emerald-500/60 select-none">
								{initials}
							</div>
						)}

						{/* Upload overlay on hover */}
						<button
							onClick={() => fileInputRef.current?.click()}
							disabled={uploading || deleting}
							className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
							title="Change profile picture"
						>
							{uploading ? (
								<Loader className="w-5 h-5 text-white animate-spin" />
							) : (
								<Camera className="w-5 h-5 text-white" />
							)}
						</button>

						<input
							ref={fileInputRef}
							type="file"
							accept="image/*"
							className="hidden"
							onChange={handleImageChange}
						/>
					</div>

					<div className="flex-1 min-w-0">
						<p className="text-white font-semibold truncate">{user.name}</p>
						<p className="text-gray-400 text-xs truncate">{user.email}</p>
						<div className="flex items-center gap-2 mt-1 flex-wrap">
							<button
								onClick={() => fileInputRef.current?.click()}
								disabled={uploading || deleting}
								className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 disabled:opacity-50"
							>
								<Camera className="w-3 h-3" />
								{uploading ? "Uploading..." : "Change photo"}
							</button>

							{/* Only show delete if user has a custom uploaded profile pic */}
							{hasCustomPic && (
								<>
									<span className="text-gray-600 text-xs">·</span>
									<button
										onClick={handleDeletePic}
										disabled={uploading || deleting}
										className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-1 disabled:opacity-50"
										title="Remove profile picture"
									>
										{deleting ? (
											<Loader className="w-3 h-3 animate-spin" />
										) : (
											<Trash2 className="w-3 h-3" />
										)}
										{deleting ? "Removing..." : "Remove"}
									</button>
								</>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Links */}
			<div className="p-2">
				{user.role !== "admin" && (
					<Link
						to="/my-orders"
						onClick={onClose}
						className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-gray-700/60 transition-colors"
					>
						<Package className="w-4 h-4 text-emerald-400" />
						My Orders
					</Link>
				)}
				{user.role === "admin" && (
					<Link
						to="/secret-dashboard"
						onClick={onClose}
						className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-gray-700/60 transition-colors"
					>
						<Lock className="w-4 h-4 text-emerald-400" />
						Admin Dashboard
					</Link>
				)}
			</div>

			{/* Logout */}
			<div className="p-2 border-t border-gray-700">
				<button
					onClick={handleLogout}
					className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
				>
					<LogOut className="w-4 h-4" />
					Log Out
				</button>
			</div>
		</div>
	);
};

// ─── Navbar ───────────────────────────────────────────────────────────────────
const Navbar = () => {
	const { user } = useUserStore();
	const { cart } = useCartStore();
	const [dropdownOpen, setDropdownOpen] = useState(false);

	return (
		<header className="fixed top-0 left-0 w-full bg-gray-900 bg-opacity-90 backdrop-blur-md shadow-lg z-40 transition-all duration-300 border-b border-emerald-800">
			<div className="container mx-auto px-4 py-3">
				<div className="flex flex-wrap justify-between items-center">
					<Link to="/" className="text-2xl font-bold text-emerald-400 items-center space-x-2 flex">
						UrbanElectra
					</Link>

					<nav className="flex flex-wrap items-center gap-4">
						<Link
							to="/"
							className="text-gray-300 hover:text-emerald-400 transition duration-300 ease-in-out"
						>
							Home
						</Link>

						{user && (
							<Link
								to="/cart"
								className="relative group text-gray-300 hover:text-emerald-400 transition duration-300 ease-in-out"
							>
								<ShoppingCart className="inline-block mr-1 group-hover:text-emerald-400" size={20} />
								<span className="hidden sm:inline">Cart</span>
								{cart.length > 0 && (
									<span className="absolute -top-2 -left-2 bg-emerald-500 text-white rounded-full px-2 py-0.5 text-xs group-hover:bg-emerald-400 transition duration-300 ease-in-out">
										{cart.length}
									</span>
								)}
							</Link>
						)}

						{/* Profile avatar / auth buttons */}
						{user ? (
							<div className="relative">
								<button
									onClick={() => setDropdownOpen((v) => !v)}
									className="flex items-center gap-2 focus:outline-none group"
									aria-label="Profile menu"
								>
									<UserAvatar user={user} size="md" />
								</button>

								{dropdownOpen && (
									<>
										{/* Backdrop */}
										<div
											className="fixed inset-0 z-40"
											onClick={() => setDropdownOpen(false)}
										/>
										<ProfileDropdown
											user={user}
											onClose={() => setDropdownOpen(false)}
										/>
									</>
								)}
							</div>
						) : (
							<>
								<Link
									to="/signup"
									className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-md flex items-center transition duration-300 ease-in-out"
								>
									<UserPlus className="mr-2" size={18} />
									Sign Up
								</Link>
								<Link
									to="/login"
									className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-md flex items-center transition duration-300 ease-in-out"
								>
									<LogIn className="mr-2" size={18} />
									Login
								</Link>
							</>
						)}
					</nav>
				</div>
			</div>
		</header>
	);
};

export default Navbar;