const fs = require('fs');
const path = require('path');
const { Spinner, Line } = require('clui');
const chalk = require('chalk');
const exec = require('await-exec');
const getPackages = require('./common/getPackages');

const interactiveUpdate = async (config, args) => {
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
			filter: 'outdated',
		});

		// if there's no packages to upgrade, print message and exit
		if (packages.length < 1) {
			loading.stop();
			new Line().fill().output();

			const message = 'All packages are up to date!';
			console.log(chalk.green(message));

			new Line().fill().output();
			return true;
		}


		
	} catch (error) {
		loading.stop();
		console.error(error);
	}
};

module.exports = interactiveUpdate;
