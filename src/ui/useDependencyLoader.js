import { useState, useCallback } from 'react';
import { useMemo } from 'react/cjs/react.production.min';

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

	return useMemo(
		() => ({
			loading,
			setLoading,
			loaderText,
			setLoaderText,
			updateProgress,
		}),
		[loading, loaderText, updateProgress]
	);
};

export default useDependencyLoader;
