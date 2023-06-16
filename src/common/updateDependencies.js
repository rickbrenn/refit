import { getPackages } from './packages';
import { getDependencyList, depTypesList } from './dependencies';

const updateDependencies = async (config, onDepenencyProcessed) => {
	const {
		rootPath,
		filterByPackages,
		packageDirs,
		isMonorepo,
		isHoisted,
		filterByTypes,
		sortAlphabetical,
		concurrency,
		updateTo,
		filterByDeps,
	} = config;

	const packageList = await getPackages({
		rootPath,
		isMonorepo,
		packageDirs,
	});

	const dependencyList = await getDependencyList({
		packageList,
		filterByPackages,
		isHoisted,
		rootPath,
		filterByDeps,
		filterByTypes,
		updateProgress: onDepenencyProcessed,
		pMapOptions: {
			concurrency,
		},
		sortAlphabetical,
	});

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
