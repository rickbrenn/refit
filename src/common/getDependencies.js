import { getPackages } from './packages';
import { getDependencyList } from './dependencies';

const getDependencies = async (config, onDepenencyProcessed) => {
	const {
		rootPath,
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
		noIssues,
		global,
	} = config;

	const packageList = global
		? new Map()
		: await getPackages({
				rootPath,
				isMonorepo: !!packageDirs?.length,
				packageDirs,
		  });

	const dependencyList = await getDependencyList({
		packageList,
		filterByPackages: packages,
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
		global,
	});

	return all
		? dependencyList
		: dependencyList.filter((pkg) => {
				const isValidType =
					!updateTypes.length || updateTypes.includes(pkg.updateType);

				if (isValidType) {
					if (pkg.upgradable) {
						return true;
					}

					return !noIssues && pkg.hasError;
				}

				return false;
		  });
};

export default getDependencies;
