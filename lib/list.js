// const fetch = require('node-fetch');
const path = require('path');
const exec = require('await-exec');
const clui = require('clui');
const semver = require('semver');
const chalk = require('chalk');

// const fetchReleases = async (url) => {
// 	const testUrl = 'https://api.github.com/repos/tannerlinsley/react-table/releases';
// 	const response = await fetch(url);
// 	const resData = await response.json();

// 	const releases = resData.map((release) => release.name);
// 	console.log('latest release :>> ', resData[0]);
// };

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

async function list(config, args) {
	const Line = clui.Line;
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

	// make table data
	const columns = await getPackages(config, args || {});

	loading.stop();

	new Line().fill().output();

	new Line()
		.padding(2)
		.column(chalk.underline('Name'), 24)
		.column(chalk.underline('Target'), 10)
		.column(chalk.underline('Current'), 10)
		.column(chalk.underline('Wanted'), 10)
		.column(chalk.underline('Latest'), 10)
		.column(chalk.underline('Upgrade'), 10)
		.column(chalk.underline('Type'), 20)
		.fill()
		.output();

	columns.forEach((dep) => {
		new Line()
			.padding(2)
			.column(dep.name, 24)
			.column(dep.target, 10)
			.column(dep.current, 10)
			.column(dep.wanted, 10)
			.column(chalk.magenta(dep.latest), 10)
			.column(chalk.red(dep.upgrade.latest), 10)
			.column(dep.type, 20)
			.fill()
			.output();
	});

	new Line().fill().output();
}

module.exports = list;
