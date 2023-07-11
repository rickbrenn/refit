import { useState, useCallback, useMemo } from 'react';

const useDependencyLoader = () => {
	const [loading, setLoading] = useState(true);
	const [loaderText, setLoaderText] = useState('Loading the truck..');

	const updateProgress = useCallback(
		(progressCurrent, progressMax, packageName) => {
			const percentComplete = (progressCurrent * 100) / progressMax;
			const fixedPercent = percentComplete.toFixed();
			setLoaderText(
				`Delivering packages | ${fixedPercent}% | ${packageName}`
			);
		},
		[]
	);

	const showLoaderError = useCallback(() => {
		setLoaderText('Error!');
	}, []);

	return useMemo(
		() => ({
			loading,
			updateLoading: setLoading,
			loaderText,
			updateLoaderText: setLoaderText,
			updateProgress,
			showLoaderError,
		}),
		[loading, loaderText, updateProgress, showLoaderError]
	);
};

export default useDependencyLoader;
