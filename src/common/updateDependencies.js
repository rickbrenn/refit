import { getPackages } from './packages';
import { getDependencyList, depTypesList } from './dependencies';

const updateDependencies = async (config, onDepenencyProcessed) => {
	const {
		rootPath,
		hoisted,
		packages,
		concurrency,
		packageDirs,
		sort,
		updateTo,
		dependencies,
		depTypes,
		updateTypes,
		packageManager,
		prerelease,
		deprecated,
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
		filterByDeps: dependencies,
		filterByDepTypes: depTypes,
		updateProgress: onDepenencyProcessed,
		pMapOptions: {
			concurrency,
		},
		sortBy: sort,
		allowPrerelease: prerelease,
		allowDeprecated: deprecated,
		packageManager,
	});

	// TODO: error handling for packages that don't exist

	const depsToUpdate = dependencyList.filter((dep) => {
		const isValidType =
			!updateTypes.length || updateTypes.includes(dep.updateType);
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

	const pkgListArray = Array.from(pkgsToUpdate);

	await Promise.all(
		pkgListArray.map(async (pkgName) => {
			const pkg = packageList.get(pkgName);
			return pkg.pkgJsonInstance.save();
		})
	);

	return depsToUpdate;
};

export default updateDependencies;
