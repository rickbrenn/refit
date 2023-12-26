import semver from 'semver';
import pMap from 'p-map';
import {
	getRegistryData,
	sortDependencies,
	createDependency,
} from './dependencies';
import { getPackageManagerConfig } from './packageManagers';

const getDependencyList = async ({
	packageList,
	filterByPackages = [],
	rootPath,
	filterByDeps = [],
	filterByDepTypes = [],
	updateProgress,
	pMapOptions,
	sortBy,
	ignoreInternalDeps = true,
	packumentOptions = {},
	allowDeprecated = false,
	allowPrerelease = false,
	packageManager,
	global = false,
	updateTo,
}) => {
	const pm = getPackageManagerConfig(packageManager);

	let dependencyList = [];
	const multipleTargetVersions = [];

	if (global) {
		const globalDeps = await pm.packageManager.getGlobalDeps();

		for (const [name, version] of Object.entries(globalDeps)) {
			dependencyList.push({
				name,
				apps: [{ name: 'global', type: 'prod' }],
				targetRange: version,
				installedVersion: version,
				hoisted: false,
				internal: false,
			});
		}
	} else {
		const hoistedDeps = await pm.packageManager.getInstalledDeps(rootPath);

		let filteredPackages = Array.from(packageList.values());

		if (filterByPackages?.length) {
			filteredPackages = filterByPackages.reduce((acc, pkgName) => {
				if (packageList.has(pkgName)) {
					return [...acc, packageList.get(pkgName)];
				}

				return acc;
			}, []);
		}

		const localDeps = {};

		await Promise.all(
			filteredPackages.map(
				async ({ name: pkgName, path: pkgPath, isMonorepoRoot }) => {
					const deps = isMonorepoRoot
						? hoistedDeps
						: await pm.packageManager.getInstalledDeps(pkgPath);

					localDeps[pkgName] = deps;
				}
			)
		);

		for (const { name: pkgName, dependencies } of filteredPackages) {
			const installedDeps = localDeps[pkgName] ?? {};

			for (const { name, target, type } of dependencies.values()) {
				const isValidName =
					!filterByDeps.length || filterByDeps.includes(name);
				const isValidType =
					!filterByDepTypes.length || filterByDepTypes.includes(type);
				const internal = packageList.has(name);

				const isValidDep =
					(ignoreInternalDeps && !internal) || !ignoreInternalDeps;

				if (isValidName && isValidType && isValidDep) {
					let hoisted = false;

					const localVersion = installedDeps[name];
					const hoistedVersion = hoistedDeps[name];

					// prefers local version over hoisted version
					let installedVersion = localVersion || hoistedVersion;

					// if multiple installed versions use the one that matches the target
					// or the highest version
					if (Array.isArray(installedVersion)) {
						const matchedVersion = installedVersion.find(
							(version) => semver.satisfies(version, target)
						);
						const highestInstalled =
							semver.sort(installedVersion)[
								installedVersion.length - 1
							];

						installedVersion = matchedVersion || highestInstalled;
					}

					if (!internal && !localVersion && hoistedVersion) {
						hoisted = true;
					}

					let existingDepIndex;
					dependencyList.forEach((dep, index) => {
						if (dep?.name === name) {
							if (dep?.targetRange !== target) {
								multipleTargetVersions.push(name);
							}

							if (
								dep?.targetRange === target &&
								dep?.installedVersion === installedVersion
							) {
								existingDepIndex = index;
							}
						}
					});

					if (existingDepIndex > -1) {
						dependencyList[existingDepIndex].apps.push({
							name: pkgName,
							type,
						});
					} else {
						dependencyList.push({
							name,
							apps: [{ name: pkgName, type }],
							targetRange: target,
							installedVersion,
							hoisted,
							internal,
						});
					}
				}
			}
		}
	}

	// create a list of package names to fetch from the registry
	// excluding internal packages and duplicate package names
	const depsToFetch = dependencyList.reduce((acc, curr) => {
		if (!curr.internal && !acc.includes(curr.name)) {
			acc.push(curr.name);
		}

		return acc;
	}, []);

	let progressCurrent = 0;
	const processDependency = async (name) => {
		const res = await getRegistryData(name, packumentOptions);

		if (updateProgress) {
			progressCurrent += 1;
			updateProgress({
				progressCurrent,
				progressMax: depsToFetch.length,
				name,
			});
		}

		return res;
	};

	const packumentData = await pMap(
		depsToFetch,
		processDependency,
		pMapOptions
	);

	const packumentMap = new Map(
		packumentData.map((data) => [data.name, data])
	);

	dependencyList = dependencyList.map((d) =>
		createDependency({
			dependency: {
				...d,
				multipleTargets: multipleTargetVersions.includes(d.name),
			},
			registryData: packumentMap.get(d.name),
			config: { allowDeprecated, allowPrerelease, updateTo },
		})
	);

	return sortDependencies(dependencyList, sortBy);
};

export default getDependencyList;
