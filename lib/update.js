const clui = require('clui');
const getPackages = require('./common/getPackages');

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
