import { getPackages } from './packages';
import { filterDependencies } from './dependencies';
import getDependencyList from './getDependencyList';

const getDependencies = async (config, onDepenencyProcessed) => {
	const {
		rootPath,
		workspaces,
		workspace,
		sort,
		all,
		depTypes,
		semver,
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
		filterByPackages: workspace,
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

	return filterDependencies(dependencyList, { all, semver, noIssues });
};

export default getDependencies;
