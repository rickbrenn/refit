import { getPackages } from './packages';
import { getDependencyList, filterDependencies } from './dependencies';

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

	return filterDependencies(dependencyList, { all, updateTypes, noIssues });
};

export default getDependencies;
