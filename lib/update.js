import fs from 'node:fs';
import path from 'node:path';
import clui from 'clui';
import chalk from 'chalk';
import exec from 'await-exec';
import getPackages from './common/getPackages.js';

const update = async (config, args) => {
	// TODO: move spinner to common file
	const loading = new clui.Spinner('Updating packages..', [
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
			packages: args.packages,
		});

		// if there's no packages to upgrade, print message and exit
		if (packages.length < 1) {
			loading.stop();
			new clui.Line().fill().output();

			const message = args.latest
				? 'All packages are up to date!'
				: 'All packages meet target version. Run with --latest or -l to check for the latest versions.';
			console.log(chalk.green(message));

			new clui.Line().fill().output();
			return true;
		}

		// TODO: determine path in index?
		const packageJsonData = fs.readFileSync(
			path.resolve(config.packageJsonPath)
		);

		// determine which version to upgrade to based on args
		const upgradeKey = args.latest ? 'latest' : 'wanted';

		// TODO: re-write this
		// update package.json data
		config.packageTypes.forEach((type) => {
			const filteredPackages = packages.filter(
				(pkg) => pkg.type === type
			);

			filteredPackages.forEach((pkg) => {
				packageJsonData[type][pkg.name] = pkg.versionRange[upgradeKey];
			});
		});

		// update package.json file with new versions
		fs.writeFileSync(
			'package.json',
			JSON.stringify(packageJsonData, null, 2)
		);

		// scrub-a-dub-dub
		if (args.clean) {
			// remove the node_modules directory
			fs.rmdirSync(path.resolve('node_modules'), {
				recursive: true,
			});

			// remove the package-lock.json file
			fs.unlinkSync(path.resolve(config.packageLockPath));
		}

		// install node modules
		if (!args.skipInstall) {
			await exec('npm i');
		}

		loading.stop();

		// display packages that were upgraded
		new clui.Line().fill().output();

		new clui.Line()
			.padding(2)
			.column(chalk.underline('Name'), 24)
			.column(chalk.underline('Previous'), 12)
			.column(chalk.underline('Upgraded To'), 12)
			.fill()
			.output();

		packages.forEach((dep) => {
			new clui.Line()
				.padding(2)
				.column(dep.name, 24)
				.column(dep.versionRange.target, 12)
				.column(dep.versionRange[upgradeKey], 12)
				.fill()
				.output();
		});

		new clui.Line().fill().output();
	} catch (error) {
		loading.stop();
		console.error(error);
	}
};

export default update;
