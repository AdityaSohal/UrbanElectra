// ✅ Fix #10: Replaced placeholder text with a real animated spinner
const LoadingSpinner = () => {
	return (
		<div className='flex items-center justify-center min-h-screen bg-gray-900'>
			<div className='relative'>
				{/* Outer ring */}
				<div className='w-16 h-16 rounded-full border-4 border-emerald-900' />
				{/* Spinning arc */}
				<div className='w-16 h-16 rounded-full border-4 border-emerald-400 border-t-transparent animate-spin absolute top-0 left-0' />
			</div>
		</div>
	);
};

export default LoadingSpinner;