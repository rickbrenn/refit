const path = require('path');
const fs = require('fs');
const rpt = require('read-package-tree');
const semver = require('semver');
const pMap = require('p-map');
const pacote = require('pacote');
const { isDirectory, hasPackageJsonFile } = require('../filesystem');

function getPackageJsonAndModules(pathToPackage, filter) {
	return new Promise((resolve, reject) => {
		rpt(pathToPackage, filter, (err, { package, children }) => {
			if (err) {
				return reject(err);
			}

			const installedModules = children.map(
				({ package: { name, version } }) => ({
					name,
					version,
				})
			);
			resolve({
				packageJson: package,
				installedModules,
			});
		});
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

async function getPackageInfo(packageData) {
	const {
		targetRange,
		installedVersion,
		apps,
		name,
		type,
		hoisted,
	} = packageData;

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
		const installNeeded =
			missing ||
			(!upgradableToWanted && installedVersion !== wantedVersion);

		return {
			name,
			type,
			apps,
			hoisted,
			// versions,
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
		};
	} catch (error) {
		return {
			name,
			type,
			apps,
			hoisted,
			// versions: [],
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
		};
	}
}

async function getPackages({
	directory,
	monorepo,
	packageDirs,
	hoisted,
	dependencyTypes,
	filter,
	packageDir,
}) {
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
		const {
			installedModules: rootModules,
		} = await getPackageJsonAndModules(rootPath, (node) => !node.parent);
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

	dependencies = await pMap(dependencies, getPackageInfo, {
		concurrency: 8,
	});

	// sort alphabetically by name
	dependencies = dependencies.sort((a, b) => a.name.localeCompare(b.name));

	// filter based on filter arg
	if (filter) {
		return dependencies.filter((package) => {
			if (filter === 'outdated') {
				return package.upgradable;
			}

			if (filter === 'wanted') {
				return package.upgradable && !!package.upgradableToWanted;
			}

			return true;
		});
	}

	return dependencies;
}

module.exports = getPackages;
