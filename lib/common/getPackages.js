const path = require('path');
const semver = require('semver');
const pMap = require('p-map');
const pacote = require('pacote');
// const exec = require('await-exec');

function readPackageFiles(config) {
	const packageJsonData = require(path.resolve(config.packageJsonPath));
	const packageLockData = require(path.resolve(config.packageLockPath));

	// format package data into an array of packages
	const packages = config.packageTypes.reduce((arr, type) => {
		return [
			...arr,
			...Object.keys(packageJsonData[type]).map((packageName) => {
				return {
					name: packageName,
					type,
					target: packageJsonData[type][packageName],
					current: packageLockData.dependencies[packageName]?.version,
				};
			}),
		];
	}, []);

	return packages;
}

async function getPackageInfo(packageData) {
	const { target, current, name, type } = packageData;

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

async function getPackages(config, { filter, packages = [] }) {
	// TODO: prob don't need to define new vars on each action

	// info from package json and lock files
	const basePackages = readPackageFiles(config, packages);

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
