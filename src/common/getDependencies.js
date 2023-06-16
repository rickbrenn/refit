import { getPackages } from './packages';
import { getDependencyList } from './dependencies';

/**
 * Get all dependency information for packages
 * @param {Object} config - refit config
 * @param {Function} onDepenencyProcessed - event fired when a dependency has been processed
 * @returns {Promise<Object[]>} array of dependency data objects
 */
const getDependencies = async (config, onDepenencyProcessed) => {
	const {
		rootPath,
		filterByPackages,
		packageDirs,
		isMonorepo,
		isHoisted,
		showAll,
		sortAlphabetical,
		concurrency,
		filterByDeps,
		filterByDepTypes,
		filterByUpdateTypes,
	} = config;

	const packageList = await getPackages({
		rootPath,
		isMonorepo,
		packageDirs,
	});

	const dependencyList = await getDependencyList({
		packageList,
		filterByPackages,
		isHoisted,
		rootPath,
		filterByDeps,
		filterByDepTypes,
		updateProgress: onDepenencyProcessed,
		pMapOptions: {
			concurrency,
		},
		sortAlphabetical,
	});

	return showAll
		? dependencyList
		: dependencyList.filter((pkg) => {
				const isValidType =
					!filterByUpdateTypes.length ||
					filterByUpdateTypes.includes(pkg.updateType);
				return isValidType && pkg.upgradable;
		  });
};

export default getDependencies;
