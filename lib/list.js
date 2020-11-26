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
