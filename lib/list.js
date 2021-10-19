import clui from 'clui';
import chalk from 'chalk';
import ora from 'ora';
import getPackages from './common/getPackages.js';

// const fetchReleases = async (url) => {
// 	const testUrl = 'https://api.github.com/repos/tannerlinsley/react-table/releases';
// 	const response = await fetch(url);
// 	const resData = await response.json();

// 	const releases = resData.map((release) => release.name);
// 	console.log('latest release :>> ', resData[0]);
// };

const getColorForRow = (pkg) => {
	const colors = {
		name: 'white',
		target: 'white',
		installed: 'white',
		wanted: 'white',
		latest: 'white',
		upgrade: 'white',
		type: 'white',
		hoisted: 'white',
		in: 'white',
	};

	if (pkg.upgradableToWanted) {
		colors.name = 'red';
		colors.installed = 'red';
		colors.wanted = 'red';
		colors.latest = 'magenta';
		colors.upgrade = 'blue';
	}

	if (pkg.upgradable && pkg.version.installed === pkg.version.wanted) {
		colors.name = 'yellow';
		colors.installed = 'green';
		colors.wanted = 'green';
		colors.latest = 'magenta';
		colors.upgrade = 'blue';
	}

	if (pkg.missing || pkg.installNeeded) {
		colors.name = 'grey';
		colors.installed = 'grey';
		colors.wanted = 'grey';
		colors.latest = 'white';
		colors.upgrade = 'blue';
	}

	return colors;
};

const loadPackagesData = async (config) => {
	const spinner = ora({
		text: 'Loading the truck..',
		spinner: {
			interval: 180,
			frames: ['__🚚', '_🚚_', '🚚__'],
		},
		color: 'yellow',
	});

	spinner.start();

	const updateProgress = (progressCurrent, progressMax, packageName) => {
		const percentComplete = (progressCurrent * 100) / progressMax;
		const fixedPercent = percentComplete.toFixed();

		spinner.text = `Delivering packages | ${fixedPercent}% | ${packageName}`;
	};

	try {
		// get packages data
		const packages = await getPackages(config, updateProgress);

		spinner.stopAndPersist({ text: 'Delivery complete!', symbol: '📦' });

		return packages;
	} catch (error) {
		spinner.fail('Something went wrong!');
		throw error;
	}
};

const mapDataToRows = (packagesData) => {
	return packagesData.map((p) => {
		// display version to upgrade to
		const upgradeText = p.upgradable && p.versionRange.latest;

		// if the package is not in node_modules display 'missing'
		const installedText = p.missing ? 'MISSING' : p.version?.installed;

		// how to display the list of packages
		const manyApps = p.apps.length > 1;
		const appsText = manyApps ? `${p.apps.length} Packages` : p.apps[0];

		const values = {
			name: p.name || '',
			target: p.versionRange?.target || '',
			installed: installedText || '',
			wanted: p.version?.wanted || '',
			latest: p.version?.latest || '',
			upgrade: upgradeText || '',
			type: p.type || '',
			hoisted: p.hoisted.toString() || '',
			in: appsText || '',
		};

		const colors = getColorForRow(p);

		// TODO: map columns here instead?
		return {
			name: {
				value: values.name,
				color: colors.name,
			},
			target: {
				value: values.target,
				color: colors.target,
			},
			installed: {
				value: values.installed,
				color: colors.installed,
			},
			wanted: {
				value: values.wanted,
				color: colors.wanted,
			},
			latest: {
				value: values.latest,
				color: colors.latest,
			},
			upgrade: {
				value: values.upgrade,
				color: colors.upgrade,
			},
			type: {
				value: values.type,
				color: colors.type,
			},
			hoisted: {
				value: values.hoisted,
				color: colors.hoisted,
			},
			in: {
				value: values.in,
				color: colors.in,
			},
		};
	});
};

async function list(config) {
	// display the loader while getting the packages data
	const packages = await loadPackagesData(config);

	// map packages to table rows
	const rowData = mapDataToRows(packages);

	// table columns
	const columns = [
		{
			name: 'Name',
			key: 'name',
			show: true,
		},
		{
			name: 'Target',
			key: 'target',
			show: true,
		},
		{
			name: 'Installed',
			key: 'installed',
			show: true,
		},
		{
			name: 'Wanted',
			key: 'wanted',
			show: true,
		},
		{
			name: 'Latest',
			key: 'latest',
			show: true,
		},
		{
			name: 'Upgrade',
			key: 'upgrade',
			show: true,
		},
		{
			name: 'Type',
			key: 'type',
			show: true,
		},
		{
			name: 'Hoisted',
			key: 'hoisted',
			show: config.monorepo,
		},
		{
			name: 'In',
			key: 'in',
			show: config.monorepo,
		},
	];

	const columnGap = 4;
	const minColumnLengths = columns.reduce((acc, curr) => {
		return {
			...acc,
			[curr.key]: curr.name.length + columnGap,
		};
	}, {});

	const maxColumnLengths = rowData.reduce((acc, curr) => {
		const newMaxLengths = { ...acc };

		Object.keys(curr).forEach((key) => {
			const valueLength = curr[key].value?.length || 0;

			if (valueLength > newMaxLengths[key]) {
				newMaxLengths[key] = valueLength + columnGap;
			}
		});

		return newMaxLengths;
	}, minColumnLengths);

	const Line = clui.Line;

	new Line().fill().output();

	const header = new Line().padding(2);

	// add column name to header line
	columns.forEach((c) => {
		const { show, key, name } = c;

		if (show) {
			const columnName = chalk.underline(name);
			// TODO: add this value to the columns object?
			const columnLength = maxColumnLengths[key];

			header.column(columnName, columnLength);
		}
	});

	header.fill().output();

	// add each row to the table
	rowData.forEach((r) => {
		const row = new Line().padding(2);

		// add row data to a new line
		columns.forEach((c) => {
			const { show, key } = c;

			if (show) {
				const { color, value } = r[key];
				const columnValue = chalk[color](value);
				const columnLength = maxColumnLengths[key]; // replace

				row.column(columnValue, columnLength);
			}
		});

		row.fill().output();
	});

	new Line().fill().output();
}

export default list;
