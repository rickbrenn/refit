import { getPackages } from './packages';
import { filterDependencies } from './dependencies';
import getDependencyList from './getDependencyList';

const getDependencies = async (config, onDepenencyProcessed) => {
	const {
		rootPath,
		workspaces,
		packages,
		sort,
		all,
		depTypes,
		updateTypes,
		dependencies,
		verbose,
		prerelease,
		deprecated,
		packageManager,
		noIssues,
		global,
		updateTo,
	} = config;

	const packageList = global
		? new Map()
		: await getPackages({
				rootPath,
				workspaces,
			});

	const dependencyList = await getDependencyList({
		packageList,
		filterByPackages: packages,
		rootPath,
		filterByDeps: dependencies,
		filterByDepTypes: depTypes,
		updateProgress: onDepenencyProcessed,
		sortBy: sort,
		packumentOptions: {
			fullMetadata: verbose,
		},
		allowPrerelease: prerelease,
		allowDeprecated: deprecated,
		packageManager,
		global,
		updateTo,
	});

	return filterDependencies(dependencyList, { all, updateTypes, noIssues });
};

export default getDependencies;
