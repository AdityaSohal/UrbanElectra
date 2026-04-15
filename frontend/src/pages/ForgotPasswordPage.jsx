import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Mail, KeyRound, Lock, ArrowLeft, Loader, CheckCircle, RefreshCw } from "lucide-react";
import axios from "../lib/axios";
import toast from "react-hot-toast";

// ─── Step indicators ──────────────────────────────────────────────────────────
const steps = ["Enter Email", "Verify OTP", "New Password"];

const StepBar = ({ current }) => (
	<div className="flex items-center justify-center gap-0 mb-8">
		{steps.map((label, i) => (
			<div key={i} className="flex items-center">
				<div className="flex flex-col items-center">
					<div
						className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors duration-300 ${
							i < current
								? "bg-emerald-500 text-white"
								: i === current
								? "bg-emerald-600 text-white ring-4 ring-emerald-900"
								: "bg-gray-700 text-gray-400"
						}`}
					>
						{i < current ? <CheckCircle className="w-4 h-4" /> : i + 1}
					</div>
					<span
						className={`mt-1.5 text-xs font-medium whitespace-nowrap transition-colors duration-300 ${
							i === current ? "text-emerald-400" : "text-gray-500"
						}`}
					>
						{label}
					</span>
				</div>
				{i < steps.length - 1 && (
					<div
						className={`h-0.5 w-12 sm:w-20 mb-5 mx-1 transition-colors duration-300 ${
							i < current ? "bg-emerald-500" : "bg-gray-700"
						}`}
					/>
				)}
			</div>
		))}
	</div>
);

// ─── Shared input ─────────────────────────────────────────────────────────────
const InputField = ({ icon: Icon, label, ...props }) => (
	<div>
		<label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
		<div className="relative rounded-md shadow-sm">
			<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
				<Icon className="h-5 w-5 text-gray-400" />
			</div>
			<input
				className="block w-full px-3 py-2 pl-10 bg-gray-700 border border-gray-600 rounded-md
					placeholder-gray-400 text-white focus:outline-none focus:ring-2
					focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
				{...props}
			/>
		</div>
	</div>
);

// ─── Step 1: Email ────────────────────────────────────────────────────────────
const EmailStep = ({ onNext }) => {
	const [email, setEmail] = useState("");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		try {
			await axios.post("/auth/forgot-password", { email });
			toast.success("OTP sent! Check your inbox.");
			onNext(email);
		} catch (err) {
			toast.error(err.response?.data?.message || "Something went wrong");
		} finally {
			setLoading(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-5">
			<p className="text-sm text-gray-400 text-center">
				Enter your registered email address and we'll send you a 6-digit OTP.
			</p>
			<InputField
				icon={Mail}
				label="Email address"
				type="email"
				required
				value={email}
				onChange={(e) => setEmail(e.target.value)}
				placeholder="you@example.com"
			/>
			<button
				type="submit"
				disabled={loading}
				className="w-full flex justify-center items-center gap-2 py-2 px-4 rounded-md
					bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm
					focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 transition"
			>
				{loading ? <Loader className="h-5 w-5 animate-spin" /> : <Mail className="h-5 w-5" />}
				{loading ? "Sending OTP..." : "Send OTP"}
			</button>
		</form>
	);
};

// ─── Step 2: OTP ──────────────────────────────────────────────────────────────
const OtpStep = ({ email, onNext, onBack }) => {
	const [otp, setOtp] = useState("");
	const [loading, setLoading] = useState(false);
	const [resending, setResending] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (otp.length !== 6) return toast.error("Please enter the 6-digit OTP");
		setLoading(true);
		try {
			await axios.post("/auth/verify-otp", { email, otp });
			toast.success("OTP verified!");
			onNext(otp);
		} catch (err) {
			toast.error(err.response?.data?.message || "Invalid OTP");
		} finally {
			setLoading(false);
		}
	};

	const handleResend = async () => {
		setResending(true);
		try {
			await axios.post("/auth/forgot-password", { email });
			toast.success("New OTP sent!");
			setOtp("");
		} catch (err) {
			toast.error(err.response?.data?.message || "Could not resend OTP");
		} finally {
			setResending(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-5">
			<p className="text-sm text-gray-400 text-center">
				We sent a 6-digit OTP to{" "}
				<span className="text-emerald-400 font-medium">{email}</span>.<br />
				It expires in <span className="text-white font-medium">10 minutes</span>.
			</p>
			<InputField
				icon={KeyRound}
				label="6-digit OTP"
				type="text"
				inputMode="numeric"
				maxLength={6}
				required
				value={otp}
				onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
				placeholder="••••••"
			/>
			<button
				type="submit"
				disabled={loading}
				className="w-full flex justify-center items-center gap-2 py-2 px-4 rounded-md
					bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm
					focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 transition"
			>
				{loading ? <Loader className="h-5 w-5 animate-spin" /> : <CheckCircle className="h-5 w-5" />}
				{loading ? "Verifying..." : "Verify OTP"}
			</button>
			<div className="flex items-center justify-between text-sm">
				<button
					type="button"
					onClick={onBack}
					className="text-gray-400 hover:text-emerald-400 flex items-center gap-1 transition"
				>
					<ArrowLeft className="h-4 w-4" /> Change email
				</button>
				<button
					type="button"
					onClick={handleResend}
					disabled={resending}
					className="text-gray-400 hover:text-emerald-400 flex items-center gap-1 transition disabled:opacity-50"
				>
					{resending ? <Loader className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
					Resend OTP
				</button>
			</div>
		</form>
	);
};

// ─── Step 3: New password ─────────────────────────────────────────────────────
const ResetStep = ({ email, otp, onSuccess }) => {
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (newPassword.length < 6)
			return toast.error("Password must be at least 6 characters");
		if (newPassword !== confirmPassword)
			return toast.error("Passwords do not match");

		setLoading(true);
		try {
			await axios.post("/auth/reset-password", { email, otp, newPassword });
			toast.success("Password reset successfully!");
			onSuccess();
		} catch (err) {
			toast.error(err.response?.data?.message || "Failed to reset password");
		} finally {
			setLoading(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-5">
			<p className="text-sm text-gray-400 text-center">
				Choose a strong new password for your account.
			</p>
			<InputField
				icon={Lock}
				label="New Password"
				type="password"
				required
				value={newPassword}
				onChange={(e) => setNewPassword(e.target.value)}
				placeholder="At least 6 characters"
			/>
			<InputField
				icon={Lock}
				label="Confirm Password"
				type="password"
				required
				value={confirmPassword}
				onChange={(e) => setConfirmPassword(e.target.value)}
				placeholder="Repeat your new password"
			/>
			<button
				type="submit"
				disabled={loading}
				className="w-full flex justify-center items-center gap-2 py-2 px-4 rounded-md
					bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm
					focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 transition"
			>
				{loading ? <Loader className="h-5 w-5 animate-spin" /> : <Lock className="h-5 w-5" />}
				{loading ? "Resetting..." : "Reset Password"}
			</button>
		</form>
	);
};

// ─── Success screen ───────────────────────────────────────────────────────────
const SuccessScreen = () => (
	<div className="text-center space-y-4">
		<CheckCircle className="w-16 h-16 text-emerald-400 mx-auto" />
		<h3 className="text-xl font-bold text-white">Password Updated!</h3>
		<p className="text-sm text-gray-400">
			Your password has been reset successfully. You can now log in with your new password.
		</p>
		<Link
			to="/login"
			className="inline-flex items-center justify-center gap-2 w-full py-2 px-4 rounded-md
				bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition"
		>
			Go to Login
		</Link>
	</div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────
const ForgotPasswordPage = () => {
	const [step, setStep]       = useState(0); // 0 = email, 1 = otp, 2 = reset, 3 = success
	const [email, setEmail]     = useState("");
	const [otp, setOtp]         = useState("");

	return (
		<div className="flex flex-col justify-center py-12 sm:px-6 lg:px-8 min-h-screen">
			<motion.div
				className="sm:mx-auto sm:w-full sm:max-w-md"
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.6 }}
			>
				<h2 className="mt-6 text-center text-3xl font-extrabold text-emerald-400">
					Reset Password
				</h2>
				<p className="mt-2 text-center text-sm text-gray-500">
					<Link to="/login" className="text-emerald-400 hover:text-emerald-300 flex items-center justify-center gap-1">
						<ArrowLeft className="h-4 w-4" /> Back to login
					</Link>
				</p>
			</motion.div>

			<motion.div
				className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.6, delay: 0.1 }}
			>
				<div className="bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
					{step < 3 && <StepBar current={step} />}

					<AnimatePresence mode="wait">
						<motion.div
							key={step}
							initial={{ opacity: 0, x: 30 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -30 }}
							transition={{ duration: 0.25 }}
						>
							{step === 0 && (
								<EmailStep
									onNext={(e) => { setEmail(e); setStep(1); }}
								/>
							)}
							{step === 1 && (
								<OtpStep
									email={email}
									onNext={(o) => { setOtp(o); setStep(2); }}
									onBack={() => setStep(0)}
								/>
							)}
							{step === 2 && (
								<ResetStep
									email={email}
									otp={otp}
									onSuccess={() => setStep(3)}
								/>
							)}
							{step === 3 && <SuccessScreen />}
						</motion.div>
					</AnimatePresence>
				</div>
			</motion.div>
		</div>
	);
};

export default ForgotPasswordPage;