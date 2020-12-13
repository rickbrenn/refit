const path = require('path');
const semver = require('semver');
const pMap = require('p-map');
const pacote = require('pacote');

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
	const { target, current, name } = packageData;

	// TODO: there's a faster way to do this; ncu is faster
	// const response = await exec(`npm info ${name} versions dist-tags --json`); // slow and uses 100% cpu
	const registryData = await pacote.packument(name, {}); // TODO: add optional options?
	const versions = Object.keys(registryData.versions);

	const wanted = semver.maxSatisfying(versions, target);

	const { latest } = registryData['dist-tags'];
	const latestRange = latest === current ? '' : `^${latest}`;
	const wantedRange = wanted === current ? '' : `^${wanted}`;

	const installNeeded = wantedRange === target; // TODO: check which version is installed instead

	return {
		...packageData,
		versions,
		latest,
		wanted,
		upgradable: !!(latestRange || wantedRange),
		installNeeded,
		missing: !current,
		upgrade: {
			latest: latestRange,
			wanted: wantedRange,
		},
	};
}

async function getPackages(config, { filter }) {
	// info from package json and lock files
	const basePackages = readPackageFiles(config);

	// add version info from npm registry
	const packages = await pMap(basePackages, getPackageInfo, {
		concurrency: 8,
	});

	// filter based on filter arg
	if (filter) {
		return packages.filter((package) => {
			if (filter === 'outdated') {
				return package.upgradable;
			}

			if (filter === 'wanted') {
				return package.upgradable && !!package.upgrade.wanted;
			}

			return true;
		});
	}

	return packages;
}

module.exports = getPackages;
