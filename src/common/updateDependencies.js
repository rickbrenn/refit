import { getPackages } from './packages';
import { depTypesList } from './dependencies';
import getDependencyList from './getDependencyList';

const updateDependencies = async (config, onDepenencyProcessed) => {
	const {
		rootPath,
		workspace,
		workspaces,
		sort,
		updateTo,
		dependencies,
		depTypes,
		semver,
		packageManager,
		prerelease,
		deprecated,
		minReleaseAge,
		minReleaseAgeExclude,
	} = config;

	const packageList = await getPackages({
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
			fullMetadata: minReleaseAge > 0,
		},
		allowPrerelease: prerelease,
		allowDeprecated: deprecated,
		packageManager,
		updateTo,
		minReleaseAge,
		minReleaseAgeExclude,
	});

	const depsToUpdate = dependencyList.filter((dep) => {
		const isValidType = !semver.length || semver.includes(dep.updateType);
		return isValidType && dep.upgradable;
	});
	const pkgsToUpdate = new Set();

	for (const dep of depsToUpdate) {
		for (const app of dep.apps) {
			const pkg = packageList.get(app.name);
			const pkgDep = pkg.dependencies.get(dep.name);
			const depType = depTypesList[pkgDep.type];
			pkgsToUpdate.add(app.name);
			pkg.pkgJsonInstance.update({
				[depType]: {
					...pkg.pkgJsonInstance.content[depType],
					[dep.name]: dep.versionRange[updateTo],
				},
			});
		}
	}

	const pkgListArray = [...pkgsToUpdate];

	await Promise.all(
		pkgListArray.map(async (pkgName) => {
			const pkg = packageList.get(pkgName);
			return pkg.pkgJsonInstance.save();
		})
	);

	return depsToUpdate;
};

export default updateDependencies;
