import { getRootPath } from './filesystem.js';
import { getPackages } from './packages.js';
import {
	getDepenencyList,
	processDependencies,
	depTypesList,
} from './dependencies.js';

const updateDependencies = async (config, onDepenencyProcessed) => {
	const {
		rootDir,
		filterByPackages,
		packageDirs,
		isMonorepo,
		isHoisted,
		dependencyTypes,
		concurrency,
		updateTo,
		filterByDeps,
	} = config;

	// get list of packages to update
	// maybe do this stuff in an init function for the whole refit app?
	const rootPath = getRootPath(rootDir);

	const packageList = await getPackages({
		rootPath,
		isMonorepo,
		depTypes: dependencyTypes,
		packageDirs,
		filterByPackages,
	});

	// TODO: maybe getDepenencyList and processDependencies can be combined, doing the concurrency
	// stuff inside a function and do the filtering and stuff in there as well. That way there's a single
	// dependency list creation function
	let dependencyList = await getDepenencyList({
		packageList,
		isHoisted,
		rootPath,
		filterByDeps,
	});

	// update dependencies with information from the npm registry
	dependencyList = await processDependencies(
		dependencyList,
		onDepenencyProcessed,
		{
			concurrency,
		}
	);

	const depsToUpdate = dependencyList.filter((dep) => dep.upgradable);
	const pkgsToUpdate = new Set();

	for (const dep of depsToUpdate) {
		for (const app of dep.apps) {
			const pkg = packageList.get(app);
			const pkgDep = pkg.dependencies.get(dep.name);
			const depType = depTypesList[pkgDep.type];
			pkgsToUpdate.add(app);
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
