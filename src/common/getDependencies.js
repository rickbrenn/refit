import { getPackages } from './packages';
import { getDependencyList } from './dependencies';

const getDependencies = async (config, onDepenencyProcessed) => {
	const {
		rootPath,
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
		noIssues,
	} = config;

	const packageList = await getPackages({
		rootPath,
		isMonorepo: !!packageDirs?.length,
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

				if (isValidType) {
					if (pkg.upgradable) {
						return true;
					}

					const hasIssues =
						pkg.installNeeded ||
						pkg.notOnRegistry ||
						pkg.deprecated;

					return !noIssues && hasIssues;
				}

				return false;
		  });
};

export default getDependencies;
