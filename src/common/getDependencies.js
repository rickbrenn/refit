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
		sort,
		all,
		depTypes,
		updateTypes,
		verbose,
		prerelease,
		deprecated,
		packageManager,
		// TODO: add option to return issues or not
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
		sortBy: sort,
		packumentOptions: {
			fullMetadata: verbose,
		},
		allowPrerelease: prerelease,
		allowDeprecated: deprecated,
		packageManager,
	});

	return all
		? dependencyList
		: dependencyList.filter((pkg) => {
				const isValidType =
					!updateTypes.length || updateTypes.includes(pkg.updateType);

				return (
					isValidType &&
					(pkg.upgradable ||
						pkg.installNeeded ||
						pkg.notOnRegistry ||
						pkg.deprecated)
				);
		  });
};

export default getDependencies;
