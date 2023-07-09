import { getPackages } from './packages';
import { getDependencyList } from './dependencies';

const getDependencies = async (config, onDepenencyProcessed) => {
	const {
		rootPath,
		monorepo,
		hoisted,
		concurrency,
		packageDirs,
		packages,
		sortAlpha,
		all,
		depTypes,
		updateTypes,
	} = config;

	const packageList = await getPackages({
		rootPath,
		isMonorepo: monorepo,
		packageDirs,
	});

	const dependencyList = await getDependencyList({
		packageList,
		filterByPackages: packages,
		isHoisted: hoisted,
		rootPath,
		filterByDepTypes: depTypes,
		updateProgress: onDepenencyProcessed,
		pMapOptions: {
			concurrency,
		},
		sortAlphabetical: sortAlpha,
	});

	return all
		? dependencyList
		: dependencyList.filter((pkg) => {
				const isValidType =
					!updateTypes.length || updateTypes.includes(pkg.updateType);
				return isValidType && pkg.upgradable;
		  });
};

export default getDependencies;
