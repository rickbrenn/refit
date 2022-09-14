import { useState, useCallback, useMemo } from 'react';

const useLoader = () => {
	const [loading, setLoading] = useState(true);
	const [loaderState, setLoaderState] = useState({
		text: 'Loading the truck..',
	});

	const updateProgress = useCallback(
		(progressCurrent, progressMax, packageName) => {
			const percentComplete = (progressCurrent * 100) / progressMax;
			const fixedPercent = percentComplete.toFixed();

			setLoaderState({
				text: `Delivering packages | ${fixedPercent}% | ${packageName}`,
			});
		},
		[]
	);

	return useMemo(
		() => ({
			updateProgress,
			loading,
			setLoading,
			loaderState,
			setLoaderState,
		}),
		[updateProgress, loading, loaderState]
	);
};

export default useLoader;
