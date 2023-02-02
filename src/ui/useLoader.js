import { useState, useCallback, useMemo } from 'react';

const useLoader = (loaderFunc, config) => {
	const [dependencies, setDependencies] = useState(null);
	const [loading, setLoading] = useState(true);
	const [loaderState, setLoaderState] = useState({
		text: 'Loading the truck..',
	});

	// map the dependencies data to table row objects
	const mapDataToRows = (pkgs) => {
		return pkgs.map((p) => {
			// display version to upgrade to
			const upgradeVersion = p.upgradable && p.versionRange.latest;

			// if the dependency is not in node_modules display 'missing'
			const installedText = p.missing ? 'MISSING' : p.version?.installed;

			// how to display the list of dependencies
			const manyApps = p.apps.length > 1;
			const appsText = manyApps ? `${p.apps.length} Packages` : p.apps[0];

			return {
				name: p.name || '',
				target: p.versionRange?.target || '',
				installed: installedText || '',
				wanted: p.version?.wanted || '',
				latest: p.version?.latest || '',
				upgrade: upgradeVersion || '',
				type: p.type || '',
				hoisted: p.hoisted.toString() || '',
				in: appsText || '',
				color: p.color,
				upgradeParts: p.upgradeParts || {},
			};
		});
	};

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

	const startLoader = useCallback(async () => {
		try {
			// get dependencies data
			const dependenciesData = await loaderFunc(config, updateProgress);

			// format the data for the tab rows
			const formattedData = mapDataToRows(dependenciesData);

			setDependencies(formattedData);
			setLoading(false);
		} catch (error) {
			setLoaderState({
				text: 'Error!',
			});
			throw error;
		}
	}, [config, loaderFunc, updateProgress]);

	return useMemo(
		() => ({
			startLoader,
			dependencies,
			loading,
			loaderState,
		}),
		[startLoader, dependencies, loading, loaderState]
	);
};

export default useLoader;
