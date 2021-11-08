import fs from 'fs';
import path from 'path';
import clui from 'clui';
import chalk from 'chalk';
import exec from 'await-exec';
import inquirer from 'inquirer';
import getPackages from './common/getPackages.js';

const interactiveUpdate = async (config, args) => {
	// TODO: move spinner to common file
	const loading = new clui.Spinner('Looking up packages..', [
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
			filter: 'outdated',
		});

		// if there's no packages to upgrade, print message and exit
		if (packages.length < 1) {
			loading.stop();
			new clui.Line().fill().output();

			const message = 'All packages are up to date!';
			console.log(chalk.green(message));

			new clui.Line().fill().output();
			return true;
		}

		loading.stop();

		const packageChoices = packages.map((pkg) => {
			return {
				name: pkg.name,
				value: pkg.name,
			};
		});

		const answers = await inquirer.prompt([
			{
				type: 'checkbox',
				name: 'packages',
				message: 'Select the packages to update:',
				pageSize: 20,
				loop: false,
				choices: packageChoices,
			},
			{
				type: 'list',
				name: 'version',
				message: 'Update to:',
				choices: [
					{ name: 'Wanted', value: 'wanted' },
					{ name: 'Latest', value: 'latest' },
				],
			},
			{
				type: 'list',
				name: 'action',
				message: 'Choose what action to take:',
				choices: [
					{ name: 'Update', value: 'update' },
					{
						name: 'Update and install',
						value: 'install',
					},
					{
						name: 'Update and clean install',
						value: 'clean',
					},
				],
			},
		]);

		loading.message('updating packages...');
		loading.start();

		// TODO: determine path in index?
		const packageJsonData = fs.readFileSync(
			path.resolve(config.packageJsonPath)
		);

		// determine which version to upgrade to based on answers
		const upgradeKey = answers.version;

		const packagesToUpdate = packages.filter((pkg) =>
			answers.packages.includes(pkg.name)
		);

		// TODO: re-write this
		// update package.json data
		config.packageTypes.forEach((type) => {
			const filteredPackages = packagesToUpdate.filter(
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
		if (answers.action === 'clean') {
			// remove the node_modules directory
			fs.rmdirSync(path.resolve('node_modules'), {
				recursive: true,
			});

			// remove the package-lock.json file
			fs.unlinkSync(path.resolve(config.packageLockPath));
		}

		// install node modules
		if (answers.action !== 'update') {
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

		packagesToUpdate.forEach((dep) => {
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

export default interactiveUpdate;
