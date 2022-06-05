import path from 'path';
import fs from 'fs';
import rpt from 'read-package-tree';
import semver from 'semver';
import pMap from 'p-map';
import pacote from 'pacote';
import fetch from 'node-fetch';
import { isDirectory, hasPackageJsonFile } from './filesystem.js';
import getDiffVersionParts from './getDiffVersionParts.js';

const getPackageJsonAndModules = async (pathToPackage, filter) =>
	new Promise((resolve, reject) => {
		rpt(
			pathToPackage,
			filter,
			(err, { package: packageJson, children }) => {
				if (err) {
					return reject(err);
				}

				const installedModules = children.map(
					({ package: { name, version } }) => ({
						name,
						version,
					})
				);

				return resolve({
					packageJson,
					installedModules,
				});
			}
		);
	});

const getPackageInfo = async (directory) => {
	// read the package.json file and get the installed modules from node_modules
	const { packageJson, installedModules } = await getPackageJsonAndModules(
		directory
	);

	return {
		name: packageJson.name,
		location: directory,
		packageJson,
		installedModules,
	};
};

const getPackages = async (directory, packageDirectories) => {
	// ensure the package directory is an npm package
	if (!hasPackageJsonFile(directory)) {
		throw new Error('directory does not have a package.json file');
	}

	let packages = [directory];

	// add monorepo packages to the list of package locations
	if (packageDirectories) {
		packages = packageDirectories.reduce((acc, curr) => {
			const packagesPath = path.resolve(directory, curr);
			// verify provided path is a directory
			if (isDirectory(packagesPath)) {
				// loop though each item in the directory
				fs.readdirSync(packagesPath).forEach((subDir) => {
					// full path to potential package
					const packageDirectory = path.resolve(packagesPath, subDir);

					// verify the potential package is valid:
					if (
						isDirectory(packageDirectory) &&
						hasPackageJsonFile(packageDirectory)
					) {
						acc.push(packageDirectory);
					}
				});
			}

			return acc;
		}, packages);
	}

	return Promise.all(packages.map(getPackageInfo));
};

const getHoistedModules = async (rootDir) => {
	const { installedModules: rootModules } = await getPackageJsonAndModules(
		rootDir,
		(node) => !node.parent
	);

	return rootModules;
};

const getDependencyList = async (
	selectedPackages,
	dependencyTypes,
	hoistedModules,
	allPackages
) =>
	selectedPackages.reduce((dependencies, pkg) => {
		const { name, packageJson, installedModules } = pkg;
		// process each dependency in the package.json file
		dependencyTypes.forEach((depType) => {
			const depsOfType = packageJson[depType];

			if (depsOfType) {
				Object.keys(depsOfType).forEach((depName) => {
					// get the node_modules info on this package if installed
					const moduleFilter = (module) => module.name === depName;
					// local install
					let installData = installedModules.find(moduleFilter);
					let hoisted = false;
					let internal = false;

					// if not local check for hoisted
					if (!installData) {
						installData = hoistedModules.find(moduleFilter);
						hoisted = !!installData;
					}

					// check for internal dependency
					if (allPackages.some((inPkg) => inPkg.name === depName)) {
						internal = true;
					}

					const targetRange = depsOfType[depName];
					const installedVersion = installData?.version;

					// check for duplicate
					const duplicatePackageIndex = dependencies.findIndex(
						(dep) =>
							dep.name === depName &&
							dep.targetRange === targetRange &&
							dep.installedVersion === installedVersion
					);

					// if the package is a duplicate update the existing record
					if (duplicatePackageIndex >= 0) {
						dependencies[duplicatePackageIndex].apps.push(name);
					} else {
						// processed data on the package
						const depData = {
							name: depName,
							apps: [name],
							type: depType,
							targetRange,
							installedVersion,
							hoisted,
							internal,
						};

						dependencies.push(depData);
					}
				});
			}
		});

		return dependencies;
	}, []);

