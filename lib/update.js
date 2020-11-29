const fs = require('fs');
const path = require('path');
const clui = require('clui');
const chalk = require('chalk');
const exec = require('await-exec');
const getPackages = require('./common/getPackages');

const update = async (config, args) => {
	const Spinner = clui.Spinner;
	const Line = clui.Line;

	// TODO: move spinner to common file
	const loading = new Spinner('Updating packages..', [
		'⣾',
		'⣽',
		'⣻',
		'⢿',
		'⡿',
		'⣟',
		'⣯',
		'⣷',
	]);

	try {
		loading.start();

		// get list of packages
		const packages = await getPackages(config, {
			filter: args.latest ? 'outdated' : 'wanted',
		});

		// if there's no packages to upgrade, print message and exit
		if (packages.length < 1) {
			loading.stop();
			new Line().fill().output();

			const message = args.latest
				? 'All packages are up to date!'
				: 'All packages meet target version. Run with --latest or -l to check for the latest versions.';
			console.log(chalk.green(message));

			new Line().fill().output();
			return true;
		}

		// TODO: determine path in index?
		const packageJsonData = require(path.join(
			'../',
			config.packageJsonPath
		));

		// determine which version to upgrade to based on args
		const upgradeKey = args.latest ? 'latest' : 'wanted';

		// TODO: re-write this
		// update package.json data
		config.packageTypes.forEach((type) => {
			const filteredPackages = packages.filter(
				(pkg) => pkg.type === type
			);

			filteredPackages.forEach((pkg) => {
				packageJsonData[type][pkg.name] = pkg.upgrade[upgradeKey];
			});
		});

		// update package.json file with new versions
		fs.writeFileSync(
			'package.json',
			JSON.stringify(packageJsonData, null, 2)
		);

		// scrub-a-dub-dub
		if (args.clean) {
			// TODO: path issues?
			// remove the node_modules directory
			fs.rmdirSync(path.join(__dirname, '../node_modules'), {
				recursive: true,
			});

			// TODO: path issues?
			// remove the package-lock.json file
			fs.unlinkSync(path.join(__dirname, '../', config.packageLockPath));
		}

		// install node modules
		if (!args.skipInstall) {
			await exec('npm i');
		}

		loading.stop();

		// display packages that were upgraded
		new Line().fill().output();

		new Line()
			.padding(2)
			.column(chalk.underline('Name'), 24)
			.column(chalk.underline('Previous'), 12)
			.column(chalk.underline('Upgraded To'), 12)
			.fill()
			.output();

		packages.forEach((dep) => {
			new Line()
				.padding(2)
				.column(dep.name, 24)
				.column(dep.target, 12)
				.column(dep.upgrade[upgradeKey], 12)
				.fill()
				.output();
		});

		new Line().fill().output();
	} catch (error) {
		loading.stop();
		console.error(error);
	}
};

module.exports = update;
