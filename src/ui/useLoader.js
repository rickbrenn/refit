import { useState } from 'react';

const useLoader = () => {
	const [loading, setLoading] = useState(true);
	const [loaderState, setLoaderState] = useState({
		text: 'Loading the truck..',
	});

	const updateProgress = (progressCurrent, progressMax, packageName) => {
		const percentComplete = (progressCurrent * 100) / progressMax;
		const fixedPercent = percentComplete.toFixed();

		setLoaderState({
			text: `Delivering packages | ${fixedPercent}% | ${packageName}`,
		});
	};

	return {
		updateProgress,
		loading,
		setLoading,
		loaderState,
		setLoaderState,
	};
};

export default useLoader;