const getDependencyInfo = async ({
	targetRange,
	installedVersion,
	apps,
	name,
	type,
	hoisted,
	internal,
}) => {
	try {
		if (internal) {
			return {
				name,
				type,
				apps,
				hoisted,
				version: {
					installed: '',
					wanted: '',
					latest: '',
				},
				versionRange: {
					target: targetRange,
					wanted: targetRange,
					latest: targetRange,
				},
				internal,
				missing: false,
				installNeeded: false,
				upgradable: false,
				upgradableToWanted: false,
				upgradableToLatest: false,
				color: '',
				updateType: '',
				upgradeParts: {
					wildcard: '',
					midDot: '',
					uncoloredText: '',
					coloredText: '',
				},
			};
		}

		// TODO: support more semver types
		const wildcards = ['^', '~'];
		const currentWildcard =
			wildcards.find((wildcard) => targetRange.includes(wildcard)) || '';

		const registryData = await pacote.packument(name, {}); // TODO: add optional options?

		const versions = Object.keys(registryData.versions);

		// versions
		const wantedVersion = semver.maxSatisfying(versions, targetRange);
		const latestVersion = registryData['dist-tags'].latest;

		// ranges
		const wantedRange = currentWildcard + wantedVersion;
		const latestRange = currentWildcard + latestVersion;

		// upgrades
		const upgradableToWanted = targetRange !== wantedRange;
		const upgradableToLatest = targetRange !== latestRange;
		const upgradable = upgradableToWanted || upgradableToLatest;

		// issues
		const missing = !installedVersion;
		const installedIsOff = !semver.satisfies(installedVersion, targetRange);
		const installNeeded = missing || installedIsOff;

		// get coloring and version parts for the upgrade text
		const {
			color,
			updateType,
			wildcard,
			midDot,
			uncoloredText,
			coloredText,
		} = getDiffVersionParts(targetRange, latestRange);

		// get the package link
		// TODO: npms has a bulk API, maybe run a bunch of these using the bulk API instead
		// TODO: will have to change this for yarn support
		const npmsInfo = await (
			await fetch(`https://api.npms.io/v2/package/${name}`)
		).json();
		const npmLink = npmsInfo?.collected?.metadata?.links?.npm;

		return {
			name,
			url: npmLink,
			type,
			apps,
			hoisted,
			version: {
				installed: installedVersion,
				wanted: wantedVersion,
				latest: latestVersion,
			},
			versionRange: {
				target: targetRange,
				wanted: wantedRange,
				latest: latestRange,
			},
			internal,
			missing,
			installNeeded,
			upgradable,
			upgradableToWanted,
			upgradableToLatest,
			color,
			updateType,
			upgradeParts: {
				wildcard,
				midDot,
				uncoloredText,
				coloredText,
			},
		};
	} catch (error) {
		return {
			name,
			type,
			apps,
			hoisted,
			version: {
				installed: '',
				current: '',
				wanted: '',
				latest: '',
			},
			versionRange: {
				target: '',
				wanted: '',
				latest: '',
			},
			internal,
			missing: true,
			installNeeded: true,
			upgradable: true,
			upgradableToWanted: true,
			upgradableToLatest: true,
			color: '',
			updateType: '',
			upgradeParts: {
				wildcard: '',
				midDot: '',
				uncoloredText: '',
				coloredText: '',
			},
		};
	}
};

const processDependencies = async (
	dependencies,
	updateProgress,
	pMapOptions
) => {
	const processDependency = async (dependencyData, index) => {
		const progressCurrent = index + 1;
		const progressMax = dependencies.length;

		updateProgress(progressCurrent, progressMax, dependencyData.name);

		return getDependencyInfo(dependencyData);
	};

	return pMap(dependencies, processDependency, pMapOptions);
};

/**
 * Get all dependency information for packages
 * @param {Object} config - refit config
 * @param {Function} onDepenencyProcessed - event fired when a dependency has been processed
 * @returns {Promise<Object[]>} array of dependency data objects
 */
const getDependencies = async (config, onDepenencyProcessed) => {
	const {
		rootDir,
		usePackages,
		packageDirs,
		monorepo,
		hoisted,
		dependencyTypes,
		showAll,
		sortAlphabetical,
	} = config;

	// root path of the package
	const rootPath = path.resolve(rootDir);

	// get the info for the package or all monorepo packages
	const packages = await getPackages(rootPath, monorepo && packageDirs);

	// get installed hoisted modules at the root of the repo
	const hoistedModules = hoisted ? await getHoistedModules(rootPath) : [];

	// only use the selected package if the argument is provided
	const selectedPackages = usePackages.length
		? packages.filter((pkg) => usePackages.includes(pkg.name))
		: packages;

	// get list of dependencies for each package with basic information
	let dependencies = await getDependencyList(
		selectedPackages,
		dependencyTypes,
		hoistedModules,
		packages
	);

	// TODO: concurrency to config
	// update dependencies with information from the npm registry
	dependencies = await processDependencies(
		dependencies,
		onDepenencyProcessed,
		{
			concurrency: 8,
		}
	);

	// sort alphabetically by name
	if (sortAlphabetical) {
		dependencies = dependencies.sort((a, b) =>
			a.name.localeCompare(b.name)
		);
	} else {
		// sort by semver update type
		dependencies = dependencies.sort((a, b) => {
			if (b.updateType === a.updateType) {
				return a.name.localeCompare(b.name);
			}

			if (b.updateType === 'major' && a.updateType !== 'major') {
				return 1;
			}

			if (
				b.updateType === 'minor' &&
				a.updateType !== 'major' &&
				a.updateType !== 'minor'
			) {
				return 1;
			}

			if (
				b.updateType === 'patch' &&
				a.updateType !== 'major' &&
				a.updateType !== 'minor' &&
				a.updateType !== 'patch'
			) {
				return 1;
			}

			return -1;
		});
	}

	// filter based on filter arg
	if (!showAll) {
		return dependencies.filter((pkg) => pkg.upgradable);
	}

	return dependencies;
};

export default getDependencies;
