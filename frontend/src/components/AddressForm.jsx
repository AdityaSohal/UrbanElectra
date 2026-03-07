import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, User, Home, Building2, Globe, Hash, ChevronDown, CheckCircle } from "lucide-react";
import { useCartStore } from "../stores/useCartStore";

const COUNTRIES = [
	"United States", "United Kingdom", "Canada", "Australia", "Germany",
	"France", "India", "Japan", "Brazil", "Mexico", "Netherlands",
	"Spain", "Italy", "Sweden", "Norway", "Denmark", "Singapore",
	"New Zealand", "South Africa", "United Arab Emirates",
];

const US_STATES = [
	"AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
	"KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
	"NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
	"VA","WA","WV","WI","WY","DC",
];

const AddressForm = ({ onAddressConfirmed }) => {
	const { shippingAddress, setShippingAddress } = useCartStore();

	const [form, setForm] = useState(
		shippingAddress || {
			fullName: "",
			addressLine1: "",
			addressLine2: "",
			city: "",
			state: "",
			postalCode: "",
			country: "United States",
			phone: "",
		}
	);

	const [errors, setErrors] = useState({});
	const [isConfirmed, setIsConfirmed] = useState(!!shippingAddress);
	const [isEditing, setIsEditing] = useState(!shippingAddress);

	const validate = () => {
		const newErrors = {};
		if (!form.fullName.trim()) newErrors.fullName = "Full name is required";
		if (!form.addressLine1.trim()) newErrors.addressLine1 = "Address is required";
		if (!form.city.trim()) newErrors.city = "City is required";
		if (!form.postalCode.trim()) newErrors.postalCode = "Postal code is required";
		if (!form.country) newErrors.country = "Country is required";
		if (form.phone && !/^[\d\s\+\-\(\)]{7,15}$/.test(form.phone))
			newErrors.phone = "Enter a valid phone number";
		return newErrors;
	};

	const handleChange = (e) => {
		const { name, value } = e.target;
		setForm((prev) => ({ ...prev, [name]: value }));
		if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
	};

	const handleConfirm = () => {
		const validationErrors = validate();
		if (Object.keys(validationErrors).length > 0) {
			setErrors(validationErrors);
			return;
		}
		setShippingAddress(form);
		setIsConfirmed(true);
		setIsEditing(false);
		if (onAddressConfirmed) onAddressConfirmed(form);
	};

	const inputClass = (field) =>
		`w-full bg-gray-700 border ${
			errors[field] ? "border-red-500" : "border-gray-600"
		} rounded-md py-2.5 px-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-colors duration-200`;

	if (isConfirmed && !isEditing) {
		return (
			<motion.div
				className="rounded-lg border border-emerald-700 bg-gray-800 p-4 shadow-sm sm:p-6"
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4 }}
			>
				<div className="flex items-center justify-between mb-3">
					<div className="flex items-center gap-2">
						<CheckCircle className="text-emerald-400 w-5 h-5" />
						<h3 className="text-base font-semibold text-emerald-400">Shipping Address</h3>
					</div>
					<button
						onClick={() => setIsEditing(true)}
						className="text-xs text-gray-400 hover:text-emerald-400 transition-colors underline"
					>
						Edit
					</button>
				</div>
				<div className="text-sm text-gray-300 space-y-0.5">
					<p className="font-medium text-white">{form.fullName}</p>
					<p>{form.addressLine1}{form.addressLine2 ? `, ${form.addressLine2}` : ""}</p>
					<p>{form.city}{form.state ? `, ${form.state}` : ""} {form.postalCode}</p>
					<p>{form.country}</p>
					{form.phone && <p className="text-gray-400">{form.phone}</p>}
				</div>
			</motion.div>
		);
	}

	return (
		<motion.div
			className="space-y-4 rounded-lg border border-gray-700 bg-gray-800 p-4 shadow-sm sm:p-6"
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5 }}
		>
			<div className="flex items-center gap-2 mb-1">
				<MapPin className="text-emerald-400 w-5 h-5" />
				<h3 className="text-base font-semibold text-emerald-400">Shipping Address</h3>
			</div>

			<div className="space-y-3">
				<div>
					<label className="block text-xs font-medium text-gray-300 mb-1">
						Full Name <span className="text-red-400">*</span>
					</label>
					<div className="relative">
						<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
							<User className="h-4 w-4 text-gray-400" />
						</div>
						<input
							type="text"
							name="fullName"
							value={form.fullName}
							onChange={handleChange}
							placeholder="John Doe"
							className={`${inputClass("fullName")} pl-9`}
						/>
					</div>
					{errors.fullName && <p className="text-red-400 text-xs mt-1">{errors.fullName}</p>}
				</div>

				<div>
					<label className="block text-xs font-medium text-gray-300 mb-1">
						Address Line 1 <span className="text-red-400">*</span>
					</label>
					<div className="relative">
						<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
							<Home className="h-4 w-4 text-gray-400" />
						</div>
						<input
							type="text"
							name="addressLine1"
							value={form.addressLine1}
							onChange={handleChange}
							placeholder="123 Main Street"
							className={`${inputClass("addressLine1")} pl-9`}
						/>
					</div>
					{errors.addressLine1 && <p className="text-red-400 text-xs mt-1">{errors.addressLine1}</p>}
				</div>

				<div>
					<label className="block text-xs font-medium text-gray-300 mb-1">
						Address Line 2 <span className="text-gray-500">(optional)</span>
					</label>
					<div className="relative">
						<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
							<Building2 className="h-4 w-4 text-gray-400" />
						</div>
						<input
							type="text"
							name="addressLine2"
							value={form.addressLine2}
							onChange={handleChange}
							placeholder="Apt, suite, floor, etc."
							className={`${inputClass("addressLine2")} pl-9`}
						/>
					</div>
				</div>

				<div className="grid grid-cols-2 gap-3">
					<div>
						<label className="block text-xs font-medium text-gray-300 mb-1">
							City <span className="text-red-400">*</span>
						</label>
						<input
							type="text"
							name="city"
							value={form.city}
							onChange={handleChange}
							placeholder="New York"
							className={inputClass("city")}
						/>
						{errors.city && <p className="text-red-400 text-xs mt-1">{errors.city}</p>}
					</div>

					<div>
						<label className="block text-xs font-medium text-gray-300 mb-1">
							State / Province
						</label>
						{form.country === "United States" ? (
							<div className="relative">
								<select
									name="state"
									value={form.state}
									onChange={handleChange}
									className={`${inputClass("state")} appearance-none pr-8`}
								>
									<option value="">Select state</option>
									{US_STATES.map((s) => (
										<option key={s} value={s}>{s}</option>
									))}
								</select>
								<ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
							</div>
						) : (
							<input
								type="text"
								name="state"
								value={form.state}
								onChange={handleChange}
								placeholder="State / Province"
								className={inputClass("state")}
							/>
						)}
					</div>
				</div>

				<div className="grid grid-cols-2 gap-3">
					<div>
						<label className="block text-xs font-medium text-gray-300 mb-1">
							Postal Code <span className="text-red-400">*</span>
						</label>
						<div className="relative">
							<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
								<Hash className="h-4 w-4 text-gray-400" />
							</div>
							<input
								type="text"
								name="postalCode"
								value={form.postalCode}
								onChange={handleChange}
								placeholder="10001"
								className={`${inputClass("postalCode")} pl-9`}
							/>
						</div>
						{errors.postalCode && <p className="text-red-400 text-xs mt-1">{errors.postalCode}</p>}
					</div>

					<div>
						<label className="block text-xs font-medium text-gray-300 mb-1">
							Country <span className="text-red-400">*</span>
						</label>
						<div className="relative">
							<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
								<Globe className="h-4 w-4 text-gray-400" />
							</div>
							<select
								name="country"
								value={form.country}
								onChange={handleChange}
								className={`${inputClass("country")} pl-9 appearance-none pr-8`}
							>
								{COUNTRIES.map((c) => (
									<option key={c} value={c}>{c}</option>
								))}
							</select>
							<ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
						</div>
						{errors.country && <p className="text-red-400 text-xs mt-1">{errors.country}</p>}
					</div>
				</div>

				<div>
					<label className="block text-xs font-medium text-gray-300 mb-1">
						Phone Number <span className="text-gray-500">(optional)</span>
					</label>
					<input
						type="tel"
						name="phone"
						value={form.phone}
						onChange={handleChange}
						placeholder="+1 (555) 000-0000"
						className={inputClass("phone")}
					/>
					{errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
				</div>
			</div>

			<motion.button
				type="button"
				className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-300 transition-colors duration-200"
				whileHover={{ scale: 1.02 }}
				whileTap={{ scale: 0.98 }}
				onClick={handleConfirm}
			>
				<CheckCircle className="w-4 h-4" />
				Confirm Address
			</motion.button>
		</motion.div>
	);
};

export default AddressForm;

