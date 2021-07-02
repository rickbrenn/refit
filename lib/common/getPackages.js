const path = require('path');
const semver = require('semver');
const pMap = require('p-map');
const pacote = require('pacote');
const fs = require('fs');
// const exec = require('await-exec');

function readPackageFiles(config, directory) {
	const packageJsonData = require(path.resolve(
		directory.path,
		'package.json'
	));
	const packageLockData = require(path.resolve(
		directory.path,
		'package-lock.json'
	));

	// format package data into an array of packages
	const packages = config.packageTypes.reduce((arr, type) => {
		if (packageJsonData[type]) {
			return [
				...arr,
				...Object.keys(packageJsonData[type]).map((packageName) => {
					return {
						name: packageName,
						apps: [directory.name],
						type,
						target: packageJsonData[type][packageName],
						current:
							packageLockData.dependencies[packageName]?.version,
					};
				}),
			];
		}

		return arr;
	}, []);

	return packages;
}

async function getPackageInfo(packageData) {
	const { target, apps, current, name, type } = packageData;

	// TODO: there's a faster way to do this; ncu is faster
	// const response = await exec(`npm info ${name} versions dist-tags --json`); // slow and uses 100% cpu
	try {
		const registryData = await pacote.packument(name, {}); // TODO: add optional options?
		const versions = Object.keys(registryData.versions);

		const wanted = semver.maxSatisfying(versions, target);

		// versions
		const installedVersion = null;
		const currentVersion = current;
		const wantedVersion = wanted;
		const latestVersion = registryData['dist-tags'].latest;

		// ranges
		const targetRange = target;
		const wantedRange = `^${wantedVersion}`;
		const latestRange = `^${latestVersion}`;

		// issues
		// const missing = !installedVersion || !currentVersion;
		const missing = !currentVersion;
		const installNeeded =
			missing ||
			(targetRange === wantedRange && currentVersion !== wantedVersion);

		// upgrades
		const upgradableToWanted = targetRange !== wantedRange;
		const upgradableToLatest = targetRange !== latestRange;
		const upgradable = upgradableToWanted || upgradableToLatest;

		return {
			name,
			type,
			apps,
			versions,
			version: {
				installed: installedVersion,
				current: currentVersion,
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
			versions: [],
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

async function getPackages(config, { filter, packages = [], mono }) {
	// TODO: prob don't need to define new vars on each action

	const packageDirectories = [{ name: 'root', path: path.resolve('./') }];
	if (mono) {
		const monoRepoDirs = ['./packages', './modules'];
		monoRepoDirs.forEach((dir) => {
			if (fs.lstatSync(dir).isDirectory()) {
				fs.readdirSync(dir).forEach((subDir) => {
					const packageDirectory = path.resolve(dir, subDir);
					if (fs.lstatSync(packageDirectory).isDirectory()) {
						packageDirectories.push({
							name: subDir,
							path: packageDirectory,
						});
					}
				});
			}
		});
	}

	// info from package json and lock files
	let basePackages = [];
	packageDirectories.forEach((dir) => {
		basePackages = basePackages.concat(readPackageFiles(config, dir));
	});

	// remove duplicate packages
	basePackages.forEach((pkg, index) => {
		const duplicates = basePackages.filter((subPkg, subIndex) => {
			const samePkg = index === subIndex;
			const sameName = pkg.name === subPkg.name;
			const sameTarget = pkg.target === subPkg.target;

			const isDuplicate = !samePkg && sameName && sameTarget;

			if (isDuplicate) {
				basePackages.splice(subIndex, 1);
			}

			return isDuplicate;
		});

		basePackages[index] = {
			...pkg,
			apps: [...pkg.apps, ...duplicates.map((x) => x.apps[0])],
		};
	});

	// filter by specified packages or use all
	const chosenPackages = packages.length
		? basePackages.filter((pkg) => packages.includes(pkg.name))
		: basePackages;

	// get installed info
	// let installedData;
	// try {
	// 	installedData = await exec(`npm ls --depth=0 --json --silent`);
	// } catch (error) {
	// 	installedData = JSON.parse(error.stdout);
	// }
	// console.log('installedData :>> ', installedData);

	// add version info from npm registry
	const fullPackages = await pMap(chosenPackages, getPackageInfo, {
		concurrency: 8,
	});

	// sort alphabetically by name
	const sortedPackages = fullPackages.sort((a, b) =>
		a.name.localeCompare(b.name)
	);

	// filter based on filter arg
	if (filter) {
		return sortedPackages.filter((package) => {
			if (filter === 'outdated') {
				return package.upgradable;
			}

			if (filter === 'wanted') {
				return package.upgradable && !!package.upgradableToWanted;
			}

			return true;
		});
	}

	return sortedPackages;
}

module.exports = getPackages;
