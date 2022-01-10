import path from 'path';
import fs from 'fs';
import rpt from 'read-package-tree';
import semver from 'semver';
import pMap from 'p-map';
import pacote from 'pacote';
import fetch from 'node-fetch';
import { isDirectory, hasPackageJsonFile } from '../filesystem.js';
import getDiffVersionParts from './getDiffVersionParts.js';

function getPackageJsonAndModules(pathToPackage, filter) {
	return new Promise((resolve, reject) => {
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
}

async function getDependenciesFromPackage(
	rootPath,
	dependencyTypes,
	currentPackages = [],
	rootDependencies
) {
	// read the package.json file and get the installed modules from node_modules
	const { packageJson, installedModules } = await getPackageJsonAndModules(
		rootPath
	);

	// array of processed dependencies in this package
	const dependencies = [];

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

				// if not local check for hoisted
				if (!installData) {
					installData = rootDependencies.find(moduleFilter);
					hoisted = !!installData;
				}

				const targetRange = depsOfType[depName];
				const installedVersion = installData?.version;

				// check for duplicate
				const duplicatePackageIndex = currentPackages.findIndex(
					(pkg) =>
						pkg.name === depName &&
						pkg.targetRange === targetRange &&
						pkg.installedVersion === installedVersion
				);

				// if the package is a duplicate update the existing record
				if (duplicatePackageIndex >= 0) {
					currentPackages[duplicatePackageIndex].apps.push(
						packageJson.name
					);
				} else {
					// processed data on the package
					const depData = {
						name: depName,
						apps: [packageJson.name],
						type: depType,
						targetRange,
						installedVersion,
						hoisted,
					};

					dependencies.push(depData);
				}
			});
		}
	});

	return dependencies;
}

async function getPackageInfo({
	targetRange,
	installedVersion,
	apps,
	name,
	type,
	hoisted,
}) {
	try {
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
}

function processDependencies(
	dependencies,
	updateProgress,
	{ concurrency = 8 } = {}
) {
	const processPackage = async (packageData, index) => {
		const progressCurrent = index + 1;
		const progressMax = dependencies.length;

		updateProgress(progressCurrent, progressMax, packageData.name);

		return getPackageInfo(packageData);
	};

	return pMap(dependencies, processPackage, {
		concurrency,
	});
}

async function getPackages(
	{
		directory,
		monorepo,
		packageDirs,
		hoisted,
		dependencyTypes,
		filter,
		sort,
		packageDir,
	},
	updateProgress
) {
	const rootPath = path.resolve(directory);

	/*
		New process:
		- get package locations
		- get packages list
		- process packages
	*/

	/*
		Get package locations
	*/

	const packageLocations = [];

	// if a specific package location is specified use that one
	if (packageDir) {
		packageLocations.push(packageDir);
	} else {
		packageLocations.push(rootPath);

		if (monorepo) {
			// add monorepo packages to the list of package locations
			packageDirs.forEach((dir) => {
				// verify provided path is a directory
				if (isDirectory(dir)) {
					// loop though each item in the directory
					fs.readdirSync(dir).forEach((subDir) => {
						// full path to potential package
						const packageDirectory = path.resolve(dir, subDir);

						// verify the potential package is valid:
						if (
							isDirectory(packageDirectory) &&
							hasPackageJsonFile(packageDirectory)
						) {
							packageLocations.push(packageDirectory);
						}
					});
				}
			});
		}
	}

	/*
		Get hoisted modules
	*/

	const hoistedModules = [];

	// get installed hoisted modules at the root of the repo
	if (hoisted) {
		const { installedModules: rootModules } =
			await getPackageJsonAndModules(rootPath, (node) => !node.parent);
		hoistedModules.push(...rootModules);
	}

	/*
		Get a list of dependencies from each package
	*/

	let dependencies = [];
	await Promise.all(
		packageLocations.map(async (dir) => {
			const packageDeps = await getDependenciesFromPackage(
				dir,
				dependencyTypes,
				dependencies,
				hoistedModules
			);
			dependencies.push(...packageDeps);
		})
	);

	/*
		Process each dependency
	*/

	dependencies = await processDependencies(dependencies, updateProgress, {
		concurency: 8,
	});

	// sort alphabetically by name
	if (sort === 'abc') {
		dependencies = dependencies.sort((a, b) =>
			a.name.localeCompare(b.name)
		);
	}

	// sort by semver update type
	if (sort === 'update') {
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
	if (filter) {
		return dependencies.filter((pkg) => {
			if (filter === 'outdated') {
				return pkg.upgradable;
			}

			if (filter === 'wanted') {
				return pkg.upgradable && !!pkg.upgradableToWanted;
			}

			return true;
		});
	}

	return dependencies;
}

export default getPackages;
