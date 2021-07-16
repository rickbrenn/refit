const clui = require('clui');
const chalk = require('chalk');
const getPackages = require('./common/getPackages');

// const fetchReleases = async (url) => {
// 	const testUrl = 'https://api.github.com/repos/tannerlinsley/react-table/releases';
// 	const response = await fetch(url);
// 	const resData = await response.json();

// 	const releases = resData.map((release) => release.name);
// 	console.log('latest release :>> ', resData[0]);
// };

async function list(config) {
	const Line = clui.Line;
	const LineBuffer = clui.LineBuffer;
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
	const columns = await getPackages(config);

	const nameLengths = columns.map((col) => col.name.length);
	const maxWidth = Math.max(...nameLengths);
	const nameColumnWidth = maxWidth > 24 ? maxWidth + 4 : 24;

	loading.stop();

	const outputBuffer = new LineBuffer();

	new Line(outputBuffer).fill().store();

	const header = new Line(outputBuffer)
		.padding(2)
		.column(chalk.underline('Name'), nameColumnWidth)
		.column(chalk.underline('Target'), 10)
		.column(chalk.underline('Installed'), 10)
		.column(chalk.underline('Wanted'), 10)
		.column(chalk.underline('Latest'), 10)
		.column(chalk.underline('Upgrade'), 10)
		.column(chalk.underline('Type'), 20);

	if (config.monorepo) {
		header
			.column(chalk.underline('Hoisted'), 10)
			.column(chalk.underline('In'), 20);
	}

	header.fill().store();

	columns.forEach((dep) => {
		// TODO: change to an object?
		let nameColor = 'white';
		let targetColor = 'white';
		let installedColor = 'white';
		let latestColor = 'white';
		let wantedColor = 'white';
		let upgradeColor = 'white';

		if (dep.upgradableToWanted) {
			nameColor = 'red';
			installedColor = 'red';
			wantedColor = 'red';
			latestColor = 'magenta';
			upgradeColor = 'blue';
		}

		if (dep.upgradable && dep.version.installed === dep.version.wanted) {
			nameColor = 'yellow';
			installedColor = 'green';
			wantedColor = 'green';
			latestColor = 'magenta';
			upgradeColor = 'blue';
		}

		if (dep.missing || dep.installNeeded) {
			nameColor = 'grey';
			installedColor = 'grey';
			wantedColor = 'grey';
			latestColor = 'white';
			upgradeColor = 'blue';
		}

		// if the package installed is not the one wanted
		// but the package.json is up to date, display
		// the word INSTALL to signify that an 'npm i' is
		// all that's needed
		// TODO: fix this
		const upgradeText =
			(dep.upgradable && dep.versionRange.latest) ||
			(dep.installNeeded && 'INSTALL') ||
			'';

		// package is defined in the package.json but not
		// in the package-lock.json meaning it hasn't been
		// installed
		const installedText = dep.missing ? 'MISSING' : dep.version?.installed;

		const row = new Line(outputBuffer)
			.padding(2)
			.column(chalk[nameColor](dep.name), nameColumnWidth)
			.column(chalk[targetColor](dep.versionRange?.target), 10)
			.column(chalk[installedColor](installedText), 10)
			.column(chalk[wantedColor](dep.version?.wanted), 10)
			.column(chalk[latestColor](dep.version?.latest), 10)
			.column(chalk[upgradeColor](upgradeText), 10)
			.column(dep.type, 20);

		if (config.monorepo) {
			const manyApps = dep.apps.length > 1;
			const appsDisplay = manyApps
				? `${dep.apps.length} Packages`
				: dep.apps[0];

			row.column(dep.hoisted.toString(), 10).column(appsDisplay, 20);
		}

		row.fill().store();
	});

	new Line(outputBuffer).fill().store();

	outputBuffer.output();
}

module.exports = list;
