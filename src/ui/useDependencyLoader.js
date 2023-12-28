import { useState, useCallback, useMemo } from 'react';

const useDependencyLoader = () => {
	const [loading, setLoading] = useState(true);
	const [loaderText, setLoaderText] = useState('Loading the truck..');

	const updateProgress = useCallback(
		({ progressCurrent, progressMax, name }) => {
			const percentComplete = (progressCurrent * 100) / progressMax;
			const fixedPercent = percentComplete.toFixed();
			setLoaderText(`Delivering packages | ${fixedPercent}% | ${name}`);
		},
		[]
	);

	return useMemo(
		() => ({
			loading,
			updateLoading: setLoading,
			loaderText,
			updateLoaderText: setLoaderText,
			updateProgress,
		}),
		[loading, loaderText, updateProgress]
	);
};

export default useDependencyLoader;
