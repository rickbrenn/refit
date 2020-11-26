const path = require('path');
const exec = require('await-exec');
const clui = require('clui');
const semver = require('semver');
const chalk = require('chalk');

// TODO: figure out what to do with the file path and cwd
const rootFilePath = (file) => {
	return path.join(__dirname, `../${file}`);
};

function readPackageFiles(config) {
	const packageJsonData = require(rootFilePath(config.packageJsonPath));
	const packageLockData = require(rootFilePath(config.packageLockPath));

	// format package data into an array of packages
	const packages = config.packageTypes.reduce((arr, type) => {
		return [
			...arr,
			...Object.keys(packageJsonData[type]).map((packageName) => {
				return {
					name: packageName,
					type,
					target: packageJsonData[type][packageName],
					current: packageLockData.dependencies[packageName].version,
				};
			}),
		];
	}, []);

	return packages;
}

async function getPackageInfo(packageData) {
	const { target, current, name } = packageData;

	// TODO: there's a faster way to do this; ncu is faster
	const response = await exec(`npm info ${name} versions dist-tags --json`);
	const versionData = JSON.parse(response.stdout);
	const { versions } = versionData;

	const wanted = semver.maxSatisfying(versions, target);

	const { latest } = versionData['dist-tags'];
	const latestRange = latest === current ? '' : `^${latest}`;
	const wantedRange = wanted === current ? '' : `^${wanted}`;

	return {
		...packageData,
		versions,
		latest,
		wanted,
		upgradable: !!(latestRange || wantedRange),
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
	// TODO: throttle amount of concurrent requests
	const packages = await Promise.all(basePackages.map(getPackageInfo));

	// filter based on filter arg
	if (filter) {
		return packages.filter((package) => {
			if (filter === 'outdated') {
				return package.upgradable;
			}

			return true;
		});
	}

	return packages;
}

const update = async (config) => {
	const Spinner = clui.Spinner;

	const loading = new Spinner('Looking up packages..', [
		'⣾',
		'⣽',
		'⣻',
		'⢿',
		'⡿',
		'⣟',
		'⣯',
		'⣷',
	]);

	loading.start();

	// ..optionally remove old node_modules and package-lock.json

	// get list of packages
	const packages = await getPackages(config, { filter: 'outdated' });

	loading.stop();

	// ..edit package json

	// ..npm i

	console.log('packages :>> ', packages);
};

module.exports = update;
