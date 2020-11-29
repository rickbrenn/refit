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
		// TODO: change to an object?
		let nameColor = 'white';
		let targetColor = 'white';
		let currentColor = 'white';
		let latestColor = 'white';
		let wantedColor = 'white';
		let upgradeColor = 'white';

		if (dep.upgrade.wanted) {
			nameColor = 'red';
			currentColor = 'red';
			wantedColor = 'red';
			latestColor = 'magenta';
			upgradeColor = 'blue';
		}

		if (!dep.upgrade.wanted && dep.upgrade.latest) {
			nameColor = 'yellow';
			currentColor = 'green';
			wantedColor = 'green';
			latestColor = 'magenta';
			upgradeColor = 'blue';
		}

		if (dep.missing || dep.installNeeded) {
			nameColor = 'grey';
			currentColor = 'grey';
			wantedColor = 'grey';
			latestColor = 'white';
			upgradeColor = 'blue';
		}

		// if the package installed is not the one wanted
		// but the package.json is up to date, display
		// the word INSTALL to signify that an 'npm i' is
		// all that's needed
		const upgradeText = dep.installNeeded ? 'INSTALL' : dep.upgrade.latest;

		// package is defined in the package.json but not
		// in the package-lock.json meaning it hasn't been
		// installed
		const currentText = dep.missing ? 'MISSING' : dep.current;

		new Line()
			.padding(2)
			.column(chalk[nameColor](dep.name), 24)
			.column(chalk[targetColor](dep.target), 10)
			.column(chalk[currentColor](currentText), 10)
			.column(chalk[wantedColor](dep.wanted), 10)
			.column(chalk[latestColor](dep.latest), 10)
			.column(chalk[upgradeColor](upgradeText), 10)
			.column(dep.type, 20)
			.fill()
			.output();
	});

	new Line().fill().output();
}

module.exports = list;
