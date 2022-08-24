import { getRootPath } from './filesystem.js';
import { getPackages } from './packages.js';
import { getDependencyList } from './dependencies.js';

/**
 * Get all dependency information for packages
 * @param {Object} config - refit config
 * @param {Function} onDepenencyProcessed - event fired when a dependency has been processed
 * @returns {Promise<Object[]>} array of dependency data objects
 */
const getDependencies = async (config, onDepenencyProcessed) => {
	const {
		rootDir,
		filterByPackages,
		packageDirs,
		isMonorepo,
		isHoisted,
		filterByTypes,
		showAll,
		sortAlphabetical,
		concurrency,
		filterByDeps,
	} = config;

	const rootPath = getRootPath(rootDir);

	const packageList = await getPackages({
		rootPath,
		isMonorepo,
		packageDirs,
		filterByPackages,
	});

	let dependencyList = await getDependencyList({
		packageList,
		isHoisted,
		rootPath,
		filterByDeps,
		filterByTypes,
		updateProgress: onDepenencyProcessed,
		pMapOptions: {
			concurrency,
		},
	});

	// sort alphabetically by name
	if (sortAlphabetical) {
		dependencyList = dependencyList.sort((a, b) =>
			a.name.localeCompare(b.name)
		);
	} else {
		// sort by semver update type
		dependencyList = dependencyList.sort((a, b) => {
			if (b.updateType === a.updateType) {
				return a.name.localeCompare(b.name);
			}

			if (b.updateType === 'major' && a.updateType !== 'major') {
				return 1;
			}

			if (
				b.updateType === 'minor' &&
				a.updateType !== 'major' &&
				a.updateType !== 'minor'
			) {
				return 1;
			}

			if (
				b.updateType === 'patch' &&
				a.updateType !== 'major' &&
				a.updateType !== 'minor' &&
				a.updateType !== 'patch'
			) {
				return 1;
			}

			return -1;
		});
	}

	// filter based on filter arg
	if (!showAll) {
		return dependencyList.filter((pkg) => pkg.upgradable);
	}

	return dependencyList;
};

export default getDependencies;
