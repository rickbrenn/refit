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
		minReleaseAge,
		minReleaseAgeExclude,
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
			// publish times (needed for the age filter) require full metadata
			fullMetadata: verbose || minReleaseAge > 0,
		},
		allowPrerelease: prerelease,
		allowDeprecated: deprecated,
		packageManager,
		global,
		updateTo,
		minReleaseAge,
		minReleaseAgeExclude,
	});

	return filterDependencies(dependencyList, { all, semver, noIssues });
};

export default getDependencies;
